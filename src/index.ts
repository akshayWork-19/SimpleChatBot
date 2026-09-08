import { configDotenv } from "dotenv";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ChatGroq } from "@langchain/groq";
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";

configDotenv();
// console.log(process.env.GROQ_API_KEY);

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
const app = workflow.compile({ checkpointer });

async function main() {
  const rl = readline.createInterface({ input, output });
  const config = {
    configurable: {
      thread_id: "local-dev-session",
    },
  };
  console.log("Chatbot ready. Type 'exit' to quit");
  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.trim().toLowerCase() === "exit") break;
    const result = await app.invoke(
      {
        messages: [{ role: "user", content: userInput }],
      },
      config,
    );
    // console.log(result);
    const reply = result.messages[result.messages.length - 1];
    console.log(`Bot :${reply.content}\n`);
  }
  rl.close();
}

main();
