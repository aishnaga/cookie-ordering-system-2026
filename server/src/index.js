import express from 'express';
import cors from 'cors';
import { sessionMiddleware, loginAdmin, logoutAdmin, checkAdmin } from './middleware/auth.js';
import familiesRouter from './routes/families.js';
import cookiesRouter from './routes/cookies.js';
import inventoryRouter from './routes/inventory.js';
import ordersRouter from './routes/orders.js';
import exchangesRouter from './routes/exchanges.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(sessionMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/admin/login', loginAdmin);
app.post('/api/admin/logout', logoutAdmin);
app.get('/api/admin/check', checkAdmin);

// API routes
app.use('/api/families', familiesRouter);
app.use('/api/cookies', cookiesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/exchanges', exchangesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
