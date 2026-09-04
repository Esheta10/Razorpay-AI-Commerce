# Razorpay AI Growth & Agentic Commerce

A full-stack agentic commerce and connection recovery engine designed to bridge the gap between autonomous AI shopping agents and online merchants. 
<img width="1293" height="586" alt="image" src="https://github.com/user-attachments/assets/40b31e1f-6e18-4abd-91fa-3ac9d9b5c5cc" />
<img width="1271" height="576" alt="image" src="https://github.com/user-attachments/assets/81c09347-5562-4986-82b5-340d46880771" />
<img width="1243" height="581" alt="image" src="https://github.com/user-attachments/assets/f04a09de-f879-42f2-8b9f-a6b17db02e02" />

---

## Architecture & Core Capabilities

* **Conversational Shopping Assistant**: Powered by the Gemini API to let users or buyer agents discover products, manage quantities, and receive smart recommendations in real time.
* **Agent-Readable Catalog**: Structured merchant catalogs that allow AI systems to parse products, descriptions, and SKUs seamlessly.
* **Server-Side Guardrails & Safety Gates**: Enforces strict validation by calculating cart totals directly on the backend, checking merchant spending limits, and triggering mandatory **Human-in-the-Loop (HITL)** approval workflows for high-value orders.
* **Secure Razorpay Test-Mode Integration**: Executes verifiable checkouts with strict payment and webhook signature verification.
* **Protocol Inspector**: A judge-friendly debugging view displaying AP2-style payment mandates, agent identities, and server-generated ES256 signatures.
* **Transparent Audit Trail**: A complete, event-driven log recording every money action, guardrail evaluation, and failure recovery attempt.

---

## System Flow & How It Works

1. **Initialization**: The merchant enters their unique `Merchant_ID` to load the active catalog and configuration rules.
2. **Discovery & Cart Building**: Buyers interact with the conversational assistant to query products and add items to a shared checkout cart.
3. **Guardrail Evaluation**: The server independently verifies product prices, quantities, and totals against pre-set spending limits.
4. **Approval & Settlement**: Orders exceeding spending caps are locked pending human review. Once approved, the transaction proceeds to secure Razorpay test-mode execution and is logged in the audit trail.

---

## Project Structure

* `client`: Dashboard interface, conversational chatbot, catalog view, payment review screen, and audit display.
* `server/routes`: Merchant, agent, and payment processing endpoints.
* `server/services`: Core logic for catalog handling, guardrails, Gemini assistant integration, and checkout management.
* `server/models`: MongoDB schemas for merchants, products, transactions, and audit logs.
* `server/utils/ap2.js`: Local signed AP2 payment mandate demonstration implementation.

---

## Local Setup & Installation

### Prerequisites
* **Node.js**: Version 18 or newer
* **Database**: MongoDB or MongoDB Atlas
* **Gateways & APIs**: Razorpay test-mode credentials and a Google Gemini API key

### 1. Server Configuration
Create a `.env` file inside the `server/` directory with the following variables:


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

###Merchant ID:  6a9acf5dfc801b18bccdb55d

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

