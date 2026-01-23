import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sessionMiddleware, loginAdmin, logoutAdmin, checkAdmin } from './middleware/auth.js';
import familiesRouter from './routes/families.js';
import cookiesRouter from './routes/cookies.js';
import inventoryRouter from './routes/inventory.js';
import ordersRouter from './routes/orders.js';
import exchangesRouter from './routes/exchanges.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy in production (for secure cookies behind reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
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

// Serve static files in production
if (isProduction) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
