# Lux chatbot API

Serverless chat backend for **Lux**, the Monarch Mental Health website assistant. The Framer widget (`AskLux`) posts questions here; this API returns a short reply plus optional follow-up chips.

**Live endpoint:** `https://monarch-d9py.vercel.app/api/chat`

This is **not** the PHI referral app. Lux is public-site navigation and program info only — no clinical advice, no PHI storage.

## Layout

```
apps/lux-chatbot/
├── api/chat.js      # Vercel serverless handler + ABOUT_ME knowledge base
├── vercel.json      # CORS headers for /api/*
└── README.md
```

Related sources elsewhere in the monorepo:

| Piece | Path |
|---|---|
| Framer component (repo mirror) | `Code/Framer/lux_chatbot.tsx` |
| Framer code file in project | `Lux_Chat_1.tsx` (`ov0_xWB`) |
| Knowledge-base mirror (sync with `api/chat.js`) | `docs/LUX_CHATBOT.md` |

## How it works

1. Visitor opens Ask Lux on the marketing site (Framer).
2. Widget `POST`s to `backendUrl` with the question and recent history.
3. `api/chat.js` builds a system prompt from `ABOUT_ME` (Parts 1–4), calls OpenRouter (`google/gemini-3.1-flash-lite` by default), and parses a JSON payload.
4. Response shape: `{ reply, followUps, limited? }`.
5. Widget shows `reply` and replaces suggestion chips with `followUps` (0–3).

```
Framer AskLux  --POST /api/chat-->  Vercel (this app)  -->  OpenRouter
                 <-- { reply, followUps }
```

## API

### `POST /api/chat`

**Request body**

```json
{
  "question": "How do I get started?",
  "name": "Lux",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Success**

```json
{
  "reply": "Visitor-facing answer in plain prose.",
  "followUps": ["What's the difference between Level 1 and Level 2?"],
  "limited": false
}
```

| Field | Meaning |
|---|---|
| `reply` | Text shown in the chat bubble |
| `followUps` | Clickable chips — questions the **visitor** might ask next about Monarch |
| `limited` | `true` when upstream rate-limits; widget should stop further sends |

**Other methods**

- `OPTIONS` — CORS preflight
- Non-`POST` — returns a short message + empty `followUps` (still HTTP 200 so the widget can show it)

Errors are returned as friendly `reply` strings (HTTP 200) so the Framer UI always has something to display.

## Environment

Set in the Vercel project for this app:

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Upstream LLM auth |
| `OPENROUTER_MODEL` | No | Model id override (default: `google/gemini-3.1-flash-lite`, paid, needs OpenRouter credits). Set to `openrouter/free` to use free models. |

### Rate limits

Free models (`openrouter/free`) have low shared rate limits; the paid default does not. When OpenRouter returns 429, Lux retries once, then asks the visitor to wait a minute (without locking the chat session).

**Crisis / self-harm messages are answered locally** with 988 / Colorado Crisis resources and never call the LLM, so those replies still work when the free tier is exhausted.

The Framer widget also caps at **10 questions per open session** (`MAX_QUESTIONS_PER_SESSION`) — that is separate from OpenRouter limits.

No other secrets are required for the chat handler.

## Deploy

From this directory:

```bash
cd apps/lux-chatbot
vercel --prod
```

Or link this folder as its own Vercel project root (root directory = `apps/lux-chatbot`, or deploy this folder alone). Production URL used by Framer should remain:

`https://monarch-d9py.vercel.app/api/chat`

After changing `api/chat.js`, redeploy before testing on the live site. Framer only needs a republish when the **widget** code changes, not when the API alone changes.

## Framer wiring

On each Ask Lux instance:

1. **Backend URL** = `https://monarch-d9py.vercel.app/api/chat`
2. **Assistant Name** = `Lux`
3. **Trigger Text** = `Ask Lux` (or empty for icon-only)

Repo defaults live in `Code/Framer/lux_chatbot.tsx` property controls. Sync that file into Framer (`Lux_Chat_1.tsx`) when the UI changes.

## Training / knowledge updates

Lux’s facts and behavior live in `ABOUT_ME` inside `api/chat.js`:

1. **Part 1** — identity, boundaries, crisis, writing examples  
2. **Part 2** — Monarch programs, funding, admissions/referral paths  
3. **Part 3** — website page map / links  
4. **Part 4** — visitor types (pros, self, family)

Workflow used in practice:

1. Test on the live site (or Preview).
2. Capture Q → reply → notes.
3. Patch `ABOUT_ME` and/or system prompt rules in `api/chat.js`.
4. Copy the same file to `docs/LUX_CHATBOT.md` so docs stay in sync.
5. Redeploy Vercel.
6. Retest.

Hard rules worth remembering when editing:

- No diagnoses, meds, or clinical advice.
- Plain prose in `reply` (no markdown).
- Browse/learn ≠ lead with “call admissions”; hand off when they want next steps.
- `followUps` are about Monarch, never intake/PHI questions about the visitor.
- Medicaid is baseline for both levels; assessment decides Level 1 vs 2.

## Privacy

- Chat is not a clinical record.
- Do not design this endpoint to collect or store PHI.
- Sensitive details belong with admissions by phone or the referral portal — not Lux.

## Quick smoke test

```bash
curl -s https://monarch-d9py.vercel.app/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"question":"What is Monarch?","name":"Lux","history":[]}'
```

Expect JSON with a short `reply` and optional `followUps`.
