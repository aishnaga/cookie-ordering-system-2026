# Girl Scouts Cookie Ordering System - Design Document

## Overview

A web app for managing Girl Scout cookie orders, inventory, and payments for Troop 40203.

### Personas

1. **Troop Cookie Coordinator** - Manages inventory, approves orders, tracks payments. Also a parent in the troop with dual roles.
2. **Parents** - Place orders, view inventory, exchange cookies with other parents.

## Tech Stack

- **Frontend:** React with component library (Chakra UI or shadcn/ui)
- **Backend:** Node.js with Express
- **Database:** SQLite (file-based, simple for small troop)
- **Hosting:** Local or free tier (Render, Railway, Vercel)

## Authentication

- **Coordinator:** Password-protected (`/admin` routes) with session-based auth
- **Parents:** No login - shared link, select family from dropdown

## Data Model

### Families
- id, name, contact_info (optional)
- Balance calculated from orders

### Cookie Varieties
- id, name, price_per_box, active (boolean)
- Pre-populated with standard Girl Scout lineup

### Inventory
- family_id (NULL for troop central)
- cookie_variety_id
- quantity
- For central: status (ordered, on_hand)

### Orders
- id, family_id, created_at
- status: pending → approved → ready_for_pickup → picked_up → paid
- amount_owed (calculated), amount_paid, payment_notes

### Order Line Items
- order_id, cookie_variety_id, quantity, unit_price

### Exchanges
- id, requesting_family_id, providing_family_id
- cookie_variety_id, quantity
- status: requested → approved → completed

### Inventory Transactions (audit trail)
- id, cookie_variety_id, quantity
- from_family_id, to_family_id
- reason (order_fulfillment, exchange, adjustment, council_delivery)
- created_at

## Parent Portal Workflows

### Accessing the Portal
- Open shared link
- Select family from dropdown (remembered in browser)

### Placing an Order
1. View available varieties with prices
2. Enter quantities
3. See total, submit
4. Order status: "Pending" until coordinator approves

### Viewing Inventory
- Troop central inventory (what's available)
- Other families' inventory (for exchanges)

### Requesting an Exchange
1. Browse other families' inventory
2. Select variety/quantity to request
3. Providing family approves or declines
4. On approval: inventories update, coordinator notified

### Viewing Own Status
- My orders and status
- My inventory
- My balance (owed vs. paid)
- Pending exchange requests

## Coordinator Dashboard Workflows

### Dashboard Home
- Quick stats: pending orders, pending exchanges, total owed vs. collected
- Alerts: new orders, completed exchanges

### Managing Families
- Add/edit/remove families
- View any family's balance, orders, inventory

### Managing Cookie Varieties
- Pre-loaded standard lineup
- Edit prices, add/remove varieties

### Managing Central Inventory
- Record incoming inventory from council
- Mark deliveries (ordered → on-hand)
- View totals by variety

### Processing Orders
- View pending orders
- Approve → assign inventory → "Ready for Pickup"
- Record pickup → inventory moves to family → "Picked Up"
- Decline with notes if needed

### Recording Payments
- Enter amount paid and notes per order
- View running balance per family

### Exchange Notifications
- See completed exchanges
- Acknowledge to clear alerts

## Page Structure

### Parent Portal (public)
```
/                    → Family selector + main menu
/order               → Place new order form
/inventory           → View troop & family inventories
/exchange            → Request/manage exchanges
/my-status           → My orders, balance, inventory
```

### Coordinator Dashboard (password-protected)
```
/admin               → Login → Dashboard home
/admin/families      → Manage family list
/admin/cookies       → Manage cookie varieties & prices
/admin/inventory     → Central inventory management
/admin/orders        → View/approve/process orders
/admin/payments      → Record payments, view balances
/admin/exchanges     → View exchange activity
```

## UI Guidelines

- Mobile-friendly (parents use phones)
- Clean tables and forms
- Color-coded status badges
- Confirmation dialogs for important actions

## Edge Cases

- Order with insufficient inventory → stays pending with warning
- Exchange request exceeds available → blocked with message
- Coordinator processes own order → allowed
- Overpayment → shows as credit

## Future Enhancements (not in v1)

- Integrated payment processing
- CSV/Excel exports
- Email notifications
