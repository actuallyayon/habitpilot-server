# HabitPilot Server (Backend REST API)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://habitpilot-server.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.0-lightgrey?logo=express)](https://expressjs.com/)

The backend REST API server powering the HabitPilot application. It orchestrates user authentication, MongoDB storage, Groq LLM integration for AI routine analyses, image uploads, and Stripe Sandbox billing integrations.

Live REST API URL: [https://habitpilot-server.vercel.app](https://habitpilot-server.vercel.app)

---

## 🚀 Core Features

- **Authentication & JWT Session Control:** Hashed password authentication via `bcryptjs`, verification cookies, dynamic Google Token validation, and refresh token cookie handling (`sameSite: 'none'`, `secure: true` for cross-subdomain support).
- **AI Routine Generator & Analyzer:** Integration with Groq API (using Llama 3) to dynamically design habit schedules, customize checklists, and analyze check-in entries.
- **REST User Management & Blocking Middleware:** Status verification middleware (`protect`) that blocks blacklisted users instantly, alongside role-based access controllers (`adminOnly`).
- **Subscription Billing (Stripe Sandbox Integration):** Handles Stripe test payment sessions, handles subscription webhooks, and includes a mock upgrade fallback for sandbox environments.
- **Image Upload Service:** Multer memory-storage uploads integrated with the ImgBB API for hosting profile picture changes.
- **Dynamic CORS Whitelisting:** Auto-authenticates dynamic Vercel previews (`*.vercel.app` patterns) and local ports to prevent cross-origin blockages.
- **Administrator Statistics Service:** Exposes signups history lists, total users/billing counts, and estimated monthly MRR parameters to the client.

---

## 🛠️ Tech Stack & Technologies Used

- **Runtime Environment:** Node.js (v18+)
- **Server Framework:** Express (TypeScript)
- **Database:** MongoDB Atlas (via Mongoose ODM)
- **AI Models:** Groq Cloud API (Llama 3 models)
- **Image Storage:** ImgBB Hosting
- **Billing API:** Stripe API
- **Language Compiler:** TypeScript

---

## 📦 Dependencies List

Key dependencies configured in `package.json`:
- `express`: `^4.21.2`
- `mongoose`: `^8.10.0`
- `jsonwebtoken`: `^9.0.2`
- `bcryptjs`: `^2.4.3`
- `stripe`: `^22.3.2`
- `multer`: `^1.4.5-lts.1`
- `axios`: `^1.7.9`
- `dotenv`: `^16.4.7`
- `cors`: `^2.8.5`
- `cookie-parser`: `^1.4.7`
- `@google/generative-ai`: `^0.21.0`

---

## 💻 Local Development Setup

To run the backend server locally:

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **MongoDB** (local or Atlas URI) set up.

### 2. Clone and Navigate
```bash
git clone https://github.com/actuallyayon/habitpilot-server.git
cd habitpilot-server
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env` in the root directory and specify the following variables:
```env
PORT=5000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_ACCESS_SECRET=your-jwt-access-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
GROQ_API_KEY=your-groq-cloud-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
IMGBB_API_KEY=your-imgbb-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Build and Start Server
```bash
# Build TypeScript
npm run build

# Start server
npm start
```
The server will start listening at [http://localhost:5000](http://localhost:5000).
