import express from 'express';
import cors from 'cors';
import familiesRouter from './routes/families.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/families', familiesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
