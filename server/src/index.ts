import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const port = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// --- Routes ---

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.send('<h1>🚀 Parakeet AI API is Live</h1><p>Connect your frontend to start using the platform.</p>');
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Parakeet AI Backend is running' });
});

// Auth Middleware (Placeholder)
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  
  (req as any).user = user;
  next();
};

// 1. Get User Credits
app.get('/api/user/credits', authenticateUser, async (req: any, res: Response) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', req.user.id)
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2. List Sessions
app.get('/api/sessions', authenticateUser, async (req: any, res: Response) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 3. Create Session
app.post('/api/sessions', authenticateUser, async (req: any, res: Response) => {
  const { company, role, language } = req.body;
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ 
      user_id: req.user.id, 
      company, 
      role, 
      language,
      status: 'pending' 
    }])
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 4. List Documents
app.get('/api/documents', authenticateUser, async (req: any, res: Response) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', req.user.id);
    
    if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Stripe Payments ---

// 1. Create Checkout Session
app.post('/api/payments/create-checkout-session', authenticateUser, async (req: any, res: Response) => {
  const { planId } = req.body; // e.g., '10_credits'
  
  let amount = 1900; // $19.00
  let credits = 10;
  
  if (planId === 'pro') {
    amount = 2900; // $29.00
    credits = 100; // Or unlimited logic
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Parakeet AI - ${planId.toUpperCase()} Plan`, description: `${credits} Interview Credits` },
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

// 2. Stripe Webhook (To update credits after payment)
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

    // Update User Credits in Supabase
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    if (profile) {
      await supabase.from('profiles').update({ credits: profile.credits + creditsToAdd }).eq('id', userId);
    }
  }

  res.json({received: true});
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
