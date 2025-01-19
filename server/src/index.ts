import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Define a test route
app.post("/api/personPrompt", (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "No content provided" });
    return;
  }

  res.json({ message: "Hello from the server!", content });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
