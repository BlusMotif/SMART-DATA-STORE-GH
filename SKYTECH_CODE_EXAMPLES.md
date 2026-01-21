# SkyTech API Fix - Code Examples

## Problem: PHP Backend Requires Form-Encoded Data

PHP automatically populates `$_POST` from form-encoded requests, but **NOT** from JSON.

```php
// On SkyTech (PHP side) when you send JSON:
$_POST['recipient']    // ❌ NULL
$_POST['capacity']     // ❌ NULL

// On SkyTech (PHP side) when you send form-encoded:
$_POST['recipient']    // ✅ \"0546591622\"
$_POST['capacity']     // ✅ \"4\"
```

---

## Solution 1: Send Form-Encoded Data

### BEFORE (Broken)
```typescript
const body = JSON.stringify({
  network: apiNetwork,
  recipient: phone,
  capacity: Math.round(capacity),
  idempotency_key: idempotencyKey
});

const resp = await fetch(apiEndpoint, {
  method: \"POST\",
  headers: {
    \"Content-Type\": \"application/json\",
    \"Authorization\": `Bearer ${apiKey}`,
    \"X-Timestamp\": ts,
    \"X-Signature\": signature,
  },
  body: body,  // ❌ Sends: {\"network\":\"MTN\",...}
});
```

### AFTER (Fixed)
```typescript
const formBody = new URLSearchParams({
  network: apiNetwork,
  recipient: phone,
  capacity: Math.round(capacity).toString(),
  idempotency_key: idempotencyKey
});

const formBodyString = formBody.toString();
// Result: \"network=MTN&recipient=0546591622&capacity=4&idempotency_key=...\"

const resp = await fetch(apiEndpoint, {
  method: \"POST\",
  headers: {
    \"Content-Type\": \"application/x-www-form-urlencoded\",
    \"Authorization\": `Bearer ${apiKey}`,
    \"X-Timestamp\": ts,
    \"X-Signature\": signature,
    \"User-Agent\": \"Mozilla/5.0\",
    \"Referer\": \"https://resellershubprogh.com\"
  },
  body: formBodyString,  // ✅ Sends: network=MTN&recipient=...
});
```

---

## Solution 2: Signature Must Match Request Body

### Signature Message Format
```
{timestamp}
{method}
{path}
{request_body}
```

### BEFORE (Wrong - Signs JSON)
```typescript
const body = JSON.stringify({
  network: 'MTN',
  recipient: '0546591622',
  capacity: 4
});

const ts = '1705859234';
const method = 'POST';
const path = '/api/v1/orders';

// ❌ WRONG: Signing JSON string
const message = `${ts}\\n${method}\\n${path}\\n${body}`;
// Result: \"1705859234\\nPOST\\n/api/v1/orders\\n{\\\"network\\\":\\\"MTN\\\",\\\"recipient\\\":\\\"0546591622\\\",\\\"capacity\\\":4}\"

const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
```

### AFTER (Fixed - Signs Form Data)
```typescript
const formBody = new URLSearchParams({
  network: 'MTN',
  recipient: '0546591622',
  capacity: '4'
});
const formBodyString = formBody.toString();
// Result: \"network=MTN&recipient=0546591622&capacity=4\"

const ts = '1705859234';
const method = 'POST';
const path = '/api/v1/orders';

// ✅ CORRECT: Signing form data string
const message = `${ts}\\n${method}\\n${path}\\n${formBodyString}`;
// Result: \"1705859234\\nPOST\\n/api/v1/orders\\nnetwork=MTN&recipient=0546591622&capacity=4\"

const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
```

**Critical:** The signature must be calculated from the exact same body string being sent!

---

## Solution 3: PHP Validation Reference

Here's how SkyTech validates the request:

```php
<?php
// SkyTech PHP backend

// 1. Get headers
$timestamp = $_SERVER['HTTP_X_TIMESTAMP'];           // \"1705859234\"
$signature = $_SERVER['HTTP_X_SIGNATURE'];           // \"abc123def456...\"
$authHeader = $_SERVER['HTTP_AUTHORIZATION'];        // \"Bearer your-api-key\"

// 2. Get raw request body (before PHP parses it)
$rawBody = file_get_contents('php://input');
// $rawBody = \"network=MTN&recipient=0546591622&capacity=4&idempotency_key=xxx\"

// 3. Reconstruct the signature message
$method = 'POST';
$path = '/api/v1/orders';
$message = \"$timestamp\\n$method\\n$path\\n$rawBody\";

// 4. Calculate expected signature
$apiSecret = 'your-api-secret';
$expectedSig = hash_hmac('sha256', $message, $apiSecret, false); // false = hex output

// 5. Validate signature
if ($signature !== $expectedSig) {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid signature']));
}

// 6. NOW parse the form data
parse_str($rawBody, $_POST);
// Now $_POST has:
//   $_POST['network'] = 'MTN'
//   $_POST['recipient'] = '0546591622'
//   $_POST['capacity'] = '4'
//   $_POST['idempotency_key'] = 'xxx'

// 7. Process the order
$network = $_POST['network'];
$recipient = $_POST['recipient'];
$capacity = (int)$_POST['capacity'];

// ... rest of order processing ...
?>
```

---

## Solution 4: Transaction Status Logic

### The Revenue-Critical Bug

**BEFORE (Lost Money)**
```typescript
// In routes.ts webhook handler
const fulfillResult = await fulfillDataBundleTransaction(transaction);

// ❌ BUG: Only checks if overall request succeeded, not individual items
if (fulfillResult && fulfillResult.success) {
  // Mark as PENDING even if SkyTech rejected some/all items!
  await storage.updateTransaction(transaction.id, {
    status: TransactionStatus.PENDING,
    deliveryStatus: \"processing\",
  });
} else {
  // Mark as failed
  await storage.updateTransaction(transaction.id, {
    status: TransactionStatus.FAILED,
  });
}

// Result:
// fulfillResult = {
//   success: true,           // Request was sent successfully
//   results: [
//     { phone: '0546591622', status: 'failed', error: 'Invalid number' },  // ❌ Item failed!
//     { phone: '0546591623', status: 'failed', error: 'Invalid number' }   // ❌ Item failed!
//   ]
// }
// → Transaction marked PENDING but items actually failed
// → Money counted but data never delivered
// → REVENUE LOSS!
```

**AFTER (Correct)**
```typescript
const fulfillResult = await fulfillDataBundleTransaction(transaction);

// ✅ FIXED: Check if ALL items succeeded
if (fulfillResult && fulfillResult.success && fulfillResult.results) {
  const allSuccess = fulfillResult.results.every(r => r.status === 'pending' || r.status === 'success');
  
  if (allSuccess) {
    // All items accepted by provider
    await storage.updateTransaction(transaction.id, {
      status: TransactionStatus.PENDING,    // Waiting for delivery confirmation
      deliveryStatus: \"processing\",
    });
  } else {
    // Some items were rejected
    const failedItems = fulfillResult.results.filter(r => r.status === 'failed');
    await storage.updateTransaction(transaction.id, {
      status: TransactionStatus.FAILED,
      deliveryStatus: \"failed\",
      completedAt: new Date(),
      failureReason: `Provider rejected ${failedItems.length}/${fulfillResult.results.length} items: ${
        failedItems.map(r => r.error || 'Unknown error').join(', ')
      }`,
    });
  }
} else {
  // Overall request failed
  await storage.updateTransaction(transaction.id, {
    status: TransactionStatus.FAILED,
    deliveryStatus: \"failed\",
  });
}

// Result:
// fulfillResult = {
//   success: true,
//   results: [
//     { phone: '0546591622', status: 'failed', error: 'Invalid number' },
//     { phone: '0546591623', status: 'failed', error: 'Invalid number' }
//   ]
// }
// → Transaction marked FAILED ✅
// → Money not counted as delivered ✅
// → Revenue accurate ✅
```

---

## Solution 5: Error Handling in Exception Cases

### BEFORE (Wrong)
```typescript
try {
  const fulfillResult = await fulfillDataBundleTransaction(transaction);
  // ... handle result ...
} catch (err: any) {
  console.error(\"Fulfillment error:\", err);
  // ❌ Marking exception as COMPLETED?!
  await storage.updateTransaction(transaction.id, {
    status: TransactionStatus.COMPLETED,
    deliveryStatus: \"failed\",
  });
}
// If an exception occurs during fulfillment:
// - Payment was received (true)
// - But fulfillment threw error (true)
// - Yet marked as COMPLETED (FALSE - wrong!)
```

### AFTER (Correct)
```typescript
try {
  const fulfillResult = await fulfillDataBundleTransaction(transaction);
  // ... handle result ...
} catch (err: any) {
  console.error(\"Fulfillment error:\", err);
  // ✅ Marking exception as FAILED (correct)
  await storage.updateTransaction(transaction.id, {
    status: TransactionStatus.FAILED,  // Fixed!
    deliveryStatus: \"failed\",
    completedAt: new Date(),
    failureReason: String(err?.message || err),
    paymentStatus: \"paid\",  // Payment was received
  });
}
// Now:
// - Payment status: PAID ✅
// - Delivery status: FAILED ✅
// - Transaction status: FAILED ✅
// - Can be manually reviewed/retried ✅
```

---

## Complete Working Example

### Node.js/TypeScript
```typescript
import crypto from 'crypto';

async function sendToSkyTech(phone: string, capacity: number) {
  const apiKey = process.env.SKYTECH_API_KEY;
  const apiSecret = process.env.SKYTECH_API_SECRET;
  const endpoint = 'https://skytechgh.com/api/v1/orders';

  // 1. Prepare form data
  const formBody = new URLSearchParams({
    network: 'MTN',
    recipient: phone,
    capacity: capacity.toString(),
    idempotency_key: `order-${Date.now()}`
  });
  const formBodyString = formBody.toString();
  console.log('Form body:', formBodyString);

  // 2. Generate signature
  const ts = Math.floor(Date.now() / 1000).toString();
  const message = `${ts}\\nPOST\\n/api/v1/orders\\n${formBodyString}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
  console.log('Signature:', signature);

  // 3. Send request
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${apiKey}`,
      'X-Timestamp': ts,
      'X-Signature': signature
    },
    body: formBodyString
  });

  // 4. Handle response
  const data = await response.json();
  console.log('Response:', data);

  if (response.ok && data.status === 'success') {
    return { success: true, ref: data.ref };
  } else {
    return { success: false, error: data.error || 'Unknown error' };
  }
}

// Usage
const result = await sendToSkyTech('0546591622', 4);
if (result.success) {
  console.log('Order placed:', result.ref);
} else {
  console.log('Order failed:', result.error);
}
```

### Testing with cURL
```bash
NETWORK=\"MTN\"
RECIPIENT=\"0546591622\"
CAPACITY=\"4\"
IDEMPOTENCY_KEY=\"test-$(date +%s)\"
API_KEY=\"your-api-key\"
API_SECRET=\"your-api-secret\"
TIMESTAMP=$(date +%s)

# Build form data
FORM_DATA=\"network=${NETWORK}&recipient=${RECIPIENT}&capacity=${CAPACITY}&idempotency_key=${IDEMPOTENCY_KEY}\"

# Generate signature
MESSAGE=\"${TIMESTAMP}\\nPOST\\n/api/v1/orders\\n${FORM_DATA}\"
SIGNATURE=$(echo -n \"$MESSAGE\" | openssl dgst -sha256 -hmac \"$API_SECRET\" -hex | awk '{print $2}')

# Send request
curl -X POST https://skytechgh.com/api/v1/orders \\
  -H \"Content-Type: application/x-www-form-urlencoded\" \\
  -H \"Authorization: Bearer $API_KEY\" \\
  -H \"X-Timestamp: $TIMESTAMP\" \\
  -H \"X-Signature: $SIGNATURE\" \\
  -d \"$FORM_DATA\"
```

---

## Summary Table

| Component | Before | After |
|-----------|--------|-------|
| **Content-Type** | `application/json` | `application/x-www-form-urlencoded` |
| **Body Format** | `{\"key\":\"value\"}` | `key=value&key2=value2` |
| **PHP `$_POST`** | Empty | Populated |
| **Signature Base** | JSON string | Form string |
| **HTTP Status** | 403 Forbidden | 200 OK |
| **Failed Items Logic** | Not checked | Verified |
| **Transaction Status** | Often COMPLETED (wrong) | Correct (FAILED if rejected) |
| **Revenue Accuracy** | Poor | Good |

---

## Testing Checklist

```bash
✅ Form data sent (not JSON)
✅ Content-Type header correct
✅ Signature calculates from form data
✅ HTTP 200 response
✅ Response has \"status\": \"success\"
✅ Transaction marked PENDING (not COMPLETED) initially
✅ Cron job polls for delivery status
✅ Failed orders marked as FAILED
```

When all checks pass, your SkyTech integration is fixed! 🎉
