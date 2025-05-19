import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", async (req, res) => {
  const { symbol, side, quantity } = req.body;
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Binance API keys not configured." });
  }
  
  if (!symbol || !side || !quantity) {
    return res.status(400).json({ error: "Missing symbol, side, or quantity" });
  }

  try {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&recvWindow=${recvWindow}&timestamp=${timestamp}`;

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
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error?.response?.data?.msg || error.message,
      code: error?.response?.status,
      details: error?.response?.data || null,
    });
  }
});

app.get("/", (req, res) => res.send("Binance TraderBOT Webhook is live"));

app.listen(port, () => console.log(`Server running on port ${port}`));
