# SkyTech Status Synchronization

This document explains how transaction statuses are synchronized between the app and SkyTech API.

## Status Conventions

The app now uses SkyTech's standard status naming conventions across all pages:

### Transaction Statuses
- **Pending**: Payment received, order submitted to SkyTech, awaiting processing
- **Processing**: SkyTech is actively processing the delivery
- **Completed**: Order successfully delivered by SkyTech
- **Failed**: Order failed at some point in the process

### Status Colors
- **Completed**: Green badge with checkmark icon
- **Processing**: Blue badge with layers icon
- **Pending**: Amber/yellow badge with clock icon
- **Failed**: Red badge with X icon

## Automatic Status Synchronization

### Cron Job
The system runs a cron job every 5-10 minutes that:
1. Fetches all transactions with status='pending' and deliveryStatus='processing'
2. Checks their status with SkyTech using the SkyTech reference
3. Updates both transaction status and deliveryStatus based on SkyTech's response

### Status Mapping
SkyTech statuses are mapped as follows:

| SkyTech Status | Internal Status | Delivery Status | Notes |
|---------------|-----------------|-----------------|-------|
| Pending | pending | pending | Initial state after order submission |
| Processing | pending | processing | SkyTech is working on delivery |
| Completed/Delivered/Success | completed | delivered | Order successfully delivered |
| Failed/Error | failed | failed | Order failed during processing |

### Flow Diagram
```
User Payment → Transaction Created (status: pending, deliveryStatus: pending)
    ↓
SkyTech API Call → Order Submitted (status: pending, deliveryStatus: processing)
    ↓
Cron Job Check → SkyTech Returns Status
    ↓
    ├─ If "Processing" → (status: pending, deliveryStatus: processing)
    ├─ If "Completed" → (status: completed, deliveryStatus: delivered, completedAt: now)
    └─ If "Failed" → (status: failed, deliveryStatus: failed)
```

## Implementation Details

### Backend
- **Cron Endpoint**: `/api/cron/update-order-statuses`
- **Status Check Function**: `getExternalOrderStatus()` in `src/server/providers.ts`
- **Location**: Lines 7396-7494 in `src/server/routes.ts`

### Frontend
Status display is standardized across all pages:
- **User History**: [client/src/pages/user/history.tsx](client/src/pages/user/history.tsx)
- **User Wallet**: [client/src/pages/user/wallet.tsx](client/src/pages/user/wallet.tsx)
- **Admin Transactions**: [client/src/pages/admin/transactions.tsx](client/src/pages/admin/transactions.tsx)
- **Status Badge Component**: [client/src/components/ui/status-badge.tsx](client/src/components/ui/status-badge.tsx)

### Status Checks
The cron job:
- Runs every 5-10 minutes (configurable)
- Only checks data bundle transactions with deliveryStatus='processing'
- Parses SkyTech reference from apiResponse JSON
- Updates both status and deliveryStatus atomically
- Logs all status changes for debugging

## Testing Status Updates

To test the status synchronization:

1. **Submit a test order** through the checkout flow
2. **Check initial status**: Should be `pending` with deliveryStatus `processing`
3. **Wait for cron job**: Runs every 5-10 minutes
4. **Monitor logs**: Look for `[Cron] Updated transaction` messages
5. **Verify frontend**: Status should update automatically on next page refresh

## Manual Status Checks

Admin users can manually trigger status checks by:
1. Navigating to Admin → Transactions
2. Viewing transaction details
3. Checking the apiResponse field for SkyTech status

## Important Notes

1. **Automatic Updates**: Status changes from SkyTech are reflected automatically - no manual intervention needed
2. **Real-time Display**: Users see updated statuses when they refresh the page or every 15 seconds via auto-refresh
3. **Status History**: All status changes are logged in the apiResponse field for debugging
4. **Cron Frequency**: Can be adjusted in the cron scheduler configuration
5. **Transaction Pages**: All transaction display pages now use consistent status labeling

## Troubleshooting

### Status Not Updating
- Check cron job logs for errors
- Verify SkyTech API credentials are valid
- Ensure transaction has a valid SkyTech reference in apiResponse
- Check network connectivity to SkyTech API

### Wrong Status Displayed
- Clear browser cache and refresh
- Check transaction record in database
- Verify status mapping logic in routes.ts line 7439-7459

### Delayed Updates
- Normal delay: 5-10 minutes between cron runs
- Can adjust cron frequency if needed
- Consider webhook implementation for instant updates
