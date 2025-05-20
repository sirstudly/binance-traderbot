/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		await logCurrentIpAddress();

		if (request.method !== "POST") {
			return generateResponse("error", "Only POST requests allowed", 405);
		}

		// Extract and validate webhook secret from URL path
		const url = new URL(request.url);
		const pathParts = url.pathname.split('/').filter(Boolean);
		const secret = pathParts[0]; // First part of the path after domain

		if (!secret || secret !== env.WEBHOOK_SECRET) {
			return generateResponse("error", "Unauthorized", 401);
		}

		try {
			const body = await request.json();
			const { symbol, side, quantity } = body;
			const apiKey = env.BINANCE_API_KEY;
			const apiSecret = env.BINANCE_API_SECRET;
			console.log(`Request symbol: ${symbol}, side: ${side}, quantity: ${quantity}`);

			if (!apiKey || !apiSecret) {
				return generateResponse("error", "Binance API keys not configured.", 500);
			}

			if (!symbol || !side || !quantity) {
				return generateResponse("error", "Missing required fields: symbol, side, or quantity", 400);
			}

			const timestamp = Date.now();
			const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
			const signature = await signWithHMAC(queryString, apiSecret);

			const binanceResponse = await fetch(`https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`, {
				method: "POST",
				headers: {
					"X-MBX-APIKEY": apiKey,
				},
			});

			let data;
			const contentType = binanceResponse.headers.get("content-type");
			if (contentType && contentType.includes("application/json")) {
				data = await binanceResponse.json();
			} else {
				const text = await binanceResponse.text();
				console.error("Non-JSON response from Binance:", text);
				return generateResponse("error", "Invalid response from Binance API", binanceResponse.status);
			}
			
			if (!binanceResponse.ok) {
				return generateResponse("error", data.msg || "Binance API error", binanceResponse.status, data);
			}

			return generateResponse("success", "Order placed successfully", 200, data);
		} catch (error) {
			console.error("Error:", error);
			// Ensure error message is properly escaped and safe for JSON
			const safeMessage = error.message ? error.message.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') : "Internal server error";
			return generateResponse("error", safeMessage, 500);
		}
	},
};

async function logCurrentIpAddress() {
	try {
		const ipResponse = await fetch('https://api.ipify.org');
		const ip = await ipResponse.text();
		console.log('Worker IP address:', ip);
	} catch (error) {
		console.error('Failed to get IP address:', error);
	}
}

async function signWithHMAC(data, secret) {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(data)
	);
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function generateResponse(status, message, code, details = null) {
	const data = {
		status: status,
		message: message,
		code: code
	};
	if (details) {
		data.details = details;
	}
	const dataAsString = JSON.stringify(data, null, 2);
	console.log("Response:", dataAsString);

	return new Response(dataAsString, {
		headers: { "Content-Type": "application/json" },
		status: code,
	});
}