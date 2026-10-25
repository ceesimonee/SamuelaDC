import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors()); 
app.use(express.json()); 

app.post('/api/send-sms', async (req, res) => {
  try {
    const { phone_number, message } = req.body;
    
    console.log(`\n👉 Sending SMS to: ${phone_number}`);

    // We use the EXACT format that successfully logged on your dashboard on Oct 24
    const targetUrl = `https://www.iprogsms.com/api/v1/sms_messages?api_token=fdc0553c9169cf165eafc4eb8d88371f0dd4fd49&phone_number=${encodeURIComponent(phone_number)}&message=${encodeURIComponent(message)}`;

    // Send it to IPROG
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    
    // THIS IS THE MOST IMPORTANT LINE:
    console.log("📥 IPROG SAID:", data); 

    if (!response.ok) {
        return res.status(response.status).json({ success: false, error: data });
    }
    
    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ success: false, error: "Failed to reach IPROG" });
  }
});

app.listen(5000, () => {
  console.log('✅ Secure SMS Backend running on http://localhost:5000');
});