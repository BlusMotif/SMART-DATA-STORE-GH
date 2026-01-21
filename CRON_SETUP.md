# Cron Job Setup for Order Status Updates

This document explains how to set up automated order status updates from the SkyTech API using cron jobs.

## Overview

The system now supports real-time order status updates from SkyTech API instead of marking orders as completed immediately after payment. Orders go through these stages:

1. **Payment Completed** → Status: `completed`, Delivery: `processing`
2. **Cron Job Checks SkyTech** → Updates delivery status based on SkyTech response
3. **Final Status** → Delivery: `delivered`, `failed`, or `permanently_failed`

## Available Cron Endpoints

### 1. Update Order Statuses
**Endpoint:** `POST /api/cron/update-order-statuses`

Checks all transactions with `status = 'completed'` and `deliveryStatus = 'processing'`, queries SkyTech API for their status, and updates accordingly.

### 2. Cleanup Failed Orders
**Endpoint:** `POST /api/cron/cleanup-failed-orders`

Moves orders that have been in `failed` status for more than 24 hours to `permanently_failed` status.

## Setting Up Cron Jobs

### Option 1: Using the Provided Script (Recommended)

1. **Make the script executable:**
   ```bash
   chmod +x script/update-order-statuses.js
   ```

2. **Add to crontab (run every 5 minutes):**
   ```bash
   crontab -e
   ```

   Add this line:
   ```
   */5 * * * * cd /path/to/your/project && node script/update-order-statuses.js
   ```

### Option 2: Direct API Calls

If you prefer to call the API directly:

```bash
# Update order statuses every 5 minutes
*/5 * * * * curl -X POST http://your-domain.com/api/cron/update-order-statuses

# Cleanup failed orders daily at 2 AM
0 2 * * * curl -X POST http://your-domain.com/api/cron/cleanup-failed-orders
```

### Option 3: Using a Task Scheduler (Windows)

On Windows, you can use Task Scheduler:

1. Open Task Scheduler
2. Create a new task
3. Set trigger to run every 5 minutes
4. Set action to run: `node script/update-order-statuses.js`
5. Set the working directory to your project root

## Environment Variables

Make sure these environment variables are set:

```env
# SkyTech API Configuration
SKYTECH_API_KEY=your_api_key_here
SKYTECH_API_SECRET=your_api_secret_here
SKYTECH_API_ENDPOINT=https://skytechgh.com/api/v1/orders

# Frontend URL for the cron script
FRONTEND_URL=https://your-domain.com
```

## Status Mapping

The system maps SkyTech statuses to internal statuses:

| SkyTech Status | Internal Delivery Status | Action |
|----------------|------------------------|---------|
| `completed`, `delivered`, `success` | `delivered` | Sets `completedAt` timestamp |
| `failed`, `error` | `failed` | No completion timestamp |
| `processing`, `pending` | `processing` | Keeps processing status |
| Other | No change | Logs unknown status |

## Monitoring

### Logs

The cron jobs log their activity. Check your server logs for entries like:
```
[Cron] Starting order status update check
[Cron] Found X transactions to check
[Cron] Updated transaction XXX delivery status to delivered
```

### Manual Testing

You can test the cron endpoints manually:

```bash
# Test order status updates
curl -X POST http://localhost:10000/api/cron/update-order-statuses

# Test cleanup
curl -X POST http://localhost:10000/api/cron/cleanup-failed-orders
```

### Database Queries

Check order statuses in your database:

```sql
-- Check processing orders
SELECT id, reference, delivery_status, created_at, api_response
FROM transactions
WHERE status = 'completed' AND delivery_status = 'processing'
ORDER BY created_at DESC;

-- Check recently delivered orders
SELECT id, reference, delivery_status, completed_at, api_response
FROM transactions
WHERE delivery_status = 'delivered'
ORDER BY completed_at DESC;
```

## Troubleshooting

### Common Issues

1. **"No SkyTech reference found"**
   - The transaction's `apiResponse` doesn't contain a valid SkyTech order reference
   - Check that the SkyTech API integration is working correctly

2. **"Failed to get status for SkyTech ref"**
   - SkyTech API is unreachable or returning errors
   - Check your SkyTech API credentials and network connectivity

3. **Orders stuck in "processing"**
   - Cron job might not be running
   - SkyTech might be taking longer than expected to process
   - Check SkyTech status manually using their API

### Debugging

Enable more detailed logging by checking the server logs when the cron job runs. You can also add temporary logging to the cron endpoints for debugging.

## Performance Considerations

- The cron job includes a 100ms delay between API calls to avoid overwhelming SkyTech
- For high-volume deployments, consider increasing the cron frequency or implementing batch processing
- Monitor your SkyTech API rate limits and adjust accordingly

## Security

The cron endpoints don't require authentication since they're meant to be called by automated systems. In production, consider:

- IP whitelisting for the cron job server
- Using API keys for the cron endpoints
- Running cron jobs on a separate, secure server