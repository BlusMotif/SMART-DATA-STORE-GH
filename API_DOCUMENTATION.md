# Resellers Hub Gh Pro API Documentation

## Overview

Resellers Hub Gh Pro is a comprehensive data bundle and result checker platform built with Node.js, Express, and PostgreSQL. This API provides endpoints for user authentication, data bundle purchases, agent management, result checker services, and administrative functions.

**Base URL:** `https://your-domain.com/api`  
**Version:** 1.0.0  
**Authentication:** JWT Bearer tokens (Supabase Auth)  
**Rate Limiting:** Applied to sensitive endpoints

## Authentication

### JWT Authentication (Users)

All user-facing API requests require authentication using JWT tokens obtained from Supabase Auth.

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### API Key Authentication (Third-Party)

For programmatic access and third-party integrations, use API keys.

**Headers:**

```
X-API-Key: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

### User Roles

- `admin`: Full system access
- `agent`: Can sell data bundles and manage storefront
- `dealer`: Higher-level reseller with custom pricing
- `super_dealer`: Advanced reseller capabilities
- `master`: Top-tier reseller
- `user`: Regular authenticated user
- `guest`: Unauthenticated user

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+233501234567"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "guest"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

#### POST /auth/login
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "agent",
    "phone": "+233501234567"
  },
  "agent": {
    "id": "uuid",
    "businessName": "My Data Store",
    "storefrontSlug": "my-store",
    "balance": "150.00",
    "totalSales": "500.00"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

#### GET /auth/me
Get current user information.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "agent",
    "phone": "+233501234567",
    "walletBalance": "50.00"
  },
  "agent": {
    "id": "uuid",
    "businessName": "My Data Store",
    "storefrontSlug": "my-store",
    "balance": "150.00",
    "totalSales": "500.00",
    "isApproved": true
  }
}
```

### API Key Management

#### POST /user/api-keys

Create a new API key.

**Request Body:**

```json
{
  "name": "Production App"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Production App",
  "key": "sk_abc123def456...",
  "permissions": "{}",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /user/api-keys

Get user's API keys.

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "Production App",
    "key": "sk_abc123****7890",
    "permissions": "{\"read\":true,\"purchase\":true}",
    "isActive": true,
    "lastUsed": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T09:00:00Z"
  }
]
```

#### PUT /user/api-keys/{id}/permissions

Update API key permissions.

**Request Body:**

```json
{
  "permissions": {
    "read": true,
    "purchase": true,
    "webhook": false
  }
}
```

#### PUT /user/api-keys/{id}/toggle

Toggle API key active status.

#### DELETE /user/api-keys/{id}

Delete an API key.

### Third-Party API Endpoints

#### GET /v1/bundles

Get available data bundles (API Key Authentication).

**Headers:**

```
X-API-Key: sk_your_api_key_here
```

**Query Parameters:**

- `network` (optional): Filter by network (mtn, telecel, at_bigtime, at_ishare)
- `agent` (optional): Agent slug for storefront pricing

**Response (200):**

```json
{
  "bundles": [
    {
      "id": "uuid",
      "name": "MTN 500MB",
      "network": "mtn",
      "dataAmount": "500MB",
      "validity": "1 Day",
      "price": "1.50",
      "currency": "GHS"
    }
  ]
}
```

#### POST /v1/bundles/purchase

Purchase a data bundle (API Key Authentication).

**Request Body:**

```json
{
  "bundleId": "uuid",
  "phone": "+233501234567",
  "email": "customer@example.com",
  "agentSlug": "store-slug"
}
```

**Response (200):**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "reference": "API-123456789-ABCDEF",
    "bundle": {
      "name": "MTN 1GB",
      "network": "mtn",
      "dataAmount": "1GB",
      "validity": "7 Days"
    },
    "amount": "5.00",
    "phone": "+233501234567",
    "status": "completed"
  }
}
```

#### GET /v1/transactions/{reference}

Get transaction status (API Key Authentication).

**Response (200):**

```json
{
  "transaction": {
    "id": "uuid",
    "reference": "API-123456789-ABCDEF",
    "type": "data_bundle",
    "productName": "MTN 1GB",
    "amount": "5.00",
    "status": "completed",
    "deliveryStatus": "delivered",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:31:00Z"
  }
}
```

#### GET /v1/result-checkers/stock

Get result checker stock (API Key Authentication).

**Response (200):**

```json
{
  "stock": [
    {
      "type": "bece",
      "year": 2024,
      "available": 150,
      "price": 25,
      "currency": "GHS"
    }
  ]
}
```

#### POST /v1/result-checkers/purchase

Purchase result checker (API Key Authentication).

**Request Body:**

```json
{
  "type": "bece",
  "year": 2024,
  "quantity": 1
}
```

#### GET /v1/user/balance

Get user wallet balance (API Key Authentication).

**Response (200):**

```json
{
  "balance": "150.50",
  "currency": "GHS"
}
```

#### GET /v1/user/transactions

Get user transactions (API Key Authentication).

**Query Parameters:**

- `limit` (optional): Number of transactions (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Response (200):**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "reference": "API-123456789-ABCDEF",
      "type": "data_bundle",
      "amount": "5.00",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Webhook Endpoints

#### POST /webhooks/transaction-status

Receive transaction status updates (No Authentication Required).

**Headers:**

```
Content-Type: application/json
X-Webhook-Signature: signature (optional)
```

**Request Body:**

```json
{
  "reference": "API-123456789-ABCDEF",
  "status": "completed",
  "provider": "external_provider",
  "metadata": {
    "deliveredAt": "2024-01-15T10:31:00Z",
    "pin": "ABC123"
  }
}
```

**Response (200):**

```json
{
  "success": true
}
```

### Agent Management

#### POST /agent/register

Register as an agent (requires payment).

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+233501234567",
  "storefrontSlug": "my-store",
  "businessName": "My Data Store",
  "businessDescription": "Best data bundles in town"
}
```

**Response (200):**

```json
{
  "message": "Please complete payment to activate your agent account",
  "paymentUrl": "https://paystack.com/pay/xxx",
  "paymentReference": "CLEC-123456-ABCDEF",
  "amount": 60
}
```

#### POST /agent/upgrade

Upgrade existing user to agent (requires payment).

**Request Body:**

```json
{
  "businessName": "My Data Store",
  "businessDescription": "Best data bundles in town",
  "storefrontSlug": "my-store"
}
```

**Response (200):**

```json
{
  "paymentUrl": "https://paystack.com/pay/xxx",
  "paymentReference": "CLEC-123456-ABCDEF",
  "amount": 60
}
```

### Products

#### GET /products/data-bundles

Get available data bundles.

**Query Parameters:**

- `network` (optional): Filter by network (mtn, telecel, at_bigtime, at_ishare)
- `agent` (optional): Agent slug for storefront pricing

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "MTN 500MB",
    "network": "mtn",
    "dataAmount": "500MB",
    "validity": "1 Day",
    "basePrice": "1.50",
    "effective_price": "1.50",
    "profit_margin": "0.00",
    "isActive": true
  }
]
```

#### GET /products/data-bundles/:id

Get specific data bundle details.

**Response (200):**

```json
{
  "id": "uuid",
  "name": "MTN 500MB",
  "network": "mtn",
  "dataAmount": "500MB",
  "validity": "1 Day",
  "basePrice": "1.50",
  "effective_price": "1.50",
  "profit_margin": "0.00",
  "isActive": true
}
```

#### GET /products/networks

Get available networks with pricing.

**Response (200):**

```json
[
  {
    "network": "mtn",
    "name": "MTN",
    "basePrice": "1.50"
  }
]
```

#### GET /products/result-checkers/stock

Get result checker stock availability.

**Response (200):**

```json
[
  {
    "type": "bece",
    "year": 2024,
    "available": 150,
    "stock": 150,
    "price": 25
  }
]
```

### Checkout & Transactions

#### POST /checkout/initialize

Initialize a purchase transaction.

**Request Body:**

```json
{
  "productId": "bundle-uuid",
  "productType": "data_bundle",
  "customerPhone": "+233501234567",
  "customerEmail": "customer@example.com",
  "amount": "5.00",
  "agentSlug": "my-store"
}
```

**Response (200):**

```json
{
  "transaction": {
    "id": "uuid",
    "reference": "CLEC-123456-ABCDEF",
    "amount": "5.00",
    "productName": "MTN 1GB - 1 Day"
  },
  "paymentUrl": "https://paystack.com/pay/xxx",
  "accessCode": "access_code"
}
```

#### POST /checkout/bulk-upload

Bulk upload purchases via Excel file.

**Form Data:**

- `excelFile`: Excel file with columns: phone, bundleName, bundleId

**Response (200):**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "reference": "CLEC-123456-ABCDEF",
    "amount": "25.00",
    "productName": "Bulk Data Bundle Purchase (5 items)"
  },
  "totalRows": 5,
  "processedItems": 5,
  "errors": []
}
```

#### GET /transactions/verify/:reference

Verify payment and complete transaction.

**Response (200):**

```json
{
  "success": true,
  "transaction": {
    "reference": "CLEC-123456-ABCDEF",
    "productName": "MTN 1GB - 1 Day",
    "amount": "5.00",
    "status": "completed",
    "deliveredPin": "ABC123",
    "deliveredSerial": "XYZ789"
  }
}
```

### Agent Dashboard

#### GET /profile

Get agent profile and statistics.

**Response (200):**

```json
{
  "profile": {
    "id": "uuid",
    "businessName": "My Data Store",
    "storefrontSlug": "my-store",
    "walletBalance": "50.00",
    "profitBalance": "150.00",
    "totalProfit": "300.00",
    "totalSales": "1000.00",
    "balance": "200.00",
    "role": "agent",
    "isApproved": true,
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+233501234567"
    }
  },
  "stats": {
    "total": 150,
    "completed": 145,
    "pending": 5,
    "revenue": 750,
    "profit": 150
  }
}
```

#### GET /agent/transactions

Get agent transactions.

**Response (200):**

```json
[
  {
    "id": "uuid",
    "reference": "CLEC-123456-ABCDEF",
    "type": "data_bundle",
    "productName": "MTN 1GB - 1 Day",
    "amount": "5.00",
    "agentProfit": "1.00",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /agent/stats

Get agent statistics.

**Response (200):**

```json
{
  "balance": 50,
  "totalProfit": 300,
  "totalSales": 1000,
  "totalTransactions": 150,
  "todayProfit": 25,
  "todayTransactions": 5
}
```

#### GET /agent/pricing

Get agent custom pricing.

**Response (200):**

```json
[
  {
    "bundleId": "uuid",
    "agentPrice": "2.00",
    "adminBasePrice": "1.50",
    "agentProfit": "0.50"
  }
]
```

#### POST /agent/pricing

Update agent custom pricing.

**Request Body:**

```json
{
  "prices": {
    "bundle-uuid-1": { "agentPrice": "2.00" },
    "bundle-uuid-2": { "agentPrice": "3.50" }
  }
}
```

#### POST /agent/withdrawals

Request profit withdrawal.

**Request Body:**

```json
{
  "amount": 100,
  "paymentMethod": "mtn_momo",
  "accountNumber": "0501234567",
  "accountName": "John Doe"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "amount": "100.00",
  "status": "pending",
  "paymentMethod": "mtn_momo",
  "accountNumber": "0501234567",
  "accountName": "John Doe",
  "message": "Withdrawal request submitted successfully. It will be processed after admin approval."
}
```

### Storefront

#### GET /store/:role/:slug

Get agent/dealer storefront.

**Response (200):**

```json
{
  "store": {
    "businessName": "My Data Store",
    "businessDescription": "Best data bundles in town",
    "slug": "my-store",
    "role": "agent"
  },
  "dataBundles": [
    {
      "id": "uuid",
      "name": "MTN 500MB",
      "network": "mtn",
      "dataAmount": "500MB",
      "validity": "1 Day",
      "price": "2.00"
    }
  ]
}
```

#### POST /store/:slug/register

Register through agent storefront.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "phone": "+233507654321"
}
```

### Admin Endpoints

#### GET /admin/external-providers

Get external API providers (Admin only).

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "SkyTech GH",
    "provider": "skytech",
    "endpoint": "https://skytechgh.com/api/v1/orders",
    "isActive": true,
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /admin/external-providers

Create external API provider (Admin only).

**Request Body:**

```json
{
  "name": "New Provider",
  "provider": "new_provider",
  "apiKey": "api_key",
  "apiSecret": "api_secret",
  "endpoint": "https://api.example.com/v1",
  "isActive": true,
  "isDefault": false,
  "networkMappings": "{\"mtn\": \"MTN\", \"telecel\": \"TELECEL\"}"
}
```

#### PUT /admin/external-providers/:id

Update external API provider (Admin only).

**Request Body:**

```json
{
  "name": "Updated Provider",
  "isActive": false
}
```

#### GET /admin/external-balance

Test external API provider balance (Admin only).

**Query Parameters:**

- `providerId`: Provider UUID

**Response (200):**

```json
{
  "success": true,
  "balance": 1500.50,
  "message": "Balance check successful"
}
```

#### POST /admin/wallet/topup

Top up user wallet (Admin only).

**Request Body:**

```json
{
  "userId": "uuid",
  "amount": 50,
  "reason": "Customer support"
}
```

### Paystack Integration

#### GET /paystack/config

Get Paystack configuration.

**Response (200):**

```json
{
  "publicKey": "pk_test_xxx",
  "isConfigured": true,
  "isTestMode": true
}
```

#### POST /paystack/webhook

Paystack webhook endpoint (no auth required).

**Headers:**

```
X-Paystack-Signature: signature
Content-Type: application/json
```

#### GET /paystack/verify

Verify Paystack payment.

**Query Parameters:**

- `reference`: Payment reference

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "reference": "CLEC-123456-ABCDEF",
    "amount": 500,
    "paid_at": "2024-01-15T10:30:00Z"
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description",
  "details": "Additional error details (development only)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

- Login/Register: 10 requests per 15 minutes
- Agent Registration: 10 requests per 30 minutes
- General API: Varies by endpoint

## Data Models

### User

```typescript
{
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "admin" | "agent" | "dealer" | "super_dealer" | "master" | "user" | "guest";
  walletBalance: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Agent

```typescript
{
  id: string;
  userId: string;
  storefrontSlug: string;
  businessName: string;
  businessDescription?: string;
  balance: string;
  totalSales: string;
  totalProfit: string;
  isApproved: boolean;
  paymentPending: boolean;
  whatsappSupportLink?: string;
  whatsappChannelLink?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction

```typescript
{
  id: string;
  reference: string;
  type: "data_bundle" | "result_checker" | "agent_activation" | "wallet_topup" | "admin_revenue";
  productId?: string;
  productName: string;
  network?: string;
  amount: string;
  profit: string;
  customerPhone?: string;
  customerEmail?: string;
  phoneNumbers?: string; // JSON string for bulk orders
  isBulkOrder: boolean;
  status: "pending" | "confirmed" | "completed" | "delivered" | "cancelled" | "failed" | "refunded";
  deliveryStatus: "pending" | "processing" | "delivered" | "failed";
  paymentMethod?: string;
  paymentReference?: string;
  agentId?: string;
  agentProfit: string;
  deliveredPin?: string;
  deliveredSerial?: string;
  failureReason?: string;
  apiResponse?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### Data Bundle

```typescript
{
  id: string;
  name: string;
  network: string;
  dataAmount: string;
  validity: string;
  basePrice: string;
  agentPrice: string;
  dealerPrice: string;
  superDealerPrice: string;
  masterPrice: string;
  adminPrice: string;
  apiCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## SDKs & Libraries

### JavaScript/Node.js Example

```javascript
const API_BASE = 'https://your-domain.com/api';

// Initialize with API key
const headers = {
  'X-API-Key': 'sk_your_api_key_here',
  'Content-Type': 'application/json'
};

// Get available bundles
const getBundles = async (network) => {
  const response = await fetch(`${API_BASE}/v1/bundles?network=${network}`, {
    headers
  });
  return response.json();
};

// Purchase a bundle
const purchaseBundle = async (bundleId, phone, email) => {
  const response = await fetch(`${API_BASE}/v1/bundles/purchase`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bundleId,
      phone,
      email
    })
  });
  return response.json();
};

// Check transaction status
const getTransactionStatus = async (reference) => {
  const response = await fetch(`${API_BASE}/v1/transactions/${reference}`, {
    headers
  });
  return response.json();
};
```

### Python Example

```python
import requests

API_BASE = 'https://your-domain.com/api'
API_KEY = 'sk_your_api_key_here'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

def get_bundles(network=None):
    params = {'network': network} if network else {}
    response = requests.get(f'{API_BASE}/v1/bundles', headers=headers, params=params)
    return response.json()

def purchase_bundle(bundle_id, phone, email):
    data = {
        'bundleId': bundle_id,
        'phone': phone,
        'email': email
    }
    response = requests.post(f'{API_BASE}/v1/bundles/purchase', headers=headers, json=data)
    return response.json()

def get_transaction_status(reference):
    response = requests.get(f'{API_BASE}/v1/transactions/{reference}', headers=headers)
    return response.json()
```

### PHP Example

```php
<?php

$apiBase = 'https://your-domain.com/api';
$apiKey = 'sk_your_api_key_here';

$headers = [
    'X-API-Key: ' . $apiKey,
    'Content-Type: application/json'
];

function getBundles($network = null) {
    global $apiBase, $headers;
    $url = $apiBase . '/v1/bundles';
    if ($network) {
        $url .= '?network=' . urlencode($network);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

function purchaseBundle($bundleId, $phone, $email) {
    global $apiBase, $headers;
    $data = json_encode([
        'bundleId' => $bundleId,
        'phone' => $phone,
        'email' => $email
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiBase . '/v1/bundles/purchase');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}
```

## Support

For API integration support or questions:
- Email: support@your-domain.com
- Documentation: https://docs.your-domain.com
- Status Page: https://status.your-domain.com

## Changelog

### Version 1.0.0
- Initial API release
- Authentication system
- Data bundle purchases
- Agent management
- Result checker services
- Admin panel
- Paystack integration
- Bulk upload functionality
- External API provider management
 
 