# Binance TraderBOT Webhook

A Node.js webhook service that allows you to execute trades on Binance through HTTP requests. This service provides a simple REST API endpoint that can be integrated with various trading bots, signals, or automated systems.

## Features

- Execute market orders on Binance
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

## GitHub Actions Workflow

The repository includes a GitHub Actions workflow that pings the webhook service every 12 minutes to keep it alive. This is particularly useful for free-tier Render deployments that would otherwise spin down after 15 minutes of inactivity.

The workflow is located at `.github/workflows/ping-webhook-service.yml` and runs on the following schedule:
```yaml
on:
  schedule:
    - cron: '*/12 * * * *'  # Every 12 minutes
```

To use this workflow:
1. Fork this repository
2. Go to your repository's Settings > Secrets and Variables > Actions
3. Add a new secret called `WEBHOOK_URL` with your webhook service URL
4. Enable GitHub Actions in your repository

## Security Considerations

- Never expose your API keys in the code
- Use environment variables for sensitive data
- The webhook endpoint is protected by a secret token
- Use HTTPS in production
- Keep your `WEBHOOK_SECRET` secure and unique

## Dependencies

- express: Web server framework
- axios: HTTP client
- dotenv: Environment variable management
- crypto: Node.js built-in module for HMAC signature generation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 