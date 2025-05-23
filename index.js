import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const recvWindow = process.env.RECV_WINDOW || 10000; // Default to 10s if not set

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check admin token
const checkAdminToken = (req, res, next) => {
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({ error: "Invalid admin token" });
    }
    next();
};

// Serve the web interface at /api/credentials
app.get('/api/credentials', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints for managing credentials
app.post("/api/credentials", checkAdminToken, async (req, res) => {
    const { api_key, api_secret, token, name } = req.body;
    
    if (!api_key || !api_secret || !token) {
        return res.status(400).json({ error: "Missing required fields: API key, API secret, or token" });
    }

    const result = await db.addCredentials(api_key, api_secret, token, name || '');
    if (result.success) {
        res.json({ 
            status: "success", 
            message: "Credentials added successfully",
            id: result.id 
        });
    } else {
        res.status(500).json({ 
            status: "error", 
            message: "Failed to add credentials",
            error: result.error 
        });
    }
});

app.get("/api/credentials/list", checkAdminToken, async (req, res) => {
    try {
        const credentials = await db.getAllCredentials();
        res.json({ 
            status: "success", 
            credentials: credentials.map(c => ({
                id: c.id,
                name: c.name || '',
                token: c.token,
                api_key: c.api_key,
                created_at: c.created_at,
                updated_at: c.updated_at
            }))
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Failed to retrieve credentials",
            error: error.message 
        });
    }
});

app.delete("/api/credentials/:id", checkAdminToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid credential ID" });
    }

    const result = await db.deleteCredentials(id);
    if (result.success) {
        res.json({ 
            status: "success", 
            message: "Credentials deleted successfully",
            changes: result.changes 
        });
    } else {
        res.status(500).json({ 
            status: "error", 
            message: "Failed to delete credentials",
            error: result.error 
        });
    }
});

async function getAccountBalance(apiKey, apiSecret, asset) {
    const timestamp = Date.now();
    const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    
    const signature = crypto
        .createHmac("sha256", apiSecret)
        .update(queryString)
        .digest("hex");

    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;
    
    const response = await axios.get(url, {
        headers: {
            "X-MBX-APIKEY": apiKey,
        },
    });

    const balance = response.data.balances.find(b => b.asset === asset);
    return balance ? parseFloat(balance.free) : 0;
}

async function getCurrentPrice(symbol) {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    return parseFloat(response.data.price);
}

async function getSymbolInfo(symbol) {
    const response = await axios.get(`https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol}`);
    const symbolInfo = response.data.symbols[0];
    const baseAsset = symbolInfo.baseAsset;
    const quoteAsset = symbolInfo.quoteAsset;
    const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
    const stepSize = parseFloat(lotSizeFilter.stepSize);
    return { baseAsset, quoteAsset, stepSize };
}

function roundToStepSize(quantity, stepSize) {
    const precision = Math.log10(1 / stepSize);
    return Math.floor(quantity * Math.pow(10, precision)) / Math.pow(10, precision);
}

app.post("/api/webhook/:token", async (req, res) => {
    console.log("Received request:", JSON.stringify(req.body, null, 2));
    
    // Get credentials from database using token
    const credentials = await db.getCredentialsByToken(req.params.token);
    if (!credentials) {
        console.error("Invalid token:", req.params.token);
        return res.status(403).json({ error: "Invalid token" });
    }

    const { api_key: apiKey, api_secret: apiSecret } = credentials;
    const { ticker, action } = req.body;
    
    if (!ticker || !action) {
        return res.status(400).json({ error: "Missing ticker or action" });
    }

    try {
        // Get symbol information
        const { baseAsset, quoteAsset, stepSize } = await getSymbolInfo(ticker);
        const currentPrice = await getCurrentPrice(ticker);
        console.log(`Base Asset: ${baseAsset}, Quote Asset: ${quoteAsset}, Step Size: ${stepSize}, Current Price: ${currentPrice}`);

        let quantity;
        if (action.toUpperCase() === "BUY") {
            // For BUY, get USDT balance and calculate how much of the base asset we can buy
            const usdtBalance = await getAccountBalance(apiKey, apiSecret, quoteAsset);
            quantity = roundToStepSize(usdtBalance / currentPrice, stepSize);
            console.log(`BUY! Asset Balance: ${usdtBalance}, Quantity: ${quantity}`);
        }
        else if (action.toUpperCase() === "SELL") {
            // For SELL, get the base asset balance
            const unroundedQuantity = await getAccountBalance(apiKey, apiSecret, baseAsset);
            quantity = roundToStepSize(unroundedQuantity, stepSize);
            console.log(`SELL! Quantity: ${unroundedQuantity} rounded down to ${quantity}`);
        }
        else {
            return res.status(400).json({ error: "Invalid action. Must be BUY or SELL" });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: "Insufficient balance for the trade" });
        }

        const timestamp = Date.now();
        const queryString = `symbol=${ticker}&side=${action}&type=MARKET&quantity=${quantity}&recvWindow=${recvWindow}&timestamp=${timestamp}`;

        const signature = crypto
            .createHmac("sha256", apiSecret)
            .update(queryString)
            .digest("hex");

        const url = `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`;

        const response = await axios.post(url, null, {
            headers: {
                "X-MBX-APIKEY": apiKey,
            },
        });

        res.json({
            status: "success",
            order: response.data,
        });
        console.log("Successful Response:", JSON.stringify(response.data, null, 2));
    }
    catch (error) {
        const errorResponse = {
            status: "error",
            message: error?.response?.data?.msg || error.message,
            code: error?.response?.status,
            details: error?.response?.data || null,
        };
        res.status(500).json(errorResponse);
        console.error("Error Response:", JSON.stringify(errorResponse, null, 2));
    }
});

app.get("/api", (req, res) => {
    console.log("PING...");
    res.send("Binance TraderBOT Webhook is live");
});

// Initialize database and start server
db.initialize()
    .then(() => {
        app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing database connection...');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Closing database connection...');
    await db.close();
    process.exit(0);
});