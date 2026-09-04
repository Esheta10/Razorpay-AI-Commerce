# Razorpay AI Growth & Agentic Commerce

This project helps a merchant become easy for AI shopping agents to discover and buy from.

It combines:

- A conversational shopping assistant
- An agent-readable product catalog
- Product recommendations and cross-sells
- Razorpay test-mode checkout
- Spending limits and human approval
- A visible audit trail for money actions
- A Protocol Inspector showing AP2-style agent payment data

## How It Works

1. The merchant enters their Merchant ID.
2. The AI assistant reads the active product catalog.
3. A buyer can ask for products, quantities, or recommendations.
4. The buyer adds products to a shared checkout cart.
5. The server checks the products, quantities, payment method, and total amount.
6. Higher-value orders pause for human approval.
7. Approved orders open Razorpay Checkout in test mode.
8. The payment result is verified by the server and recorded in the Audit Trail.

## What Makes It Safe

- The server calculates the cart total from the merchant catalog.
- The browser cannot change product prices or create an invalid amount.
- Merchant spending limits are checked before a Razorpay order is created.
- Orders above the configured limit require human approval.
- Payment signatures are verified on the server.
- Razorpay webhook signatures are checked before transaction updates.
- Failed payment scenarios show a visible recovery path.

## Protocol Inspector

The Protocol Inspector is a judge-friendly view of the data exchanged between an AI buyer and the merchant.

It shows AP2-style payment information such as:

- Agent and merchant identity
- Products and quantities
- Amount and currency
- Spending limits
- Human approval status
- Checkout and payment mandate data
- Server-generated ES256 signature information

This is a local AP2 demonstration. Full ecosystem integration would additionally require an official trusted agent, credential provider, and payment network connection.

## Run Locally

Prerequisites:

- Node.js 18 or newer
- MongoDB or a MongoDB Atlas database
- Razorpay test-mode credentials
- Gemini API key for the conversational assistant

### 1. Configure the server

Create `server/.env` with these variables:

```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Never commit this file or share its values.

### 2. Start the server

```bash
cd server
npm install
npm run seed
npm run dev
```

The seed command creates a demo merchant and skincare catalog, then prints the Merchant ID.

### 3. Start the client

In another terminal:

```bash
cd client
npm install
npm run dev
```

Open the localhost URL shown by Vite. Enter the printed Merchant ID and click **Simulate Agent**.

## Try The Demo

Use the chat assistant with requests such as:

```text
Add 2 Vitamin C Serum
Add Ceramide Lip Balm
Recommend something for dry skin
```

Then click **Add recommended product** and **Checkout**.

To demonstrate the safety gate, use **Simulate ₹2,500 Spend**. The payment controls will lock and ask for approval or rejection.

To demonstrate recovery, click **Trigger Graceful Failure Test**.

## Project Areas

- `client`: dashboard, chatbot, catalog, payment review, and audit display
- `server/routes`: merchant, agent, and payment endpoints
- `server/services`: catalog, guardrails, Gemini assistant, and checkout logic
- `server/models`: merchant, product, transaction, and audit records
- `server/utils/ap2.js`: local signed AP2 mandate demonstration

## Important Note

Razorpay and AP2 are configured for test/demo use in this project. Before production use, add authenticated merchant users, server-issued human approval tokens, persistent signing keys, rate limiting, monitoring, and a managed secrets solution.
