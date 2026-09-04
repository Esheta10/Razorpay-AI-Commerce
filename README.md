# Razorpay AI Growth & Agentic Commerce

Production-minded buildathon scaffold for Track 01: an explainable buyer agent that reads a merchant catalog, performs gated checkout actions, simulates Razorpay test-mode payment flows, and records every money action in an audit trail.

## Exact Initialization Commands

```bash
mkdir razorpay-ai-commerce
cd razorpay-ai-commerce
mkdir -p server/{models,routes,services,utils} client/{public,src/{assets,components,features,services}}
cd server
npm init -y
npm install express cors dotenv mongoose morgan nanoid openai razorpay
npm install -D nodemon
cd ../client
npm create vite@latest . -- --template react
npm install axios lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Run Locally

```bash
cd server
npm install
npm run seed
npm run dev
```

Create `server/.env` with your local MongoDB, Gemini, and Razorpay test-mode settings before starting the server. Keep this file private; it is ignored by Git.

Copy the printed `merchantId`, then in another terminal:

```bash
cd client
npm install
echo VITE_DEMO_MERCHANT_ID=PASTE_MERCHANT_ID_HERE > .env
npm run dev
```

## Architecture

- `server/models`: `Merchant`, `Product`, `Transaction`, `AuditLog`.
- `server/services`: buyer agent checkout loop, Gemini catalog chat, optional LLM planning, catalog shaping, and financial guardrail evaluation.
- `server/utils`: audit logging and Razorpay test-mode SDK integration.
- `client/src/components`: reusable `Button`, `Card`, and `AuditTrailViewer`.
- `client/src/features`: domain views for checkout, catalog, and merchant dashboard.
