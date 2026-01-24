# Session Timeout Fix Documentation

## Problem Description
When a user's session timed out, the account would get stuck and users couldn't logout. This was caused by multiple race conditions:

1. **Duplicate Logout Calls**: When session timeout triggered, the `logout()` function could be called multiple times simultaneously (from inactivity timeout, manual logout button click, or API 401 responses)
2. **API 401 Auto-Logout Race**: When API requests returned 401 (unauthorized), multiple concurrent API calls would all try to call `supabase.auth.signOut()` simultaneously
3. **Insufficient Error Handling**: If the logout process encountered an error, it would fail silently, leaving the user stuck in an inconsistent state

## Root Causes

### 1. Race Condition in useAuth Hook
The `logout()` function in [use-auth.ts](client/src/hooks/use-auth.ts) had no protection against duplicate calls:
```typescript
// BEFORE (Problematic)
const logout = async () => {
  setIsLoggingOut(true);
  await supabase.auth.signOut();
  setIsLoggingOut(false);
  window.location.href = "/";
};
```

### 2. Race Condition in API Request Handler
The `apiRequest()` function in [api.ts](client/src/lib/api.ts) would trigger auto-logout on 401 errors, but had no lock:
```typescript
// BEFORE (Problematic)
if (response.status === 401 && !disableAutoLogout) {
  await supabase.auth.signOut();
  window.location.href = '/login';
  throw new Error('Session expired. Please log in again.');
}
```

### 3. Silent Failures in Session Timeout
The session timeout hook had no error handling for logout failures:
```typescript
// BEFORE (Problematic)
timeoutRef.current = window.setTimeout(async () => {
  await logout();
}, INACTIVITY_TIMEOUT);
```

## Solutions Implemented

### 1. Added Logout Lock in useAuth Hook
Added a ref-based lock to prevent duplicate logout calls:

**File**: [client/src/hooks/use-auth.ts](client/src/hooks/use-auth.ts)

```typescript
// Added useRef import
import { useEffect, useState, useRef } from "react";

// Added lock ref
const logoutInProgressRef = useRef(false);

// Improved logout function
const logout = async () => {
  // Prevent duplicate logout calls
  if (logoutInProgressRef.current) {
    console.log('Logout already in progress, skipping duplicate call');
    return;
  }
  
  try {
    logoutInProgressRef.current = true;
    setIsLoggingOut(true);
    
    // Clear all queries first
    queryClient.clear();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear session state
    setSession(null);
    
    // Force redirect to home page
    window.location.href = "/";
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, clear local state and redirect
    queryClient.clear();
    setSession(null);
    window.location.href = "/";
  } finally {
    setIsLoggingOut(false);
    logoutInProgressRef.current = false;
  }
};
```

### 2. Added Auto-Logout Lock in API Handler
Added a module-level lock to prevent duplicate 401 auto-logout attempts:

**File**: [client/src/lib/api.ts](client/src/lib/api.ts)

```typescript
// Lock to prevent duplicate 401 auto-logout attempts
let autoLogoutInProgress = false;

// In apiRequest function
if (response.status === 401 && !disableAutoLogout && !autoLogoutInProgress) {
  autoLogoutInProgress = true;
  try {
    await supabase.auth.signOut();
    window.location.href = '/login';
  } catch (error) {
    console.error('Auto-logout failed:', error);
    // Force redirect even if signOut fails
    window.location.href = '/login';
  }
  throw new Error('Session expired. Please log in again.');
}
```

### 3. Added Error Handling in Session Timeout Hook
Added try-catch and fallback redirect:

**File**: [client/src/hooks/use-session-timeout.ts](client/src/hooks/use-session-timeout.ts)

```typescript
timeoutRef.current = window.setTimeout(async () => {
  try {
    console.log('Session timeout: Logging out user due to inactivity');
    // Silent logout after inactivity
    await logout();
  } catch (error) {
    console.error('Session timeout logout error:', error);
    // Force redirect even if logout fails
    window.location.href = '/login';
  }
}, INACTIVITY_TIMEOUT);
```

## Benefits

1. **No More Stuck Accounts**: Users can always logout or will be automatically redirected even if errors occur
2. **Prevents Race Conditions**: Only one logout process can run at a time
3. **Graceful Error Handling**: Even if Supabase signOut fails, the app will clear state and redirect
4. **Better Logging**: Console logs help debug issues in production
5. **Clean State**: QueryClient is cleared before logout to prevent stale data

## Testing Recommendations

### Manual Testing Steps:
1. **Test Inactivity Timeout**:
   - Log in to the app
   - Wait 5 minutes without any interaction
   - Verify you're automatically logged out and redirected

2. **Test Manual Logout During Timeout**:
   - Log in to the app
   - Wait 4+ minutes
   - Click logout button before timeout
   - Verify logout works without errors

3. **Test API 401 Response**:
   - Log in to the app
   - Use browser DevTools to delete the Supabase session from localStorage
   - Try to navigate or perform an action that requires authentication
   - Verify you're redirected to login page

4. **Test Multiple Concurrent Logouts**:
   - Log in to the app
   - Open browser console
   - Manually trigger multiple logout calls quickly
   - Verify only one logout executes (check console logs)

### Expected Behavior:
- Users should never get stuck in a logged-in state when session expires
- Logout should always complete successfully or force redirect
- No duplicate logout calls should execute
- Console should show clear logging of logout operations

## Files Modified

1. [client/src/hooks/use-auth.ts](client/src/hooks/use-auth.ts) - Added logout lock and error handling
2. [client/src/lib/api.ts](client/src/lib/api.ts) - Added auto-logout lock
3. [client/src/hooks/use-session-timeout.ts](client/src/hooks/use-session-timeout.ts) - Added error handling

## Additional Context

The session timeout is currently set to **5 minutes** of inactivity (`INACTIVITY_TIMEOUT = 5 * 60 * 1000`). This can be adjusted in [use-session-timeout.ts](client/src/hooks/use-session-timeout.ts).

The ProtectedRoute component in [ProtectedRoute.tsx](client/src/components/ProtectedRoute.tsx) will automatically redirect users to login when `user` becomes null, providing an additional safety net.

## Related Components

- **useAuth Hook**: Manages authentication state and logout function
- **ProtectedRoute**: Guards routes that require authentication
- **useSessionTimeout**: Monitors user inactivity and triggers logout
- **apiRequest**: Handles API calls and 401 auto-logout

## Deployment Notes

- No database migrations required
- No environment variable changes needed
- Changes are backward compatible
- Existing user sessions will not be affected
- Users may notice improved logout reliability immediately
