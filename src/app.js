import express from "express";
import dotenv from 'dotenv';
import cors from 'cors'

dotenv.config();
import { generateBaches } from "./utils/code_gen.js";
import { onlineDBClient } from "./db.js";

const app = express();
app.use(express.json());
app.use(cors())

app.get('/health', (req, res) => {
  res.status.send('ts is running!');
})

app.post('/pay/verify', async (req, res) => {
  const { reference } = req.body;

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
    }
  });

  const result = await paystackRes.json();

  if (result.data.status !== "success") {
    return res.status(400).json({ error: "Payment not Verified" })
  }
  try {
    const codeResult = onlineDBClient.query('SELECT code_string FROM codes WHERE is_bought = false LIMIT 1')

    if (codeResult.rows.length === 0) {
      return res.status(500).json({ error: "no codes available" })
    }
    const code = codeResult.rows[0].code_string;

    await onlineDBClient.query('UPDATE codes SET is_bought = true, bought_at = NOW() WHERE code_string = $1', [code]);
    res.json({ code })
  }
  catch (err) {
    console.error(err)
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
    return res.status(400).send({ error: err.message });
    console.error(err);
    throw err;
  }
})
app.listen(process.env.PORT || 5000, () => {
  console.log(`ts is running on PORT ${process.env.PORT}`)
})
