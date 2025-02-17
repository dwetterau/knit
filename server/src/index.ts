import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { computeFragmentsAsync } from "./ai.js";

// Load environment variables from .env.local file
dotenv.config({ path: "../.env.local" });

const app = express();

const port = process.env.PORT;
const convexURL = process.env.CONVEX_URL;

if (!port || !convexURL) {
  console.log(port, convexURL, process.env);
  throw new Error("Please define PORT and CONVEX_URL in .env file");
}

const client = new ConvexHttpClient(convexURL);

app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

app.post("/api/personPrompt", async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "No content provided" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at analyzing and curating human relationships.",
          },
          {
            role: "user",
            content: `Tell me useful attributes and facts about the person (or people) mentioned in this content: ${content}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    response.data.on("data", (chunk: Buffer) => {
      // Convert chunk to string and process the response
      const decodedLines = chunk.toString("utf8").split("\n");
      for (let line of decodedLines) {
        if (line.startsWith("data:")) {
          line = line.substring(5);
        }
        line = line.trim();
        if (!line || line == "[DONE]") {
          continue;
        }
        const message = JSON.parse(line);
        if (message.choices && message.choices.length > 0) {
          const text = message.choices[0].delta?.content;
          if (text) {
            res.write(`data: ${JSON.stringify({ newText: text })}\n\n`);
          }
        }
      }
    });

    response.data.on("end", () => {
      console.log("Stream ended.");
      res.end();
    });

    response.data.on("error", (error: Error) => {
      console.error("Error with stream:", error);
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: "Error with OpenAI API" });
  }
});

app.post("/api/fileMessage", async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "No content provided" });
    return;
  }

  (await computeFragmentsAsync(content)).match(
    (fragments) => {
      res.json({ success: true, fragments });
    },
    (message) => {
      res.status(500).json({ error: message });
    }
  );
});

app.get("/api/convexTest", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ") ||
      authHeader.split(" ").length !== 2
    ) {
      res.status(401).json({ error: "Unauthorized: Missing Bearer Token" });
      return;
    }
    const token = authHeader.split(" ")[1];
    client.setAuth(token);

    const user = await client.query(api.users.viewer);
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error with convex request", err);
    res.status(500).json({ error: "Error making convex request" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
