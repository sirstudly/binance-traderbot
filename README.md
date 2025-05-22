# Binance TraderBOT Webhook

A Node.js webhook service that allows you to execute trades on Binance through HTTP requests. This service provides a simple REST API endpoint that can be integrated with various trading bots, signals, or automated systems.

## Features

- Execute market orders on Binance
- Support for multiple subaccounts with unique tokens
- Automatic quantity calculation (uses 100% of available balance)
- Case-insensitive action handling (BUY/buy, SELL/sell)
- SQLite database for API credentials storage
- Simple REST API endpoint
- Secure API key handling
- Error handling and response formatting
- Environment variable configuration
- Automatic service keep-alive with GitHub Actions
- Web interface for managing multiple accounts

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
ADMIN_TOKEN=your_admin_token_here  # Required for credential management
RECV_WINDOW=10000  # Optional, defaults to 10000ms (10s)
```

4. Start the server:
```bash
npm start
```

## Usage

### Web Interface

The application includes a web interface for managing multiple Binance accounts. To access it:

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000/api/credentials
```

The web interface provides:
- A form to add new accounts with:
  - Account name (optional, for identification)
  - Webhook token (unique token for this account)
  - API key and secret
- A table showing all existing accounts
- The ability to delete accounts
- Secure admin token authentication

### API Endpoints

The application provides REST API endpoints for managing credentials. All endpoints require an admin token to be sent in the `X-Admin-Token` header.

#### Web Interface and Status
- `GET /api` - Check if the service is running
- `GET /api/credentials` - Serves the web interface for credential management

#### Credential Management
- `POST /api/credentials` - Add new credentials
  ```json
  {
    "name": "Main Account",
    "token": "your-webhook-token",
    "api_key": "your-api-key",
    "api_secret": "your-api-secret"
  }
  ```
- `GET /api/credentials/list` - List all credentials
  ```json
  {
    "status": "success",
    "credentials": [
      {
        "id": 1,
        "name": "Main Account",
        "token": "your-webhook-token",
        "api_key": "your-api-key",
        "created_at": "2024-03-21T12:00:00.000Z",
        "updated_at": "2024-03-21T12:00:00.000Z"
      }
    ]
  }
  ```
- `DELETE /api/credentials/:id` - Delete specific credentials

#### Trading
- `POST /api/webhook/:token` - Execute trades (requires webhook token)
  ```bash
  curl -X POST http://localhost:3000/api/webhook/your_account_token \
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

### Multi-Account Support

The application supports multiple Binance accounts, each with its own:
- Unique webhook token
- API credentials
- Account name (for easy identification)

To add a new account:
1. Access the web interface at `http://localhost:3000/api/credentials`
2. Enter your admin token
3. Fill in the form with:
   - Account name (optional, for identification)
   - Webhook token (unique token for this account)
   - API key and secret for the account
4. Use the provided webhook token in your trading signals

## Database

The application uses SQLite to store Binance API credentials. The database file (`credentials.db`) will be automatically created in the project root directory when you first run the application.

The credentials table structure:
```sql
CREATE TABLE credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| ADMIN_TOKEN | Token for accessing credential management endpoints | - | Yes |
| PORT | Port to run the server on | 3000 | No |
| RECV_WINDOW | Request validity window in milliseconds | 10000 | No |

## Security Considerations

- Never expose your API keys in the code
- Each account has its own unique webhook token
- Use HTTPS in production
- Keep your `ADMIN_TOKEN` secure and unique
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