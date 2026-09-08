# langgraph-bot-1

Chatbot #1 from the progression: plain conversational agent, one node, persisted memory via a checkpointer. No tools yet.

## Setup

```bash
npm install
cp .env.example .env   # add your GROQ_API_KEY
npm run dev
```

## What to poke at

- Change `thread_id` in `main()` mid-session (hardcode a second value and swap) and notice the bot "forgets" — that's the checkpointer keying on thread_id, not on the process.
- Log `state.messages.length` inside `callModel` to see the history actually growing.
- Try removing the checkpointer from `.compile()` entirely and see what breaks (nothing breaks per-call, but memory across `app.invoke` calls disappears — proves the checkpointer, not the graph, is what makes memory work).
- Once this feels boring, that's the signal to move to chatbot #2 (tool-calling with `ToolNode` + `tools_condition`).
