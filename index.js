import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

async function getAccountBalance(apiKey, apiSecret, asset) {
    const timestamp = Date.now();
    const recvWindow = 5000;
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

app.post("/webhook/:token", async (req, res) => {
    console.log("Received request:", JSON.stringify(req.body, null, 2));
    if (req.params.token !== process.env.WEBHOOK_SECRET) {
        console.error("Invalid token:", req.params.token);
        return res.status(403).json({ error: "Forbidden" });
    }

    const { ticker, action } = req.body;
    const apiKey = process.env.BINANCE_API_KEY;
    const apiSecret = process.env.BINANCE_API_SECRET;

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: "Binance API keys not configured." });
    }

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
        const recvWindow = 5000;
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

app.get("/", (req, res) => {
    console.log("PING...");
    res.send("Binance TraderBOT Webhook is live");
});

app.listen(port, () => console.log(`Server running on port ${port}`));