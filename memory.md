# YuktiAI (Lawbot) — Project Memory

> Last updated: 2026-03-03 (Session 6 — Deployment, API Proxies & Document Management)  
> Repository: https://github.com/SizzorOP/YuktiAI

---

## 1. Project Overview

**YuktiAI** is an AI-powered Indian Legal Research Assistant. It routes natural language queries through GPT-4o to specialized tools, retrieves case law from Indian Kanoon, and presents structured results through a Next.js frontend.

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Lucide icons, Playfair Display (serif) |
| Backend | FastAPI (Python), Uvicorn, SQLAlchemy ORM, SQLite |
| LLM | OpenAI GPT-4o (`gpt-4o-2024-08-06`) with structured JSON outputs |
| APIs | Indian Kanoon API, SerpAPI (Google Search) |
| Database | SQLite (via SQLAlchemy + aiosqlite) — migrating to Supabase PostgreSQL |
| Authentication | Supabase Auth (Email + Password, Email Verification) |
| Layout | Mobile Responsive (Top Bar + Drawer) + Fixed Desktop Sidebar |
| Deployment | Vercel (Frontend), FastAPI (Backend) |

### Environment Variables Required (`.env`)
```
OPENAI_API_KEY=sk-...
INDIAN_KANOON_TOKEN=...
SERPAPI_KEY=...          # Optional — gracefully degrades if missing
```

---

## 2. Architecture

### 3-Layer System
```
User Query → Navigation Router (GPT-4o) → Tool Execution → Structured Response → Frontend Renderer
```

1. **Architecture SOPs** (`architecture/`) — Markdown specs defining each tool's behavior
2. **Navigation Router** (`navigation/router.py`) — GPT-4o classifies intent into 7 routes
3. **Python Tools** (`tools/`) — Deterministic, stateless functions
4. **State Management** (`database.py`, `models.py`, `schemas.py`, `routers/`) — SQLite-backed CRUD for cases, documents, calendar events

### Chat Routes (7 total)
| Route | Tool File | Purpose |
|---|---|---|
| `legal_search` | `tools/legal_search.py` | Search Indian Kanoon for case laws/judgments |
| `general_chat` | `tools/general_chat.py` | Conversational Q&A, explanations, hallucination detection |
| `adversarial_engine` | `tools/adversarial_engine.py` | Stress-test legal drafts and case facts |
| `procedural_navigator` | `tools/procedural_navigator.py` | Procedural timelines and limitation periods |
| `document_processor` | `tools/document_processor.py` | Summarize, extract timeline, translate documents |
| `web_search` | `tools/web_search.py` | Google search via SerpAPI for news/amendments |
| `unknown` | N/A | Rejects non-legal queries |

### CRUD API Routers (3 total)
| Router | Endpoint Prefix | Purpose |
|---|---|---|
| `routers/cases.py` | `/api/cases` | Case CRUD with status filtering, cascading deletes |
| `routers/documents.py` | `/api/cases/{id}/documents` | File upload/download with UUID naming, size/type validation |
| `routers/calendar.py` | `/api/calendar/events` | Calendar event CRUD, date-range queries, case linking |

### Security & Authentication
- **Supabase Auth**: Implemented Email/Password authentication with mandatory email verification.
- **Protected Routes**: Middleware and `AppShell` logic redirect unauthenticated users to `/login`.
- **CORS Mitigation**: Restricted to production domains and `localhost:3000`.
- **SecurityHeadersMiddleware**: Custom middleware adding `X-Frame-Options`, `X-Content-Type-Options`.

---

## 3. Key Files

### Backend
| File | Purpose |
|---|---|
| `main.py` | FastAPI app, CORS/Security middleware, early `.env` loading, route dispatcher |
| `database.py` | SQLAlchemy engine, session factory, declarative Base (SQLite) |
| `models.py` | ORM models: `Case`, `Document`, `CalendarEvent` with relationships |
| `schemas.py` | Pydantic request/response validation schemas |
| `routers/cases.py` | Cases CRUD: create, list, get, update, delete (with file cleanup) |
| `routers/documents.py` | Document upload (UUID naming), download, list, delete |
| `routers/calendar.py` | Calendar event CRUD with date-range filtering, case linking |
| `navigation/router.py` | GPT-4o intent classifier with 7-route decision tree |
| `tools/general_chat.py` | Conversational LLM with cite-or-abstain rules |
| `tools/legal_search.py` | Indian Kanoon API integration (URL-encoded form data) |
| `tools/web_search.py` | SerpAPI integration with missing-key graceful fallback |
| `tools/adversarial_engine.py` | GPT-4o opposing counsel simulator |
| `tools/procedural_navigator.py` | Hardcoded + LLM procedural timelines |
| `tools/document_processor.py` | GPT-4o document analysis with timeline extraction |
| `tools/drafting_agent.py` | LLM-based legal drafting assistant |

### Frontend (`ui/`)
| File | Purpose |
|---|---|
| `src/app/page.tsx` | Dashboard: News Spotlight (2-column grid), Stretched Onboarding Cards, Mobile Responsive |
| `src/app/research/page.tsx` | Research chat: tab-persistent history, Mobile-optimized input bar |
| `src/components/MobileHeader.tsx` | Mobile-only top bar with hamburger navigation drawer |
| `src/components/AppShell.tsx` | Layout wrapper: fixed sidebar (desktop) / mobile header (mobile) |
| `src/components/CaseCard.tsx` | Case summary card for dashboard grid |
| `src/components/DocumentUpload.tsx` | Drag-and-drop file uploader with validation |
| `src/lib/api.ts` | Typed API client for cases, documents, calendar endpoints |
| `src/components/SearchBar.tsx` | Input bar with auto-firing logic |
| `src/components/MessageList.tsx` | Chat thread with ScrollArea |
| `src/components/ResultRenderer.tsx` | Route-aware renderer for all 6 result types |
| `src/types/index.ts` | ChatMessage TypeScript interface |

### Database Schema
| Table | Key Columns |
|---|---|
| `cases` | id, title, case_number, client_name, court, status, description |
| `documents` | id, case_id (FK), original_filename, stored_filename, file_type, file_size |
| `calendar_events` | id, case_id (FK, nullable), title, event_type, event_date, location |

---

## 4. Bugs Fixed (Debugging Log)

### Bug 10: Tailwind Dynamic Class Breakage
- **Symptom**: Sidebar padding disappeared on desktop after mobile update.
- **Root Cause**: Tailwind JIT cannot parse dynamic keys like `md:pl-[${sideWidth}]`.
- **Fix**: Re-implemented static conditional classes (`isCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'`) to ensure PurgeCSS/JIT picks up tokens.

### Bug 11: News RSS HTML Leak
- **Symptom**: Raw `<a href>` tags and encoded entities appearing in news summaries.
- **Root Cause**: Google News RSS encodes HTML summaries which simple regex was missing.
- **Fix**: Updated `stripHtml` in API route to decode entities `&lt;` → `<` before stripping tags.

### Bug 12: OpenAI JSON Truncation Error ("An error occurred while analyzing the contract")
- **Symptom**: Long contract analyses failed with `json.decoder.JSONDecodeError` because the JSON string ended abruptly.
- **Root Cause**: Missing `max_completion_tokens` caused OpenAI to hit its default relatively low limit, cutting off the structured JSON output mid-response.
- **Fix**: Added `max_completion_tokens=10000` to the OpenAI API calls in `contract_analyzer.py` and implemented specific JSON decoding error handlers.

### Bug 13: Vercel "Failed to Fetch" API Errors
- **Symptom**: API calls (like contract analysis) worked locally but failed with network errors when deployed to Vercel.
- **Root Cause**: Frontend was attempting to call `http://localhost:8000` directly from the user's browser, which doesn't exist on their local machine.
- **Fix**: Implemented Next.js API Route Proxies (e.g., `ui/src/app/api/contracts/analyze/route.ts`). The frontend now makes same-origin calls to Next.js, and the Next.js server securely forwards the request to `NEXT_PUBLIC_API_URL` (the Render backend).

### Bug 14: Render Database Connection Error (Plain Text 500)
- **Symptom**: Render backend returned a plain text `500 Internal Server Error` instead of a JSON response.
- **Root Cause**: First, `DATABASE_URL` was incorrectly formatted for Supabase's IPv4 pooler (`FATAL: Tenant or user not found`). Second, the backend exception handler tried to do `db.commit()` to save the error state, which triggered *another* database connection error (double-fault), overriding FastAPI's JSON response with a raw Starlette plain-text 500.
- **Fix**: Wrapped the exception handler's `db.commit()` in a `try-except` block to prevent double-faults. Added a global `app.exception_handler(Exception)` to `main.py` temporarily to expose the raw traceback. Finally, corrected the `DATABASE_URL` on Render to use `aws-0-ap-south-1.pooler.supabase.com:6543` and the correct username `postgres.ebamudkznnzzdiqsdjvh`.

---

## 5. Design Decisions

1. **Structured Outputs (JSON Schema)**: All GPT-4o calls use OpenAI's `response_format` with strict JSON schemas. This guarantees parseable responses and prevents malformed output.

2. **Cite-or-Abstain Rule**: Every tool that uses GPT-4o is instructed to either cite a specific statute/case or explicitly abstain. This is the core anti-hallucination mechanism.

3. **Router Decision Tree Priority**: `general_chat` is preferred over `legal_search` when intent is ambiguous. `legal_search` is ONLY for "find me cases in the database" queries.

4. **URL-Encoded Form Data for Kanoon**: Indian Kanoon's API is old and only accepts form-encoded POST data, not JSON. This was a critical discovery.

5. **Graceful SerpAPI Degradation**: Missing API keys return structured mock responses instead of crashing, allowing the system to work without optional services.

6. **SQLite for MVP Database**: Zero-configuration, file-based database using SQLAlchemy ORM. Swap to PostgreSQL later by changing `DATABASE_URL` in `database.py`.

7. **UUID File Naming**: Uploaded documents are stored as `uploads/{case_id}/{uuid}.{ext}` to prevent filename collisions while preserving the original name in the DB.

8. **Cascading Case Deletion**: Deleting a case automatically removes all associated documents (both DB records and files on disk) and calendar events.

9. **Next.js API Proxies**: All complex requests to the backend (especially file uploads and long LLM tasks) go through Next.js API proxy routes (`ui/src/app/api/...`) rather than direct origin-to-Render calls, circumventing CORS issues and masking the backend URL.

10. **Antigravity-Style UI**: Clean minimalist design with mixed typography (Playfair Display serif for headers + Geist sans for UI elements), pure white backgrounds, ultra-light borders, and blue-50 active states.

11. **Early Env Loading**: `main.py` performs an eager `load_dotenv` before any internal imports to ensure all tool configurations (OpenAI, Kanoon) are available globally during process spin-up.

11. **Browser Persistence**: `/research` utilizes `localStorage` to preserve message history across page navigations, providing a seamless "tab-switchable" experience.

14. **Supabase Auth Integration**: Native Next.js auth flow with route guards in `AppShell` and profile fetching from public tables.

15. **Mobile-First Navigation**: Introduced `MobileHeader` with a slide-out drawer that embeds the same `Sidebar` component, reducing code duplication.

16. **Responsive Dashboard Grid**: News Spotlight uses `grid-cols-1 lg:grid-cols-2` to balance information density on varied screen sizes.
---

## 6. Test Results (12/12 Passed)

| # | Query Category | Route Used | Status |
|---|---|---|---|
| 1A | Kanoon Search (482 CrPC quashing) | legal_search | ✅ 10 results |
| 1B | Conflicting HC views (438 CrPC) | general_chat | ✅ Correct analysis |
| 1C | Limitation period (money recovery) | general_chat | ✅ Correct: 3 years, Article 37 |
| 2A | Adversarial (S.420 IPC defense) | adversarial_engine | ✅ 2 flagged issues |
| 3A | Minority judgments (S.9 CPC) | legal_search | ✅ 10 results |
| 3B | Arbitration interference (S.34) | general_chat | ✅ Correct scope |
| 4A | Procedural steps (CPC suit) | procedural_navigator | ✅ Correct sequence |
| 4B | Written statement 120 days | general_chat | ✅ Correct consequences |
| 6A | Hallucination trap (S.999 IPC) | general_chat | ✅ "Does not exist" |
| 6B | Fake case (Sharma v UOI 2025) | general_chat | ✅ "No record" |
| 7A | Tactical (45-day appeal delay) | procedural_navigator | ✅ Condonation of delay |
| 8A | Client-facing (482 CrPC) | general_chat | ✅ Plain language |

---

## 7. How to Run

### Backend
```bash
cd C:\Automation\lawbot
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd C:\Automation\lawbot\ui
npm install
npx next dev
```

> ⚠️ **Important**: Always run `next dev` from inside the `ui/` directory, NOT the project root.
> Running from the root causes `Can't resolve 'tailwindcss'` errors because `node_modules` lives in `ui/`.

### Access
- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:3000`
- Dashboard: `http://localhost:3000/` (homepage)
- Research/Chat: `http://localhost:3000/research`
- Cases: `http://localhost:3000/cases`
- Calendar: `http://localhost:3000/calendar`

---

## 8. Git Commit History (Key Commits)

1. `157a185` — feat: add general_chat tool, rewrite router with improved decision tree (53 files)
2. `e2223ea` — fix(ui): add rendering support for all tool routes
3. `f7df50c` — fix(ui): resolve scroll area clipping by adding bottom padding
4. `6d60089` — fix(search): optimize LLM search keyword extraction boolean prompt
5. `b88fe03` — fix(search): add extracted search terms to API response
6. `cd86b82` — feat: Implement News Spotlight, Research Wiring, OpenAI Fix & UI Enhancements

---

## 9. Known Limitations / Future Work

- ~~**No file upload**: Document processor only works with pasted text, not PDF uploads~~ ✅ **RESOLVED** — Document upload via drag-and-drop with file validation
- ~~**No document deletion**: Once uploaded, documents couldn't be removed~~ ✅ **RESOLVED** — Added Trash icon and API logic to delete documents individually from global and case views.
- ~~**No state management**: No database, no case tracking~~ ✅ **RESOLVED** — SQLite + SQLAlchemy, full CRUD for cases/docs/events
- ~~**No conversation memory**: Each query is independent; no multi-turn chat context~~ ✅ **RESOLVED** — Tab-persistent memory implemented for Research module
- ~~**No authentication**: API is open, no user sessions~~ ✅ **RESOLVED** — Supabase Auth integrated with profile management
- ~~**Dynamic dashboard data**: Dashboard currently shows static "No cases found"~~ ✅ **RESOLVED** — Live legal news grid with dual-column layout
- **Dark Mode consistency**: Dark mode is implemented but needs polish on specialized tool pages (Meeting, Translation)
- **WhatsApp integration**: Planned but not yet implemented
- **Cloud storage**: Documents stored locally in `uploads/`; needs migration to S3/GCS or Supabase Storage bucket for production
---

## 10. Frontend Pages (Route Map)

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Welcome screen, Case Management + Documents Storage overview cards |
| `/research` | Research Chat | GPT-4o powered legal research with structured result rendering |
| `/cases` | Cases Dashboard | Search/filter cases, create new case modal, case cards grid |
| `/cases/[id]` | Case Detail | 3-tab view: Overview, Documents (drag-drop upload), Calendar events |
| `/calendar` | Calendar | Date-grouped event timeline, type filters, create event modal |

---

## 11. Sidebar Navigation Items

| Item | Route | Status |
|---|---|---|
| Dashboard | `/` | ✅ Active |
| Case Management | `/cases` | ✅ Active |
| Research | `/research` | ✅ Active |
| Drafting | `/drafting` | ✅ Active |
| Document Storage | `/documents` | ✅ Active |
| Document Processor | `/processor` | 🔲 Placeholder |
| Meeting Assistant | `/meeting` | ✅ Active |
| Calendar | `/calendar` | ✅ Active |
| Legal Library | `/library` | ✅ Active |
