import { Router } from 'express';
import { pool } from '../services/db.service.js';
import { sendNewsletterWelcomeEmail } from '../services/email.service.js';

const router = Router();

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address format' });
  }

  try {
    // Insert subscriber to DB, ignore duplicates
    await pool.query(
      'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );

    // Send welcome email asynchronously
    sendNewsletterWelcomeEmail(email).catch(err => {
      console.error('Error sending newsletter welcome email:', err);
    });

    res.json({ success: true, message: 'Successfully subscribed' });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ success: false, error: 'Database or server error' });
  }
});

export default router;
