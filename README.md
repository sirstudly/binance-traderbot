# Binance TraderBOT Webhook

A Node.js webhook service that allows you to execute trades on Binance through HTTP requests. This service provides a simple REST API endpoint that can be integrated with various trading bots, signals, or automated systems.

## Features

- Execute market orders on Binance
- Automatic quantity calculation (uses 100% of available balance)
- Simple REST API endpoint
- Secure API key handling
- Error handling and response formatting
- Environment variable configuration
- Automatic service keep-alive with GitHub Actions

## Prerequisites

- Node.js (v14 or higher)
- Binance account with API access
- Binance API Key and Secret
- GitHub account (for automated pinging)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/binance-traderbot.git
cd binance-traderbot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Binance API credentials:
```env
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
PORT=3000  # Optional, defaults to 3000
WEBHOOK_SECRET=your_webhook_secret_here  # Required for webhook security
RECV_WINDOW=10000  # Optional, defaults to 10000ms (10s)
```

## Usage

1. Start the server:
```bash
npm start
```

2. Send a POST request to the webhook endpoint:
```bash
curl -X POST http://localhost:3000/webhook/your_webhook_secret \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BTCUSDT",
    "action": "BUY"
  }'
```

### Webhook Parameters

- `ticker`: Trading pair (e.g., "BTCUSDT")
- `action`: Order side ("BUY" or "SELL" - case insensitive)

Note: The quantity is automatically calculated based on your available balance:
- For BUY orders: Uses 100% of your available quote asset (e.g., USDT) to buy the base asset
- For SELL orders: Sells 100% of your available base asset (e.g., BTC)

### Response Format

Success response:
```json
{
  "status": "success",
  "order": {
    // Binance order response data
  }
}
```

Error response:
```json
{
  "status": "error",
  "message": "Error message",
  "code": "Error code",
  "details": "Additional error details"
}
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| BINANCE_API_KEY | Your Binance API key | - | Yes |
| BINANCE_API_SECRET | Your Binance API secret | - | Yes |
| WEBHOOK_SECRET | Secret token for webhook security | - | Yes |
| PORT | Port to run the server on | 3000 | No |
| RECV_WINDOW | Request validity window in milliseconds | 10000 | No |

## Security Considerations

- Never expose your API keys in the code
- Use environment variables for sensitive data
- The webhook endpoint is protected by a secret token
- Use HTTPS in production
- Keep your `WEBHOOK_SECRET` secure and unique
- Consider using a shorter `RECV_WINDOW` for better security

## Dependencies

- express: Web server framework
- axios: HTTP client
- dotenv: Environment variable management
- crypto: Node.js built-in module for HMAC signature generation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 