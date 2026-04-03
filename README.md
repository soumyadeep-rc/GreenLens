# GreenLens: Web3 Sustainability Tracker

GreenLens is a full-stack, gamified sustainability platform that empowers users to track their carbon footprint and rewards eco-friendly actions with blockchain-based Green Tokens (GT) minted on the Ethereum Sepolia testnet.

## ✨ Key Features
* **Web3 Integration:** Seamless MetaMask auto-syncing and on-chain token minting (ERC-20).
* **Machine Learning Verification:** Python-based ML engine calculates precise carbon footprints and token rewards based on user inputs (Electricity, Solar, Transport, etc.).
* **Dynamic Dashboard:** Real-time tracking of lifetime CO2 saved, trees planted, and total submissions.
* **Secure Authentication:** Passwordless and secure login powered by Clerk.
* **Smooth UI/UX:** Framer Motion animations and Lenis smooth scrolling for a premium frontend experience.

---

## 🛠️ Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS, Framer Motion, Clerk Auth.
* **Backend:** Node.js, Express.js, MongoDB (Mongoose).
* **Machine Learning:** Python, FastAPI.
* **Blockchain:** Ethers.js, Solidity (Sepolia Testnet), Alchemy.
* **Storage:** Cloudinary (for verifiable image uploads like electricity bills).

---

## 📂 Folder Structure

\`\`\`text
GreenLens/
├── Frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/              # Next.js App Router (Pages & Layouts)
│   │   ├── components/       # Reusable UI (Navbar, UserProfile, etc.)
│   │   └── styles/           # Tailwind globals
│   ├── public/               # Static assets
│   ├── package.json
│   └── .env.local            # Frontend variables (Clerk, API URL)
│
├── Backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── controllers/      # Logic (user, electricity, solar, etc.)
│   │   ├── models/           # MongoDB Mongoose Schemas
│   │   ├── routes/           # Express Routers
│   │   └── utils/            # Cloudinary, AsyncHandler, ApiErrors
│   ├── rewardUser.js         # Web3 Ethers.js Minting Logic
│   ├── app.js                # Express App Setup
│   ├── index.js              # DB Connection & Server Start
│   ├── package.json
│   └── .env                  # Backend variables (Mongo, Web3 Keys, Cloudinary)
│
├── ML_Service/               # Python FastAPI Engine
│   ├── main.py               # FastAPI endpoints & ML Logic
│   ├── models/               # Pre-trained ML models (if any)
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Optional ML config
│
├── .gitignore                # Global git ignores
└── README.md
\`\`\`

---

## ⚙️ Environment Variables Setup

Before running the project, you need to set up your `.env` files in their respective directories. **Never commit these files to GitHub.**

For reference, `.env.example` is provided in Backend folder and `.env.local.example` is provided in Frontend folder.
---

## 🚀 How to Run the Project

Because GreenLens operates as a microservice architecture, you need to run **three separate terminals** simultaneously to bring the entire platform online.

### Terminal 1: The Machine Learning Engine (FastAPI)
*This calculates the rewards and carbon footprints.*
1. Open a terminal and navigate to the ML folder: `cd ML_Service`
2. Create and activate a virtual environment (optional but recommended):
   * Windows: `python -m venv venv && venv\Scripts\activate`
   * Mac/Linux: `python3 -m venv venv && source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Start the server:
   \`\`\`bash
   uvicorn main:app --reload --port 8001
   \`\`\`
   *Runs on `http://127.0.0.1:8001`*

### Terminal 2: The Node.js Backend (Express)
*This handles the database, Cloudinary uploads, and Web3 minting.*
1. Open a new terminal and navigate to the backend: `cd Backend`
2. Install dependencies: `npm install`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   *Runs on `http://localhost:8000`*
   *(Wait for the `MongoDB connected!` log).*

### Terminal 3: The Frontend (Next.js)
*This is the user interface and Dashboard.*
1. Open a third terminal and navigate to the frontend: `cd Frontend`
2. Install dependencies: `npm install`
3. Start the Next.js application:
   \`\`\`bash
   npm run dev
   \`\`\`
   *Runs on `http://localhost:3000`*

---

## 🌐 Usage Workflow
1. Navigate to `http://localhost:3000` in your browser.
2. **Log In:** Use Clerk to authenticate.
3. **Connect Wallet:** Go to the Dashboard and click "Connect MetaMask" to link your Web3 wallet. The app will auto-sync if you switch accounts in the extension.
4. **Log Activity:** Submit an electricity or solar bill.
5. **Watch the Magic:** * The Node backend sends the data to the FastAPI ML service.
   * ML determines the token reward.
   * Node calls the Smart Contract via Ethers.js to mint the reward directly to your MetaMask wallet.
   * The Dashboard updates your stats instantly!