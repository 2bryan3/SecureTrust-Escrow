# SecureTrust

A full-stack peer-to-peer marketplace with built-in escrow protection, dispute mediation, and real-time messaging. Built as a capstone project (ICSI499) using the MERN stack with TypeScript.

---

## Overview

SecureTrust solves a core problem in peer-to-peer marketplaces: trust. Buyers worry about paying for items that never arrive or aren't as described. Sellers worry about not getting paid. SecureTrust addresses this by holding funds in escrow and only releasing them once both parties fulfill their obligations — with a human mediator available to resolve disputes.

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (dev server + proxy)
- React Router v6
- Axios + native Fetch
- Socket.IO client
- Stripe.js / React Stripe Elements
- Lucide React (icons)

**Backend**
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Socket.IO
- Stripe API (PaymentIntents, manual capture, refunds)
- JSON Web Tokens (JWT) + cookie-based auth
- Multer (file handling)

---

## Features

### Authentication
- JWT-based auth with HTTP-only cookies
- Protected routes on both frontend and backend
- Role-based access: `user`, `mediator`, `admin`
- Banned user check on every authenticated request

### Listings
- Create, edit, and delete listings with multiple images (base64 stored in MongoDB)
- Category system with 18 categories and dynamic attribute fields per category
- Delivery method: Shipping or Local Pickup
- Listing states: Available → Locked (in transaction) → Sold
- Favorites system with counts
- Popular Now page (aggregated by favorites)
- Advanced search with price range and category-specific attribute filtering
- Listings hidden from edit when locked

### Escrow Transaction System
A two-milestone flow that ensures both parties act before money moves:

**Milestone 1 — Shipment & Deposit**
- Seller uploads package photo (base64) + tracking number + carrier
- Buyer deposits funds via Stripe (manual capture — card authorized but not charged)
- Both actions required before milestone advances
- Listing locked (`isLocked: true`) when buyer deposits

**Milestone 2 — Confirm Delivery & Release Funds**
- Buyer confirms receipt of item
- Stripe PaymentIntent captured (buyer's card charged)
- Funds credited to seller's in-app balance
- `totalSales` incremented on seller
- Listing marked sold (`isSold: true`)
- SecureTrust Bot sends confirmation message to seller

**Milestone 3 — Return Shipment (Mediator Refund Flow)**
- Triggered when mediator rules in buyer's favor
- Buyer ships item back with photo + tracking
- Seller confirms return received
- Stripe refund issued (cancel PI if pre-capture, create refund if post-capture)
- Listing marked sold/closed

### Dispute & Mediation System
- Dedicated `/escalate/:transactionId` page with message + image evidence upload
- Evidence stored as base64 in MongoDB (same as listing images)
- Dispute only available after buyer has deposited funds
- Escalation sets `isEscalated: true` on listing and `status: "disputed"` on transaction
- Mediator dashboard shows:
  - Escalation message with author + date
  - Evidence images (clickable full preview)
  - Package photo from milestone 1
  - Transaction context (amount, disputed at milestone, tracking/delivery method)
  - Who filed the dispute (Buyer or Seller) + days open / closed status
  - Filter by status: Pending, Under Review, Resolved, Refunded, Dismissed
- Mediator actions:
  - **Release Funds to Seller** — captures Stripe PI, credits seller balance, marks sold
  - **Refund Buyer** — initiates milestone 3 return flow instead of immediate refund
  - **Dismiss** — closes dispute, unlocks listing
  - All rulings require decision notes (10+ chars)
- SecureTrust Bot sends notifications to both parties on escalation and on ruling

### Real-Time Messaging
- Socket.IO for real-time message delivery
- Per-conversation unread tracking (`unreadCounts` map in MongoDB)
- Unread badge on navbar icon (sum of all unread counts)
- Per-conversation blue dot + bold name + message preview + count badge
- Messages grouped by 5-minute intervals (timestamps only shown at gaps)
- Mark as read when conversation is opened (backend + optimistic local update)
- Conversations persist across page refreshes
- SecureTrust Bot system user for automated notifications
- Conversation hidden/shown based on `hiddenBy` array

### Ratings & Reviews
- 1–5 star rating with optional note
- Per-transaction, per-role (buyer rates seller, seller rates buyer)
- Prevents duplicate ratings via `hasRated` check from backend on load
- Ratings tab on Profile (filter: All / As Seller / As Buyer)
- Seller rating displayed on listing page
- `rating` and `totalRatings` updated on User on submission
- Rating available after completion or after milestone 3 refund
- Hidden during active milestone 3 return

### Admin Dashboard
- Overview, Users, Listings, and Audit Log tabs
- Ban/unban users (`isBanned` replaces old status/suspend system)
- Banning cascades: deletes all listings, images, categories, reports, favorites
- `isBanned` checked in `protectRoute` — banned users cannot authenticate
- Role management (user / mediator / admin)
- `InlineSelect` for role-change modal

### Profile
- Ratings tab with role filter
- Active Listings tab (filters out sold listings)
- `totalSales` stat
- `refreshUser` called on mount so stats are always current

---

## Project Structure

```
/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Reusable UI (NavBar, ListingCard, MessagesPanel, etc.)
│   │   ├── context/        # AuthContext, ConversationContext
│   │   ├── pages/          # Route-level components
│   │   ├── styles/         # CSS files per component
│   │   ├── types/          # Shared TypeScript types
│   │   ├── data/           # categoryFields.ts
│   │   └── utils/          # socket.ts, api.ts
│   └── vite.config.ts      # Proxy: /api → backend
│
└── backend/                # Express + TypeScript
    ├── src/
    │   ├── controllers/    # Business logic
    │   ├── models/         # Mongoose schemas
    │   ├── routes/         # Express routers
    │   └── utils/          # stripe.ts, socketManager.ts, protectRoute.ts
    └── tsconfig.json
```

---

## Environment Variables

### Backend `.env`
```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SYSTEM_USER_ID=mongodb_object_id_of_bot_user
```

### Frontend `.env`
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Stripe account (test mode)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/securetrust.git
cd securetrust

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`. Vite proxies all `/api` requests to the backend.

### Stripe Webhook (local testing)
```bash
stripe listen --forward-to localhost:3000/payment/webhook
```

### Seeding the Bot User
The SecureTrust Bot is a system user required for automated messages. Create a user in MongoDB manually or via a seed script and set its `_id` as `SYSTEM_USER_ID` in your backend `.env`.

---

## Key Design Decisions

- **Manual Stripe capture** — funds are authorized (not charged) at deposit. The actual charge only happens when the buyer confirms delivery (milestone 2) or when the mediator releases funds. This protects the buyer.
- **Base64 image storage** — images are stored directly in MongoDB as base64 strings, matching the approach used for listing images. No separate file hosting required for the capstone.
- **Per-conversation unread counts** — stored as a `Map<userId, count>` on the Conversation document, giving accurate per-conversation unread tracking that persists across page refreshes.
- **Milestone 3 return flow** — rather than immediately refunding when a mediator rules for the buyer, the transaction moves to a return milestone where the buyer must ship the item back and the seller must confirm receipt before the refund fires.

---

## Transaction State Machine

```
initiated
    ↓
milestone1 (seller ships + buyer deposits)
    ↓
milestone2 (buyer confirms delivery)
    ↓
completed ──────────────────────────────── normal flow

milestone2 → disputed (escalated to mediator)
    ↓
mediator rules:
  → Resolved  → completed (seller paid)
  → Refunded  → milestone3 (buyer returns item)
                    ↓
                refunded (stripe refund issued)
  → Dismissed → transaction continues

milestone1 → cancelled (before funds move)
```

---

## License

All rights reserved. This codebase was written entirely by the development team as part of ICSI499.
