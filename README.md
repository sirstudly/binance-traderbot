# Binance Trading Bot

A Cloudflare Worker that provides a secure webhook endpoint for executing trades on Binance.

Note: This is currently being blocked by Binance because the worker IP is coming from the Cloudflare network. :SAD:

## Features

- Secure webhook endpoint for executing trades
- HMAC signature generation for Binance API authentication
- IP address logging for request tracking
- Error handling and response formatting

## Prerequisites

- Cloudflare account
- Binance account with API access
- Node.js and npm installed

## Environment Variables

The following environment variables need to be set in your Cloudflare Worker:

- `BINANCE_API_KEY`: Your Binance API key
- `BINANCE_API_SECRET`: Your Binance API secret
- `WEBHOOK_SECRET`: A secret token to secure your webhook endpoint

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd binance-traderbot
```

2. Install dependencies:
```bash
npm install
```

3. Configure your environment variables in the Cloudflare dashboard or using Wrangler:
```bash
wrangler secret put BINANCE_API_KEY
wrangler secret put BINANCE_API_SECRET
wrangler secret put WEBHOOK_SECRET
```

4. Deploy the worker:
```bash
npm run deploy
```

## Usage

The worker exposes a POST endpoint that accepts trading orders. The endpoint is secured with a webhook secret that must be included in the URL path.

### Endpoint

```
POST https://your-worker.your-subdomain.workers.dev/{WEBHOOK_SECRET}
```

### Request Body

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": "0.001"
}
```

### Example Request

```javascript
fetch('https://your-worker.your-subdomain.workers.dev/your-webhook-secret', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symbol: 'BTCUSDT',
    side: 'BUY',
    quantity: '0.001'
  })
});
```

### Response Format

```json
{
  "status": "success",
  "message": "Order placed successfully",
  "code": 200,
  "details": {
    // Binance API response
  }
}
```

## Error Handling

The worker handles various error cases:

- Invalid request method (non-POST)
- Missing or invalid webhook secret
- Missing required fields
- Binance API errors
- Network errors

All errors are returned with appropriate HTTP status codes and descriptive messages.

## Development

To run the worker locally:

```bash
npm run dev
```

This will start a local development server at `http://localhost:8787`.

## Security

- The webhook endpoint is secured with a secret token
- API keys are stored as environment variables
- All requests are validated before processing
- Error messages are sanitized to prevent information leakage

## Logging

The worker logs:
- Worker IP address for each request
- Request details (symbol, side, quantity)
- Response data
- Any errors that occur

