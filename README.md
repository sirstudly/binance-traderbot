# Binance TraderBOT Webhook

A Node.js webhook service that allows you to execute trades on Binance through HTTP requests. This service provides a simple REST API endpoint that can be integrated with various trading bots, signals, or automated systems.

## Features

- Execute market orders on Binance
- Automatic quantity calculation (uses 100% of available balance)
- Case-insensitive action handling (BUY/buy, SELL/sell)
- SQLite database for API credentials storage
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

3. Create a `.env` file in the root directory with your configuration:
```env
PORT=3000  # Optional, defaults to 3000
WEBHOOK_SECRET=your_webhook_secret_here  # Required for webhook security
RECV_WINDOW=10000  # Optional, defaults to 10000ms (10s)
```

4. Initialize the database with your Binance API credentials:
```bash
# The database will be automatically created when you first run the application
# You'll need to add your API credentials to the database (see API Management section)
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

## API Management

The application uses SQLite to store Binance API credentials. The database file (`credentials.db`) will be automatically created in the project root directory when you first run the application.

The credentials table structure:
```sql
CREATE TABLE credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Managing API Credentials

The application provides REST API endpoints for managing credentials. All endpoints require an admin token to be sent in the `X-Admin-Token` header.

#### Add New Credentials
```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: your_admin_token" \
  -d '{
    "api_key": "your_binance_api_key",
    "api_secret": "your_binance_api_secret"
  }'
```

#### List All Credentials
```bash
curl -X GET http://localhost:3000/api/credentials \
  -H "X-Admin-Token: your_admin_token"
```

#### Delete Credentials
```bash
curl -X DELETE http://localhost:3000/api/credentials/1 \
  -H "X-Admin-Token: your_admin_token"
```

Note: The application will always use the most recent credentials (highest ID) for trading operations.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| WEBHOOK_SECRET | Secret token for webhook security | - | Yes |
| ADMIN_TOKEN | Token for accessing credential management endpoints | - | Yes |
| PORT | Port to run the server on | 3000 | No |
| RECV_WINDOW | Request validity window in milliseconds | 10000 | No |

## Security Considerations

- Never expose your API keys in the code
- The webhook endpoint is protected by a secret token
- Use HTTPS in production
- Keep your `WEBHOOK_SECRET` secure and unique
- Consider using a shorter `RECV_WINDOW` for better security
- The SQLite database file should be properly secured and backed up

## Dependencies

- express: Web server framework
- axios: HTTP client
- dotenv: Environment variable management
- crypto: Node.js built-in module for HMAC signature generation
- sqlite3: SQLite database driver
- sqlite: SQLite database wrapper

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 