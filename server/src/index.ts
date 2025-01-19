import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

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
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
