# User Registration System Documentation

## Overview
This system ensures that all users are automatically synchronized between Supabase Auth and the local PostgreSQL database.

## How It Works

### 1. Registration Flow (`POST /api/auth/register`)
When a user registers:
1. **Supabase Auth**: User account is created in Supabase Authentication
2. **Local Database**: User record is created in the `users` table with the **same ID as Supabase**
3. **Password**: Hashed password is stored in local database for backup/validation
4. **Wallet**: User's `walletBalance` is initialized to 0.00
5. **Rollback**: If database creation fails, the Supabase user is automatically deleted to maintain consistency

### 2. Auto-Creation via Auth Middleware (`requireAuth`)
If a user exists in Supabase but not in the database (edge case):
1. **Detection**: When the user makes any authenticated API request
2. **Auto-Create**: The middleware automatically creates a database record
3. **ID Sync**: Uses the Supabase user ID as the database primary key
4. **Empty Password**: Password is set to empty string (auth is handled by Supabase)
5. **Continue**: Request continues normally after user creation

## Key Changes Made

### 1. Schema Updates (`shared/schema.ts`)
```typescript
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
}).extend({
  id: z.string().optional(), // Allow optional id for Supabase user ID
});
```
- Removed `id: true` from omit list
- Added `.extend()` to allow optional `id` field
- This allows passing Supabase user ID during creation

### 2. Storage Layer (`server/storage.ts`)
```typescript
async createUser(insertUser: InsertUser): Promise<User> {
  // ...validation...
  
  // Allow empty password for Supabase-authenticated users
  if (insertUser.password !== undefined && insertUser.password !== '' && typeof insertUser.password !== 'string') {
    throw new Error("Invalid password");
  }
  
  const result = await db.insert(users).values({
    ...insertUser,
    email: normalizedEmail,
    password: insertUser.password || '', // Default to empty string if not provided
  }).returning();
  return result[0];
}
```
- Modified password validation to accept empty strings
- Defaults password to empty string if not provided
- This supports Supabase-managed authentication

### 3. Registration Endpoint (`server/routes.ts`)
```typescript
// Create user in local database with Supabase user ID
const hashedPassword = await bcrypt.hash(data.password, 10);
const user = await storage.createUser({
  id: supabaseData.user.id, // Use Supabase user ID
  email: data.email,
  password: hashedPassword,
  // ...other fields...
});

// Rollback on failure
if (dbError) {
  await supabaseServer.auth.admin.deleteUser(supabaseData.user.id);
}
```
- Uses `id: supabaseData.user.id` to sync IDs
- Implements rollback mechanism
- Ensures atomic creation (both succeed or both fail)

### 4. Auth Middleware (`server/routes.ts`)
```typescript
if (!dbUser) {
  const newUser = await storage.createUser({
    id: user.id, // Use Supabase user ID for consistency
    email: user.email,
    password: "", // Empty password for Supabase-managed auth
    // ...other fields...
  });
}
```
- Auto-creates missing users with Supabase ID
- Uses empty password for Supabase-managed auth
- Maintains ID consistency across systems

## Benefits

1. **Data Consistency**: Same user ID in both Supabase and local database
2. **No Lost Users**: Registration is atomic - both systems succeed or fail together
3. **Auto-Recovery**: Middleware creates missing users automatically
4. **Wallet Support**: New users automatically get wallet balance initialized
5. **Role Management**: Role is synced from Supabase metadata to database

## Testing

### Test New User Registration
1. Navigate to `/register` page
2. Create a new account
3. **Expected Results**:
   - User created in Supabase Auth ✅
   - User record in database with same ID ✅
   - Wallet balance = 0.00 ✅
   - Can access dashboard immediately ✅
   - No 404 errors on `/api/transactions` ✅

### Test Auto-Creation
1. Manually create a user in Supabase (without database entry)
2. Login with that user
3. **Expected Results**:
   - Database record auto-created on first API request ✅
   - User ID matches Supabase ID ✅
   - All API endpoints work correctly ✅

## Error Handling

### Scenario 1: Database Down During Registration
- Registration fails completely
- Supabase user is deleted (rollback)
- User sees error message
- No orphaned accounts

### Scenario 2: Existing User in Database
- Supabase rejects duplicate email
- Database insertion never happens
- User sees "Email already exists" error

### Scenario 3: User in Supabase, Not in Database
- Auth middleware detects missing record
- Auto-creates database entry with Supabase ID
- Request continues normally
- Logged for monitoring

## Monitoring

Watch for these log messages:
- `"Creating user in database:"` - Auto-creation triggered
- `"User created in database with role:"` - Auto-creation succeeded
- `"Failed to create user in database:"` - Auto-creation failed (user can still authenticate via Supabase)
- `"Database error creating user:"` - Registration database failure (Supabase user will be deleted)

## Admin Users

Special case: `eleblununana@gmail.com`
- Hardcoded as admin in auth middleware
- Role is always set to 'admin' regardless of database
- This ensures admin access even if database is temporarily unavailable
