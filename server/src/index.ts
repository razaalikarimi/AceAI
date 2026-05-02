import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool, { initDb } from './db';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aceai_super_secret_key';

app.use(cors());

// Initialize Database Tables
initDb();

// --- Stripe Webhook (MUST BE BEFORE express.json()) ---
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata.userId;
    const creditsToAdd = parseInt(session.metadata.creditsToAdd);

    try {
      await pool.query('UPDATE profiles SET credits = credits + ? WHERE id = ?', [creditsToAdd, userId]);
    } catch (err) {
      console.error('Webhook Credit Update Failed:', err);
    }
  }
  res.json({received: true});
});

// Regular Body Parser for other routes
app.use(express.json());

// --- Auth Middleware ---
const authenticateUser = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// --- Auth Routes ---

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await connection.query('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [userId, email, hashedPassword]);
      await connection.query('INSERT INTO profiles (id, credits) VALUES (?, ?)', [userId, 0]);
      await connection.commit();
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: userId, email } });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateUser, (req: any, res: Response) => {
  res.json({ user: req.user });
});

// --- Data Routes ---

app.get('/api/user/credits', authenticateUser, async (req: any, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT credits FROM profiles WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', authenticateUser, async (req: any, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', authenticateUser, async (req: any, res: Response) => {
  const { company, role, language } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO sessions (user_id, company, role, language, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, company, role, language, 'pending']
    );
    res.json({ id: result.insertId, user_id: req.user.id, company, role, language, status: 'pending' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', authenticateUser, async (req: any, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM documents WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments/create-checkout-session', authenticateUser, async (req: any, res: Response) => {
  const { planId } = req.body;
  let amount = 1900;
  let credits = 10;
  if (planId === 'pro') { amount = 2900; credits = 100; }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `AceAI - ${planId.toUpperCase()} Plan` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/#/dashboard?payment=success`,
      cancel_url: `${req.headers.origin}/#/dashboard?payment=cancel`,
      metadata: { userId: req.user.id, creditsToAdd: credits.toString() }
    });
    res.json({ id: session.id, url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 AceAI Backend running on port ${port}`);
});


