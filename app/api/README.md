# MemeDeck API Documentation

This document outlines all API endpoints available in the MemeDeck application, their required parameters, and what they return.

## Authentication

Most endpoints require authentication via Privy JWT tokens. Authentication is handled by the `requireAuth` or `verifyPrivyToken` middleware.

## API Endpoints

### Fees

#### `GET /api/fees/destination`
Returns the appropriate fee destination wallet address based on user's referrer status.

**Authentication:** Required
**Parameters:** None
**Returns:**
- `string` - Wallet address (either referrer's hydra wallet or platform wallet)

**Example Response:**
```json
"9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
```

---

### Hydra (Revenue Sharing)

#### `POST /api/hydra/create-wallet`
Creates a new Hydra revenue sharing wallet for the authenticated user.

**Authentication:** Required
**Parameters:**
```json
{
  "userPublicKey": "string", // User's Solana wallet public key
  "userTier": "string"       // User tier: "default", "referred", or "premium"
}
```

**Returns:**
```json
{
  "transaction": "string",         // Transaction signature
  "hydraWalletAddress": "string"   // Created Hydra wallet address
}
```

**Errors:**
- `400` - User already has revenue sharing enabled
- `500` - Failed to create revenue share wallet

#### `POST /api/hydra/close-wallet`
Closes the user's Hydra revenue sharing wallet and refunds rent.

**Authentication:** Required
**Parameters:** None (uses authenticated user's data)
**Returns:**
```json
{
  "success": true,
  "signature": "string",
  "message": "Revenue sharing account closed and rent refunded"
}
```

**Errors:**
- `404` - No revenue sharing wallet found
- `400` - User wallet address not found
- `500` - Failed to close revenue share wallet

---

### Partners

#### `POST /api/partners`
Creates a new partner account for the authenticated user.

**Authentication:** Required
**Parameters:**
```json
{
  "partnerCode": "string",      // 3-20 chars, uppercase alphanumeric
  "tier": "string",             // Optional: "default", "referred", "premium"
  "walletAddress": "string"     // Optional: for display purposes
}
```

**Returns:**
```json
{
  "id": "number",
  "userId": "string",
  "partnerCode": "string",
  "tier": "string",
  "walletAddress": "string",
  "totalEarningsLamports": "string",
  "totalClaimedLamports": "string",
  "codeCustomized": "boolean",
  "isActive": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Errors:**
- `400` - Partner code already exists or invalid data
- `401` - Authentication required

#### `GET /api/partners`
Retrieves partner information for the authenticated user.

**Authentication:** Required
**Parameters:** None
**Returns:**
```json
{
  "id": "number",
  "userId": "string",
  "partnerCode": "string",
  "tier": "string",
  "walletAddress": "string",
  "totalEarningsLamports": "string",
  "totalClaimedLamports": "string",
  "codeCustomized": "boolean",
  "isActive": "boolean",
  "createdAt": "string",
  "updatedAt": "string",
  "user": {
    "userId": "string",
    "privyUser": "object",
    "createdAt": "string"
  },
  "_count": {
    "referrals": "number",
    "feeTransactions": "number"
  }
}
```

**Errors:**
- `404` - Partner not found
- `401` - Authentication required

#### `GET /api/partners/claims`
Retrieves all earnings claims for the authenticated partner.

**Authentication:** Required
**Parameters:** None
**Returns:**
```json
{
  "claims": [
    {
      "id": "number",
      "partnerId": "number",
      "amountLamports": "string",
      "status": "string",
      "transactionHash": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

**Errors:**
- `404` - Partner not found
- `401` - Authentication required

#### `POST /api/partners/claim-earnings`
Creates a new earnings claim for the authenticated partner.

**Authentication:** Required
**Parameters:**
```json
{
  "amountLamports": "string"  // Amount to claim in lamports
}
```

**Returns:**
```json
{
  "claimId": "number",
  "status": "pending",
  "amountLamports": "string"
}
```

**Errors:**
- `404` - Partner not found
- `400` - Insufficient earnings or invalid amount
- `401` - Authentication required

#### `GET /api/partners/[partnerId]/earnings`
Retrieves earnings information for a specific partner.

**Authentication:** Required
**Parameters:**
- `partnerId` (URL parameter) - Partner ID
**Returns:**
```json
{
  "earnings": "object"  // Earnings data structure
}
```

---

### Referrals

#### `GET /api/referrals`
Retrieves all referrals for the authenticated partner.

**Authentication:** Required
**Parameters:** None
**Returns:**
```json
{
  "referrals": [
    {
      "id": "number",
      "referrerId": "number",
      "referredUserId": "string",
      "referredWalletAddress": "string",
      "appliedAt": "string",
      "createdAt": "string"
    }
  ]
}
```

#### `POST /api/referrals/validate`
Validates a referral code and returns partner information.

**Authentication:** Not required
**Parameters:**
```json
{
  "referralCode": "string"  // 3-20 character referral code
}
```

**Returns:**
```json
{
  "valid": true,
  "tier": "string",
  "partnerId": "number",
  "userId": "string",
  "partnerCode": "string",
  "referralCount": "number"
}
```

**Errors:**
- `404` - Referral code not found or inactive
- `400` - Invalid request data

#### `POST /api/referrals/apply-user`
Applies a referral code to a specific user ID.

**Authentication:** Not required
**Parameters:**
```json
{
  "referralCode": "string",  // Partner's referral code
  "userId": "string"         // User ID to apply referral to
}
```

**Returns:**
```json
{
  "success": true,
  "tier": "string",
  "referrerUserId": "string",
  "partnerCode": "string",
  "appliedAt": "string"
}
```

**Errors:**
- `404` - Invalid or inactive referral code
- `400` - Cannot refer yourself or user already has referral

#### `GET /api/referrals/status`
Gets referral status for the authenticated user.

**Authentication:** Required
**Parameters:** None
**Returns:**
```json
{
  "status": "object"  // Referral status data
}
```

---

### Transactions

#### `GET /api/transactions`
Retrieves transaction history for the authenticated user.

**Authentication:** Required
**Parameters:**
- `limit` (query parameter, optional) - Number of transactions to return (default: 50)

**Returns:**
```json
{
  "transactions": [
    {
      "id": "string",
      "userId": "string",
      "walletAddress": "string",
      "transactionType": "string",
      "tokenMint": "string",
      "tokenSymbol": "string",
      "amountUsd": "number",
      "status": "string",
      "createdAt": "string",
      "ultraOrderRequest": "object",
      "ultraOrderResponse": "object",
      "metadata": "object"
    }
  ]
}
```

#### `POST /api/transactions/create`
Creates a new transaction record.

**Authentication:** Required
**Parameters:**
```json
{
  "walletAddress": "string",
  "transactionType": "string",
  "tokenMint": "string",
  "tokenSymbol": "string",
  "amountUsd": "number",
  "ultraOrderRequest": "object",
  "ultraOrderResponse": "object",
  "metadata": "object"
}
```

**Returns:**
```json
{
  "transactionId": "string"
}
```

#### `POST /api/transactions/update-fee-receipt`
Updates a transaction with fee receipt information.

**Authentication:** Required
**Parameters:**
```json
{
  "transactionHash": "string",
  "feeReceipt": "object"
}
```

**Returns:**
```json
{
  "success": true
}
```

**Errors:**
- `400` - Missing transactionHash or feeReceipt

#### `GET /api/transactions/[transactionId]`
Retrieves a specific transaction by ID.

**Authentication:** Required
**Parameters:**
- `transactionId` (URL parameter) - Transaction ID

**Returns:**
```json
{
  "transaction": "object"  // Transaction data
}
```

---

### User

#### `GET /api/user/cost-basis`
Calculates cost basis for user's token holdings.

**Authentication:** Not required
**Parameters:**
- `userId` (query parameter) - User ID

**Returns:**
```json
{
  "success": true,
  "data": {
    "tokenMint": {
      "totalCost": "number",
      "buyCount": "number",
      "sellCount": "number"
    }
  }
}
```

**Errors:**
- `400` - userId parameter is required
- `500` - Failed to fetch cost basis data

#### `GET /api/user/partner-status`
Gets partner account status for the authenticated user.

**Authentication:** Required
**Parameters:** None
**Returns:**
```json
{
  "hasPartnerAccount": "boolean",
  "partnerWallet": "string",
  "referralCode": "string",
  "revenueSharePercentage": "number",
  "totalEarnings": "number"
}
```

#### `GET /api/user/referred-by`
Gets the user who referred the authenticated user.

**Authentication:** Required
**Parameters:** None
**Returns:**
```json
{
  "referredBy": "string"  // User ID of referrer
}
```

---

### Store (User Data Storage)

#### `GET /api/store/[key]`
Retrieves stored user data.

**Authentication:** Required
**Parameters:**
- `key` (URL parameter) - Storage key (not currently used)

**Returns:**
```json
{
  "storeData": "object",
  "referredBy": "string"
}
```

#### `POST /api/store/[key]`
Stores user data and handles referral syncing.

**Authentication:** Required
**Parameters:**
- `key` (URL parameter) - Storage key
- Body: JSON object with user data

**Returns:**
```
"OK"
```

#### `DELETE /api/store/[key]`
Clears all stored user data.

**Authentication:** Required
**Parameters:**
- `key` (URL parameter) - Storage key

**Returns:**
```
"OK"
```

---

### Jupiter Proxy

#### `GET|POST /api/jupiter-proxy/[...path]`
Proxies requests to Jupiter API endpoints.

**Authentication:** Not required
**Parameters:**
- `path` (URL parameter) - Jupiter API endpoint path
- Additional parameters passed through to Jupiter API

**Returns:**
- Proxied response from Jupiter API

---

### Text-to-Speech (TTS)

#### `POST /api/tts`
Generates speech audio from text using ElevenLabs API.

**Authentication:** Not required
**Parameters:**
```json
{
  "text": "string",
  "voiceId": "string"  // Optional, defaults to "21m00Tcm4TlvDq8ikWAM"
}
```

**Returns:**
```json
{
  "success": true,
  "audioUrl": "string",
  "duration": "number",
  "timestamps": {
    "characters": ["string"],
    "characterStartTimes": ["number"],
    "characterEndTimes": ["number"]
  },
  "cached": "boolean"
}
```

**Errors:**
- `400` - Text parameter is required
- `500` - Failed to generate speech

#### `GET /api/tts`
Health check for TTS service.

**Authentication:** Not required
**Parameters:** None
**Returns:**
```json
{
  "service": "TTS Cache",
  "status": "object"
}
```

---

### Image Proxy

#### `GET /api/image-proxy`
Proxies and caches image requests with optional resizing.

**Authentication:** Not required
**Parameters:**
- `url` (query parameter) - Image URL to proxy
- `width` (query parameter, optional) - Target width for resizing
- `height` (query parameter, optional) - Target height for resizing

**Returns:**
- Image binary data with appropriate Content-Type header
- Cache headers included

**Errors:**
- `400` - Missing URL parameter
- `500` - Failed to proxy image

---

### Test Endpoints

#### `POST /api/test/set-referral`
Test endpoint for setting referral relationships.

**Authentication:** Varies
**Parameters:** Test-specific
**Returns:** Test-specific

---

## Error Handling

All endpoints follow standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

Error responses generally follow this format:
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Data Types

### BigInt Serialization
Due to JavaScript's JSON limitations with BigInt values, all BigInt fields (like lamport amounts) are serialized as strings in API responses.

### Authentication
Authentication is handled via Privy JWT tokens passed in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Rate Limiting
Some endpoints may implement rate limiting. Check response headers for rate limit information.
