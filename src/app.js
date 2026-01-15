import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import { generateBaches } from "./utils/code_gen.js";

const app = express();
app.use(express.json());

app.post('/beat', (req, res) => {
  res.json('working')
})

app.post('/code-gen', async (req, res) => {
  try {
    const { users, creators } = req.body
    await generateBaches({ users, creators });
    res.status(200).json(`created ${users} amount of users and ${creators} amount of creators`)
  }
  catch (err) {
    return res.status(400).json({ error: err.message });
    console.error(err);
    throw err;
  }
})
app.listen(process.env.PORT || 5000, () => {
  console.log(`ts is running on PORT ${process.env.PORT}`)
})
