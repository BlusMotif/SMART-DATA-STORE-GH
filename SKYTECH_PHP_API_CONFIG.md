# SkyTech PHP API Configuration Guide

## 🔴 The Core Issue

**SkyTech uses PHP and does NOT automatically parse JSON into `$_POST`.**

When you send JSON with `Content-Type: application/json`, PHP cannot access it via `$_POST` superglobal:
```php
// ❌ This returns NULL on PHP backend
$_POST['recipient']   // NULL - JSON payload not in $_POST
$_POST['capacity']    // NULL
```

This causes:
- Empty/missing data
- Signature mismatch (signing different data than what PHP validates)
- 403 Forbidden responses (auth/signature failure)

---

## ✅ The Solution

### 1. **Send Form-Encoded Data (NOT JSON)**

**OLD (BROKEN):**
```typescript
const body = JSON.stringify({ network: 'MTN', recipient: '0546591622', capacity: 4 });
headers: { 'Content-Type': 'application/json' }
```

**NEW (CORRECT):**
```typescript
const formBody = new URLSearchParams({
  network: 'MTN',
  recipient: '0546591622',
  capacity: '4',
  idempotency_key: 'unique-key'
});

headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
body: formBody.toString()  // "network=MTN&recipient=0546591622&capacity=4&idempotency_key=..."
```

### 2. **Signature Must Match Form Data**

**Signature Message Format:**
```
{timestamp}\n{method}\n{path}\n{form_body_string}
```

**Example:**
```
1705859234
POST
/api/v1/orders
network=MTN&recipient=0546591622&capacity=4&idempotency_key=xxx
```

**NOT** JSON:
```
// ❌ WRONG
network=MTN&recipient=0546591622&capacity=4  (form string)
BUT signing:
{"network":"MTN","recipient":"0546591622","capacity":4}  (JSON)
→ Signature mismatch → 403
```

### 3. **Complete Request Example**

```typescript
import crypto from 'crypto';

const apiKey = 'your-api-key';
const apiSecret = 'your-api-secret';
const endpoint = 'https://skytechgh.com/api/v1/orders';

// 1. Prepare form data
const formBody = new URLSearchParams({
  network: 'MTN',
  recipient: '0546591622',
  capacity: '4',
  idempotency_key: 'order-' + Date.now()
});
const formBodyString = formBody.toString();

// 2. Create signature message
const ts = Math.floor(Date.now() / 1000).toString();
const method = 'POST';
const path = '/api/v1/orders';
const message = `${ts}\n${method}\n${path}\n${formBodyString}`;

// 3. Generate HMAC-SHA256 signature (hex)
const signature = crypto.createHmac('sha256', apiSecret)
  .update(message)
  .digest('hex');

// 4. Send request
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'X-Timestamp': ts,
    'X-Signature': signature,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://resellershubprogh.com'
  },
  body: formBodyString
});

const result = await response.json();
console.log(result);
```

---

## 🔐 PHP Backend Validation (Reference)

Here's what SkyTech PHP does:

```php
<?php
// Read signature from headers
$timestamp = $_SERVER['HTTP_X_TIMESTAMP'];
$signature = $_SERVER['HTTP_X_SIGNATURE'];
$apiKey = $_SERVER['HTTP_AUTHORIZATION']; // Bearer {key}

// Get raw request body (form-encoded)
$rawBody = file_get_contents('php://input');
// $rawBody = "network=MTN&recipient=0546591622&capacity=4&idempotency_key=xxx"

// Reconstruct signature message
$message = "$timestamp\nPOST\n/api/v1/orders\n$rawBody";

// Validate signature
$expectedSig = hash_hmac('sha256', $message, API_SECRET, false);
if ($signature !== $expectedSig) {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid signature']));
}

// Now parse form data
parse_str($rawBody, $_POST);
// Now $_POST['recipient'], $_POST['capacity'], etc. are available

// Process order...
?>
```

---

## 🧪 Test Your Configuration

### Run the Test Script
```bash
# Set environment variables
export SKYTECH_API_KEY="your-key"
export SKYTECH_API_SECRET="your-secret"
export SKYTECH_API_ENDPOINT="https://skytechgh.com/api/v1/orders"

# Run test
node test-skytech-call.js
```

### Expected Success Output
```
🔧 Testing SkyTech PHP API with form-encoded requests

Endpoint: https://skytechgh.com/api/v1/orders
API Key: your-key...
---

📤 Request Details:
Method: POST
Path: /api/v1/orders
Form Body: network=MTN&recipient=0546591622&capacity=4&...
Timestamp: 1705859234
Signature Message: "1705859234\nPOST\n/api/v1/orders\nnetwork=MTN&..."
Signature (hex): abc123def456...

⏳ Sending request...

📥 Response:
Status: 200 OK
Body (JSON):
{
  "status": "success",
  "ref": "ORDER-12345",
  "price": 5.50,
  ...
}

✅ SUCCESS! Request accepted by SkyTech PHP API
```

---

## ❌ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| **403 Forbidden** | Signature mismatch | Ensure signature is calculated from form data, not JSON |
| **400 Bad Request** | Invalid parameters | Check parameter names and values match form data |
| **500 Internal Server** | Backend error | Check logs on SkyTech side |
| **Empty $_POST** | JSON sent instead of form | Change `Content-Type` to `application/x-www-form-urlencoded` |

---

## 📋 Checklist Before Production

- [ ] **Content-Type is `application/x-www-form-urlencoded`**
- [ ] **Body is form-encoded string, NOT JSON**
- [ ] **Signature includes form data, NOT JSON**
- [ ] **Timestamp format is Unix seconds (not milliseconds)**
- [ ] **Signature is HMAC-SHA256 hex (not base64)**
- [ ] **All required headers present:** Authorization, X-Timestamp, X-Signature
- [ ] **API Key and Secret are correct**
- [ ] **Endpoint path is `/api/v1/orders`** (not `/api/orders` or `/orders`)
- [ ] **Failed requests do NOT mark transaction as completed**
- [ ] **Test script passes before deployment**

---

## 🔄 Integration Points

### Provider Configuration
Located in database: `external_api_providers` table
```typescript
{
  name: "SkyTech Ghana",
  endpoint: "https://skytechgh.com/api/v1/orders",
  apiKey: "your-api-key",
  apiSecret: "your-api-secret",
  isActive: true,
  networkMappings: {
    "mtn": "MTN",
    "telecel": "TELECEL",
    "at_bigtime": "AIRTELTIGO"
  }
}
```

### API Calls in Code
- **[providers.ts](src/server/providers.ts)** - `fulfillDataBundleTransaction()`
- **[routes.ts](src/server/routes.ts)** - Transaction fulfillment logic
- **[test-skytech-call.js](test-skytech-call.js)** - Test/debug script

### Environment Variables (.env.production)
```env
SKYTECH_API_KEY=your-api-key
SKYTECH_API_SECRET=your-api-secret
SKYTECH_API_ENDPOINT=https://skytechgh.com/api/v1/orders
```

---

## 📞 Quick Reference

**When SkyTech says:** "Our API rejects your requests with 403"

**You should check:**
1. ✅ Content-Type header is `application/x-www-form-urlencoded`
2. ✅ Body is **NOT** JSON string
3. ✅ Signature is calculated from form data
4. ✅ API Key is active and correct
5. ✅ API Secret hasn't been rotated
6. ✅ Timestamp is within 5 minutes of their server

**Send SkyTech this info:**
> "We're now sending form-encoded POST requests with HMAC-SHA256 signatures calculated from the raw form body. Our signature message format is: `timestamp\nPOST\npath\nform_data`. Please confirm this matches your validation method."

---

## 🚀 Production Deployment

After fixes are deployed:

1. **Test with test-skytech-call.js**
2. **Monitor logs** for provider response patterns
3. **Track failed transactions** - they should decrease significantly
4. **Verify database** - failed items have `deliveryStatus = "failed"`
5. **Don't mark complete** until actual SkyTech confirmation
6. **Cron job** will poll SkyTech for real delivery status

The system will now correctly:
- ✅ Send PHP-compatible form data
- ✅ Generate matching signatures
- ✅ Handle provider rejections properly
- ✅ Mark only successful deliveries as completed
