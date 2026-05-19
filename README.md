# Finance Tracker

A personal finance tracking app for students and everyday users. Track your income, expenses, and account balances — with AI-powered receipt scanning and bank statement import.

## Features

- **Authentication** — Google OAuth2 and email/password login via Firebase
- **Account Management** — Track multiple accounts (bank, e-wallet, cash)
- **Transactions** — Manual income and expense entry
- **Receipt Scan** — Scan a receipt photo with Gemini AI to auto-fill a transaction
- **Bank Import** — Import bank mutation files (PDF, CSV) from any Indonesian bank — auto-parsed by Gemini AI
- **Category Management** — Add, rename, and delete spending categories
- **Charts & Reports** — Income vs expense by month, spending by category, and balance over time

## Tech Stack

| Layer     | Tech                         |
| --------- | ---------------------------- |
| Framework | TanStack Start (React SSR)   |
| Routing   | TanStack Router (file-based) |
| Styling   | Tailwind CSS                 |
| Auth      | Firebase Authentication      |
| Database  | Firebase Firestore           |
| AI        | Google Gemini API            |
| Charts    | Recharts                     |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/aminyG/finance-tracker.git
cd finance-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

### 4. Set up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Google + Email/Password)
3. Enable **Firestore Database**
4. Copy your config into `src/firebase.ts`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firestore Rules

Paste these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /accounts/{accountId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /categories/{categoryId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /transactions/{transactionId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Firestore Indexes

You'll need one composite index for transaction queries. Create it in Firebase Console → Firestore → Indexes → Composite:

| Collection     | Field 1            | Field 2           |
| -------------- | ------------------ | ----------------- |
| `transactions` | `userId` Ascending | `date` Descending |

## Project Structure

```
src/
├── firebase.ts               # Firebase config
├── router.tsx                # TanStack Router setup
├── styles.css                # Global styles
├── context/
│   └── AuthContext.tsx       # Auth state provider
├── components/
│   └── ProtectedRoute.tsx    # Auth guard wrapper
├── lib/
│   ├── accounts.ts           # Firestore helpers — accounts
│   ├── categories.ts         # Firestore helpers — categories
│   ├── transactions.ts       # Firestore helpers — transactions + chart data
│   └── gemini.ts             # Gemini AI — receipt scan + bank import
└── routes/
    ├── __root.tsx            # Root layout
    ├── index.tsx             # Redirect to /login
    ├── login.tsx             # Login page
    ├── dashboard.tsx         # Dashboard + charts
    ├── accounts/
    │   ├── index.tsx         # Account list
    │   └── new.tsx           # Add account
    ├── transactions/
    │   ├── index.tsx         # Transaction list
    │   └── new.tsx           # Add transaction + receipt scan
    ├── categories/
    │   └── index.tsx         # Category management
    └── import/
        └── index.tsx         # Bank CSV/PDF import
```

## Deployment

This app is deployed on Vercel using TanStack Start's SSR mode.

```bash
npm run build
```

Make sure to add `VITE_GEMINI_API_KEY` to your Vercel environment variables under **Project Settings → Environment Variables**.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Lint code
npm run format   # Format code
```
