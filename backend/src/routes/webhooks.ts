import { Router } from 'express';

const router = Router();

router.post('/submission', async (req, res) => {
  const webhookUrl = process.env.VITE_SUBMISSION_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "VITE_SUBMISSION_WEBHOOK_URL not configured in backend." });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to trigger submission webhook:', error);
    res.status(500).json({ error: 'Failed to trigger webhook' });
  }
});

router.post('/drivemail', async (req, res) => {
  const webhookUrl = process.env.VITE_DRIVEMAIL_SYNC_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "VITE_DRIVEMAIL_SYNC_WEBHOOK_URL not configured in backend." });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to trigger drivemail webhook:', error);
    res.status(500).json({ error: 'Failed to trigger webhook' });
  }
});

export default router;
