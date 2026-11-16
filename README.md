# Textile Order & Inventory Management System (TOIMS)

MERN application for textile order, inventory and end-to-end process tracking.

## Features added in this revision
- Public textile overview Home page; Login is available from the navbar.
- Employee and Manager can create, read, update and delete business records. Admin-only user/audit screens remain protected.
- Textile stage tracking from Yarn Purchase through Shipment, with planned/completed quantity and INR costs.
- Admin-only order progress and profit/loss analytics, plus configurable USD-to-INR rate.
- Separate CSS files for Home, Dashboard and Textile Processes; Navbar and Sidebar retain their own CSS files.

## Run locally
1. Install Node.js LTS and MongoDB / MongoDB Atlas.
2. In `server`, run `npm install`, create `.env` from `.env.example`, then `npm start`.
3. In `client`, run `npm install`, create `.env` from `.env.example`, then `npm run dev`.

### server/.env.example
```env
PORT=4000
MONGO_URL=mongodb://127.0.0.1:27017/toims
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
### client/.env.example
```env
VITE_API_URL=http://localhost:4000
```

## Notes
- Public registration creates an Employee account; an Admin can assign roles.
- Admin analytics endpoints are restricted on the backend, not merely hidden in the UI.
- Exchange rate is an admin-managed manual INR-per-USD value. It is not an automatic live market feed in this version.
- Production expenses are recorded in INR. Add expense entries against an order using `POST /api/processes/expenses` with `{ order, category, description, amountINR }`.
- Textile process endpoints: `GET/POST /api/processes`, `PUT/DELETE /api/processes/:id`.
- Admin finance endpoints: `GET /api/admin/finance`, `PUT /api/admin/finance/exchange-rate`, `GET /api/admin/finance/progress`.
- Do not commit `.env`, tokens, or database credentials.
