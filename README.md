# Girl Scouts Cookie Ordering System

A web app for managing Girl Scout cookie orders, inventory, and payments for Troop 40203.

## Features

### Parent Portal
- Select family from dropdown (no login required)
- Place cookie orders
- View troop and family inventory
- Request cookie exchanges with other families
- Track order status and balance

### Coordinator Dashboard
- Password-protected admin area
- Manage families and cookie varieties
- Track central inventory
- Approve/process orders
- Record payments
- Monitor exchanges

## Tech Stack

- **Frontend:** React 18 + Vite + Chakra UI
- **Backend:** Node.js + Express
- **Database:** SQLite

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

3. Seed the database:
   ```bash
   cd server
   npm run seed
   ```

### Running the App

1. Start the backend (port 3001):
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend (port 5173):
   ```bash
   cd client
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

### Admin Access

Navigate to http://localhost:5173/admin and enter the coordinator password.

## Project Structure

```
2026-cookie-reorders-system/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       ├── context/        # React context providers
│       ├── layouts/        # Page layouts
│       └── pages/          # Page components
│           ├── parent/     # Parent portal pages
│           └── admin/      # Coordinator dashboard pages
├── server/                 # Express backend
│   └── src/
│       ├── db/             # Database schema and setup
│       ├── middleware/     # Express middleware
│       └── routes/         # API routes
└── docs/                   # Design documents
```
