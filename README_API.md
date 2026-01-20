# Resellers Hub Gh Pro API Documentation

This repository contains comprehensive API documentation for the Resellers Hub Gh Pro platform, a data bundle and result checker service built with Node.js, Express, and PostgreSQL.

## � API Keys & Third-Party Integration

### Secure API Key Generation
The platform provides secure API key generation for third-party integrations:

- **Format**: `sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (64-character hex)
- **Security**: Cryptographically secure random generation
- **Permissions**: Granular permission control (read, purchase, webhook)
- **Management**: Full CRUD operations via dashboard and API

### Third-Party API Endpoints
Dedicated endpoints for programmatic access:

- **Data Bundles**: `/api/v1/bundles` - Get available bundles and purchase
- **Result Checkers**: `/api/v1/result-checkers` - Stock availability and purchases
- **Transactions**: `/api/v1/transactions` - Status checking and history
- **User Balance**: `/api/v1/user/balance` - Wallet balance queries
- **Webhooks**: `/api/webhooks/transaction-status` - Real-time notifications

## �📋 Documentation Files

### 1. API_DOCUMENTATION.md
Complete API reference documentation including:
- Authentication methods
- All available endpoints with request/response examples
- Data models and schemas
- Error handling
- Rate limiting information
- Code examples in JavaScript, Python, and other languages

### 2. Resellers-Hub-Gh-Pro.postman_collection.json
Postman collection for testing the API:
- Pre-configured requests for all endpoints
- Environment variables for easy configuration
- Automated token management
- Example request bodies

### 3. openapi-spec.json
OpenAPI 3.0 specification:
- Industry-standard API specification
- Generate client SDKs automatically
- Interactive API documentation with Swagger UI
- Import into API development tools

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Postman (for testing)

### 1. Import Postman Collection
1. Open Postman
2. Click "Import" → "File"
3. Select `Resellers-Hub-Gh-Pro.postman_collection.json`
4. Set environment variables:
   - `base_url`: Your API base URL (e.g., `https://your-domain.com/api`)
   - `user_email`: Test user email
   - `user_password`: Test user password
   - `agent_slug`: Test agent storefront slug

### 2. View Interactive Documentation
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Import `openapi-spec.json`
3. View interactive API documentation
4. Test endpoints directly from the browser

### 3. Generate SDK
Use OpenAPI Generator to create client SDKs:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate JavaScript SDK
openapi-generator-cli generate -i openapi-spec.json -g javascript -o ./client-sdk

# Generate Python SDK
openapi-generator-cli generate -i openapi-spec.json -g python -o ./python-sdk
```

## 🔐 Authentication

### User Authentication (JWT)
All user-facing API requests require JWT authentication:

```javascript
const token = 'your_jwt_token_here';
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Third-Party API Key Authentication
For programmatic access and third-party integrations, use API keys:

```javascript
const headers = {
  'X-API-Key': 'sk_your_secure_api_key_here',
  'Content-Type': 'application/json'
};
```

#### API Key Permissions
- `read`: Access to view data (bundles, transactions, results)
- `purchase`: Ability to purchase bundles and services
- `webhook`: Receive webhook notifications for transactions

## 🔑 API Keys & Third-Party Integrations

### Quick Start for Third-Party Developers

1. **Generate API Key**
   ```bash
   curl -X POST https://your-domain.com/api/user/api-keys \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Integration",
       "permissions": ["read", "purchase"]
     }'
   ```

2. **Use API Key for Third-Party Access**
   ```javascript
   // Purchase a data bundle
   const response = await fetch('https://your-domain.com/api/v1/bundles/purchase', {
     method: 'POST',
     headers: {
       'X-API-Key': 'sk_your_api_key',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       network: 'MTN',
       plan: '1GB',
       recipientPhone: '233xxxxxxxxx'
     })
   });
   ```

3. **Check Result Status**
   ```javascript
   const response = await fetch('https://your-domain.com/api/v1/results/check', {
     method: 'POST',
     headers: {
       'X-API-Key': 'sk_your_api_key',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       type: 'waec',
       examNumber: '1234567890',
       examYear: '2023'
     })
   });
   ```

### Webhook Integration
Receive real-time notifications for transaction updates:

```javascript
// Webhook payload example
{
  "event": "bundle.purchase.completed",
  "data": {
    "transactionId": "txn_123456",
    "status": "completed",
    "amount": 500,
    "network": "MTN",
    "recipientPhone": "233xxxxxxxxx"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Configure webhook endpoints in your API keys dashboard to receive these events.

## 📊 Key Features

- **Multi-role Authentication**: Support for admin, agents, dealers, and regular users
- **Data Bundle Sales**: Purchase and manage data bundles across multiple networks
- **Result Checker Services**: Access to educational result checking
- **Agent Storefronts**: Custom storefronts for resellers
- **Payment Integration**: Paystack integration for secure payments
- **Wallet System**: Built-in wallet for agents and users
- **Admin Panel**: Comprehensive administrative controls

## 🛠️ Development

### Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-username/resellers-hub-gh-pro.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run Playwright E2E tests
npx playwright test
```

## 📞 Support

- **Email**: support@your-domain.com
- **Documentation**: https://docs.your-domain.com
- **Status Page**: https://status.your-domain.com

## 📝 API Versioning

- Current Version: 1.0.0
- Versioning Strategy: URL path versioning (e.g., `/api/v1/endpoint`)
- Breaking Changes: Will be communicated 30 days in advance

## 🔒 Security

- All requests use HTTPS in production
- JWT tokens expire after 24 hours
- Rate limiting applied to prevent abuse
- Input validation on all endpoints
- SQL injection protection via parameterized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update documentation if needed
5. Submit a pull request

## 📄 License

This API documentation is proprietary. Contact support@your-domain.com for licensing information.

---

**Last Updated**: January 2024
**API Version**: 1.0.0