# Lux chatbot API

Serverless chat backend for **Lux**, the Monarch Mental Health website assistant. The Framer widget (`AskLux`) posts questions here; this API returns a short reply plus optional follow-up chips.

**Live endpoint:** `https://monarch-d9py.vercel.app/api/chat`

This is **not** the PHI referral app. Lux is public-site navigation and program info only — no clinical advice, no PHI storage.

## Layout

```
apps/lux-chatbot/
├── api/chat.js      # Vercel serverless handler + system prompt rules
├── knowledge/       # Lux's knowledge base, one topic per file (joined in order into ABOUT_ME)
├── vercel.json      # CORS headers for /api/* + bundles knowledge/** with the function
└── README.md
```

Related sources elsewhere in the monorepo:

| Piece | Path |
|---|---|
| Framer component (repo mirror) | `Code/Framer/lux_chatbot.tsx` |
| Framer code file in project | `lux_chatbot.tsx` (`ov0_xWB`) |

## How it works

1. Visitor opens Ask Lux on the marketing site (Framer).
2. Widget `POST`s to `backendUrl` with the question and recent history.
3. `api/chat.js` builds a system prompt from `ABOUT_ME` (the `knowledge/` files, Parts 1–4), calls OpenRouter (`google/gemini-3.1-flash-lite` by default), and parses a JSON payload.
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

The Vercel project `monarch-d9py` deploys from the `Armadallc/monarch` repo with root directory `apps/lux-chatbot`. Pushing to `main` deploys it; pushes that don't touch this folder are skipped. Production URL used by Framer should remain:

`https://monarch-d9py.vercel.app/api/chat`

After changing `api/chat.js`, redeploy before testing on the live site. Framer only needs a republish when the **widget** code changes, not when the API alone changes.

## Framer wiring

On each Ask Lux instance:

1. **Backend URL** = `https://monarch-d9py.vercel.app/api/chat`
2. **Assistant Name** = `Lux`
3. **Trigger Text** = `Ask Lux` (or empty for icon-only)

Repo defaults live in `Code/Framer/lux_chatbot.tsx` property controls. Sync that file into Framer (`lux_chatbot.tsx`) when the UI changes.

## Training / knowledge updates

Lux’s facts live in `knowledge/`, one topic per file. `api/chat.js` joins them in the order listed in `KNOWLEDGE_FILES` (blank line between files) into `ABOUT_ME`:

1. **Part 1** — `01-who-i-am.md`: identity, boundaries, crisis, writing examples  
2. **Part 2** — `02` to `11`: Monarch programs, funding, referrals, packing, money, transport, contacts  
3. **Part 3** — `12-website.md`: website page map / links  
4. **Part 4** — `13-visitors.md`: visitor types (pros, self, family)

Behavior rules (voice, output format, follow-ups, expressions) stay in the system prompt inside `api/chat.js`.

Adding a file: create it in `knowledge/` and add its name to `KNOWLEDGE_FILES`. A missing or empty file makes the function fail to load on purpose, so a bad deploy is obvious rather than silently answering without that knowledge.

Workflow used in practice:

1. Test on the live site (or Preview).
2. Capture Q → reply → notes.
3. Patch the relevant `knowledge/` file and/or system prompt rules in `api/chat.js`.
4. Commit and push to `main` (Vercel deploys automatically).
5. Retest.

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
