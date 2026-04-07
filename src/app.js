import express from "express";
import dotenv from 'dotenv';
import cors from 'cors'

dotenv.config();
import { generateBaches } from "./utils/code_gen.js";
import { onlineDBClient } from "./db.js";

const app = express();
app.use(cors())
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Server is running!');
})

app.post('/pay/verify', async (req, res) => {
  try {
    const { reference, role } = req.body;

    // Validate inputs
    if (!reference || !role) {
      return res.status(400).json({ error: "Missing reference or role" });
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
      }
    });

    if (!paystackRes.ok) {
      return res.status(502).json({ error: "Paystack service unavailable" });
    }

    const result = await paystackRes.json();

    if (result.data.status !== "success") {
      return res.status(400).json({ error: "Payment not verified" });
    }
    const checkData = await onlineDBClient.query('SELECT * FROM codes WHERE is_bought = true AND reference = $1', [reference]);
    const resConfirm = checkData.rows[0]

    if (resConfirm) {
      const { code_string } = resConfirm
      return res.json({ code: code_string })
    }
    //THE main feature
    const updateResult = await onlineDBClient.query(
      `UPDATE codes SET is_bought = true, bought_at = NOW(), wa_id = $1 WHERE code_string = (SELECT code_string FROM codes WHERE is_bought = false AND account_type = $2 FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING code_string`,
      [wa_id, role]
    );

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ error: "Failed to process code" });
    }

    const code = updateResult.rows[0].code_string;
    res.json({ code });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
})
app.post('/code-gen', async (req, res) => {
  try {
    const { users, creators } = req.body

    if (!users || !creators) {
      return res.status(400).send('Invalid Credentials')
    }
    if (req.headers['x-admin-key'] !== process.env.GENERATOR_PASS) {
      return res.status(400).send('Invalid Password')
    }
    await generateBaches({ users, creators });
    res.status(200).send(`created ${users} amount of users and ${creators} amount of creators`)
  }
  catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
})

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on PORT ${process.env.PORT}`)
})
