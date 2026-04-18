# LinkedIn Content Writer Agent

> A **multi-agent AI system** that generates high-quality LinkedIn posts — either on a topic you provide or by auto-discovering trending professional topics from the web.

Built with **Python + FastAPI + LangGraph + LangChain + Pydantic v2** on the backend, and **Next.js 14 + React + TypeScript + Tailwind CSS** on the frontend.

---

## Architecture

```
User Request
     │
     ▼
FastAPI  ──►  LangGraph Pipeline
              │
              ├── [if trending mode] TrendResearcher Agent
              │     └── DuckDuckGo / Tavily web search
              │
              ├── TopicPlanner Agent
              │     └── Selects angle, tone, outline
              │
              ├── ContentDrafter Agent
              │     └── Writes initial LinkedIn post
              │
              └── Editor Agent
                    └── Polishes, validates, formats
                          └── Final Post ──► API Response
```

### Agent Pipeline

| Agent | Role |
|---|---|
| **TrendResearcher** | Searches web for trending professional topics |
| **TopicPlanner** | Selects/refines topic, defines angle and outline |
| **ContentDrafter** | Writes the initial LinkedIn post draft |
| **Editor** | Edits, polishes, validates format (length, hashtags) |

---

## Project Structure

```
content-writer-agent/
├── .github/
│   └── copilot-instructions.md   # Coding standards & conventions
├── backend/
│   ├── agents/                   # LangGraph node functions
│   │   ├── trend_researcher.py
│   │   ├── topic_planner.py
│   │   ├── content_drafter.py
│   │   ├── editor.py
│   │   └── llm_factory.py
│   ├── api/
│   │   └── routes.py             # FastAPI endpoints + WebSocket
│   ├── models/
│   │   └── schemas.py            # Pydantic v2 models
│   ├── prompts/                  # System prompts (Markdown)
│   ├── tools/
│   │   ├── web_search.py         # DuckDuckGo / Tavily wrapper
│   │   └── post_formatter.py     # LinkedIn formatting utilities
│   ├── workflows/
│   │   └── graph.py              # LangGraph StateGraph
│   ├── config.py                 # Pydantic Settings
│   ├── main.py                   # FastAPI app entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Home / landing page
│   │   └── generate/page.tsx     # Main generation UI
│   ├── components/
│   │   ├── TopicInput.tsx
│   │   ├── TrendingPicker.tsx
│   │   ├── AgentProgressStepper.tsx
│   │   ├── PostPreview.tsx
│   │   └── FeedbackPanel.tsx
│   ├── lib/
│   │   ├── api.ts                # REST API client
│   │   ├── ws.ts                 # WebSocket client
│   │   └── utils.ts
│   └── store/
│       └── generationStore.ts    # Zustand state
├── docker-compose.yml
├── railway.json
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- A free [Groq API key](https://console.groq.com) (or OpenAI API key)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
```

Frontend runs at: http://localhost:3000

### 3. Docker Compose (Full Stack)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your GROQ_API_KEY

docker-compose up --build
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate` | Generate a LinkedIn post |
| `GET` | `/api/trending` | Get trending topics |
| `GET` | `/api/status/{run_id}` | Check generation status |
| `POST` | `/api/feedback` | Submit post feedback |
| `WS` | `/api/ws/generate` | Real-time streaming generation |
| `GET` | `/health` | Health check |

### POST `/api/generate`

```json
{
  "topic": "The future of AI in software development",
  "mode": "topic"
}
```

Response:
```json
{
  "run_id": "uuid",
  "final_post": "...",
  "char_count": 987,
  "hashtags": ["#AI", "#SoftwareDevelopment"],
  "topic_plan": { ... },
  "steps_completed": ["plan_topic", "draft_content", "edit_post"]
}
```

For trending mode: `{ "mode": "trending" }` (omit topic)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | No | `groq` | `groq` or `openai` |
| `GROQ_API_KEY` | Yes* | — | Groq API key (*if using Groq) |
| `OPENAI_API_KEY` | Yes* | — | OpenAI API key (*if using OpenAI) |
| `LLM_MODEL` | No | provider default | Override model name |
| `TAVILY_API_KEY` | No | — | Falls back to DuckDuckGo if unset |
| `LANGCHAIN_TRACING_V2` | No | `false` | Enable LangSmith tracing |
| `FRONTEND_ORIGIN` | No | `http://localhost:3000` | CORS allowed origin |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## Deployment

### Backend → Railway.app (Free)

1. Connect GitHub repo to [Railway](https://railway.app)
2. Set root directory to project root (uses `railway.json`)
3. Add environment variables in Railway dashboard
4. Deploy — Railway auto-detects `backend/Dockerfile`

### Frontend → Vercel (Free)

1. Connect GitHub repo to [Vercel](https://vercel.com)
2. Set framework to **Next.js**, root to `frontend/`
3. Set env var: `NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app`
4. Deploy

### Alternative Backend Platforms

| Platform | Free Tier | Notes |
|---|---|---|
| **Railway** | $5 credit/month | Recommended, Docker support |
| **Render** | 750 hrs/month | May sleep after 15 min idle |
| **Fly.io** | 3 shared VMs | Requires `fly.toml` config |

---

## LLM Providers (Free Options)

| Provider | Model | Setup |
|---|---|---|
| **Groq** ⭐ | `llama3-8b-8192` | Free tier, fast. Get key at [console.groq.com](https://console.groq.com) |
| **OpenAI** | `gpt-4o-mini` | Paid. Most capable. |

---

## Tech Stack

**Backend**
- FastAPI + Uvicorn
- LangGraph 0.2+ (multi-agent orchestration)
- LangChain (LLM abstraction, tools)
- Pydantic v2 (data validation)
- DuckDuckGo Search / Tavily (web search)

**Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)
- Lucide React (icons)
