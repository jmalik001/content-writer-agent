# GitHub Copilot Instructions — LinkedIn Content Writer Agent

## Project Overview
A multi-agent system that generates LinkedIn posts using LangGraph, LangChain, Pydantic v2, and FastAPI on the backend, with a Next.js 14 App Router frontend.

---

## Backend Standards (Python)

### Language & Runtime
- Python **3.11+** required
- Use `pyproject.toml` or `requirements.txt` for dependencies
- Use `python-dotenv` for local env management; never hard-code secrets

### Frameworks & Libraries
| Concern | Library |
|---|---|
| Web framework | FastAPI (async) |
| Data validation | Pydantic v2 (`model_config`, `field_validator`) |
| Agent orchestration | LangGraph 0.2+ (`StateGraph`, `START`, `END`) |
| LLM abstraction | LangChain (chat models, tools, prompts) |
| LLM providers | Groq (default free), OpenAI (paid alt) |
| Web search | `duckduckgo-search` (free) or Tavily |
| Tracing | LangSmith (optional, set `LANGCHAIN_TRACING_V2=true`) |

### Code Conventions
- All agent state schemas must extend `AgentState` in `backend/models/schemas.py`
- Agent node functions must have the signature: `async def node_name(state: AgentState) -> dict`  
  (return only the keys you want to update — LangGraph merges automatically)
- Name LangGraph nodes using `snake_case` verbs: `research_trends`, `plan_topic`, `draft_content`, `edit_post`
- Keep agent logic in `backend/agents/`; keep FastAPI routes in `backend/api/routes.py`
- All prompts live as `.md` files under `backend/prompts/`; load them with `Path(__file__).read_text()`
- Use `langchain_core.messages.SystemMessage` / `HumanMessage` for prompt construction
- Prefer `async def` everywhere in FastAPI and LangGraph nodes

### Environment Variables
```
LLM_PROVIDER=groq          # groq | openai
GROQ_API_KEY=...
OPENAI_API_KEY=...
TAVILY_API_KEY=...          # optional; falls back to DuckDuckGo
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=...       # optional LangSmith
FRONTEND_ORIGIN=http://localhost:3000
```

### Testing
- Tests live in `backend/tests/`
- Use `pytest` + `pytest-asyncio`
- Mock LLM calls using `langchain_core.runnables.fake.FakeStreamingListChatModel`

---

## Frontend Standards (TypeScript / Next.js)

### Framework
- **Next.js 14** with **App Router** (`app/` directory)
- **TypeScript** in strict mode (`"strict": true` in `tsconfig.json`)
- **Tailwind CSS** for styling
- **shadcn/ui** for component primitives

### State Management
- **Zustand** for global client state (post draft, agent step progress)
- React `useState`/`useReducer` for local component state
- Server Components where possible; Client Components only when using hooks or browser APIs

### API Communication
- Use native `fetch` with typed wrappers in `frontend/lib/api.ts`
- WebSocket in `frontend/lib/ws.ts` for real-time agent progress streaming
- All API base URL through `NEXT_PUBLIC_API_URL` env var

### File & Component Naming
- Pages: `app/page.tsx`, `app/generate/page.tsx`
- Components: `PascalCase` in `components/` (e.g., `TopicInput.tsx`, `PostPreview.tsx`)
- Utilities: `camelCase` in `lib/` (e.g., `api.ts`, `ws.ts`, `utils.ts`)

### Accessibility & Quality
- All interactive elements must have accessible labels
- No `any` TypeScript types without explicit `// eslint-disable` comment
- Use `clsx` / `cn` utility for conditional class names

---

## Git Conventions
- Branch naming: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Never commit `.env` files; use `.env.example` templates

---

## Architecture Decision Records
1. **LangGraph over raw LangChain chains** — enables explicit state, conditional routing, and human-in-the-loop checkpoints
2. **Groq as default LLM** — free tier, fast inference (Llama 3); switchable via `LLM_PROVIDER` env var
3. **DuckDuckGo as default search** — zero API key friction; Tavily as upgrade path
4. **WebSocket streaming** — real-time agent step visibility without polling
5. **Stateless frontend** — no auth required; post history is session-only
