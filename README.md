# Binance TraderBOT Webhook

A Node.js webhook service that allows you to execute trades on Binance through HTTP requests. This service provides a simple REST API endpoint that can be integrated with various trading bots, signals, or automated systems.

## Features

- Execute market orders on Binance
- Simple REST API endpoint
- Secure API key handling
- Error handling and response formatting
- Environment variable configuration

## Prerequisites

- Node.js (v14 or higher)
- Binance account with API access
- Binance API Key and Secret

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
```

## Usage

1. Start the server:
```bash
npm start
```

2. Send a POST request to the webhook endpoint:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": "0.001"
  }'
```

### Webhook Parameters

- `symbol`: Trading pair (e.g., "BTCUSDT")
- `side`: Order side ("BUY" or "SELL")
- `quantity`: Amount to trade

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

## Security Considerations

- Never expose your API keys in the code
- Use environment variables for sensitive data
- Consider implementing additional authentication for the webhook endpoint
- Use HTTPS in production

## Dependencies

- express: Web server framework
- axios: HTTP client
- dotenv: Environment variable management
- crypto: Node.js built-in module for HMAC signature generation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 