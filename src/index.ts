import { configDotenv } from "dotenv";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ChatGroq } from "@langchain/groq";
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.7,
});

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", callModel)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

const checkpointer = new MemorySaver();
const appWorkflow = workflow.compile({ checkpointer });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' folder
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// API Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, thread_id } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const sessionThreadId = thread_id || "default-session";
    const config = {
      configurable: {
        thread_id: sessionThreadId,
      },
    };

    const result = await appWorkflow.invoke(
      {
        messages: [{ role: "user", content: message }],
      },
      config
    );

    const replyMessage = result.messages[result.messages.length - 1];
    return res.json({
      reply: replyMessage.content,
      thread_id: sessionThreadId,
    });
  } catch (error: any) {
    console.error("Error invoking chatbot workflow:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ChatBot-1 Web App is running at http://localhost:${PORT}\n`);
});
