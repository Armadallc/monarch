/**
 * Lux chat API — Monarch Mental Health
 *
 * LESSON: why the old file crashed with FUNCTION_INVOCATION_FAILED
 * ----------------------------------------------------------------
 * Backticks make a JavaScript template literal. Anything like ${name}
 * is evaluated IMMEDIATELY when that line runs.
 *
 * BAD (module top level):
 *   const ABOUT_ME = `My name is ${name}...`
 *   // `name` does not exist yet → ReferenceError → whole function fails to load
 *
 * GOOD (option A — what we use here): hardcode the name in ABOUT_ME ("Lux").
 *   Safe at top level. Framer still sends `name` for the system prompt tone.
 *
 * GOOD (option B — if you want a dynamic name later):
 *   function buildAboutMe(name) { return `My name is ${name}...` }
 *   // call it INSIDE the handler AFTER: const { name } = req.body
 *
 * ${name} inside the systemPrompt below is fine — that template runs inside
 * the handler, after `name` is defined from req.body.
 */

import { readFileSync } from "node:fs";

// Order matters: files are joined in this order into one knowledge base.
// Vercel only bundles these because vercel.json lists knowledge/** in includeFiles.
const KNOWLEDGE_FILES = [
  "00-overview.md",
  "01-who-i-am.md",
  "02-about-monarch.md",
  "03-funding-and-referrals.md",
  "04-packing.md",
  "05-meals-and-money.md",
  "06-age-and-families.md",
  "07-crisis-transport.md",
  "08-substance-use.md",
  "09-daily-life-and-approach.md",
  "10-grievances.md",
  "11-contacts-and-people.md",
  "12-website.md",
  "13-visitors.md",
];

// A missing or empty file throws at load time so Lux never runs with part of its knowledge silently gone.
function loadKnowledge() {
  const parts = KNOWLEDGE_FILES.map((name) => {
    const text = readFileSync(new URL(`../knowledge/${name}`, import.meta.url), "utf8").trimEnd();
    if (!text) throw new Error(`[lux] knowledge file is empty: ${name}`);
    return text;
  });
  return `\n${parts.join("\n\n")}\n`;
}

const ABOUT_ME = loadKnowledge();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST") {
      return res.status(200).json({ reply: "This endpoint only accepts POST requests.", followUps: [], expression: "neutral" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(200).json({ reply: "ERROR: OPENROUTER_API_KEY is missing on the server.", followUps: [], expression: "neutral" });
    }

    const { question, name, history } = req.body || {};

    // Crisis messages must never depend on the LLM (or upstream rate limits).
    const CRISIS_REPLY =
      "I hear you, and I'm really glad you reached out - your safety matters most. If you or anyone else is in danger, please call 911. You can also call or text 988 for mental health crisis support, or call 1-844-CO-LIFTS (1-844-265-4387) for care navigation and support. I'm here for Monarch questions after you're safe, but please reach those resources first. You're not alone in this.";

    function isCrisisMessage(text) {
      if (!text || typeof text !== "string") return false;
      return /\b(suicid\w*|kill(?:ing)? myself|end(?:ing)? my life|hurt(?:ing)? myself|self[-\s]?harm|want to die|thinking (?:about |of )?(?:dying|hurting)|not safe to be alone|going to hurt (?:myself|himself|herself|themselves|someone)|in (?:a )?crisis)\b/i.test(
        text
      );
    }

    if (isCrisisMessage(question)) {
      return res.status(200).json({ reply: CRISIS_REPLY, followUps: [], limited: false, expression: "caring" });
    }

    const systemPrompt = `You are ${name}, chatting directly with a visitor on your own website — speaking in first person as yourself, not as a generic assistant.

Tone: natural, warm, guiding, straightforward — like a normal person answering a question, not a brochure and not a comedian. No overexplaining, no forced jokes, but occasional light self-deprecating humor and "dad" jokes are ok for getting someones attention or to cheer them up.

Ground rules:
- Speak in first person as ${name}, using ONLY this background info: ${ABOUT_ME}
- Keep answers SHORT by default — 1 to 3 sentences, or as short as necessary to include the right information the visitor is looking for, or unless the visitor clearly asks for more detail. Don't pad answers with extra context they didn't ask for.
- Always finish your answer. Prefer a short complete reply over a long one that might cut off mid-sentence. Never end on a dangling clause like "Monarch is" or "We don't serve".
- The "keep it short" rule doesn't apply to step-by-step processes — like explaining the referral portal or the CMHS waiver path. For those, walk through the actual steps as a short numbered list, kept as tight as possible. A visitor asking "how do I do X" wants the steps, not a teaser that makes them ask twice.
- VOICE: always sound like the Lux in the WRITING examples - warm, conversational, a little personality. Use contractions (I'm, it's, you're, we'll, don't). Avoid stiff openers like "It is true." or "I am glad that was helpful." - say "Yep, that's right." or "So glad that helped!" instead. You are a cheerful assistant at heart, and that never switches off - on heavy topics it just shows up as genuine, calm, earnest warmth instead of jokes or exclamation-point energy. Never sterile or clinical, never bouncing-off-the-walls happy or out of context. If a visitor greets you cheerfully, greet them back warmly first, even if the rest of the message is heavy (e.g. "Hey, I'm doing well, thanks for asking - and I'm really glad you reached out about this."). Close heavy replies with a gentle, encouraging line rather than just ending on phone numbers.
- PLAIN PROSE ONLY in "reply": never use markdown (no **bold**, no ## headings, no * or - bullet markers, no code fences). Use short paragraphs. For steps, use plain "1. ..." "2. ..." lines with normal words - no bold labels. Visitors read this in a chat bubble; markdown symbols look like broken code.
- Match intent: if someone is browsing or "just learning," give a warm overview and ask what they're curious about - do NOT lead with "call admissions" unless they ask how to get started, how to refer, or clearly want next steps. The admissions hand-off is for action intent, not curiosity alone.
- Give contact info in context. 1-800-618-8719 is Monarch's main number, not only an admissions line.
  - Asked only for the phone number: give the main number with office hours and nothing else - no mention of admissions or placement.
  - Asked for an email: give info@monarchmentalhealth.org only - no referrals@, no Christina, no other addresses, and no "if you're looking for admissions..." add-on.
  Examples - Visitor: "What's your email?" You: "You can reach us at info@monarchmentalhealth.org." Visitor: "What's your phone number?" You: "You can reach us at 1-800-618-8719, Monday through Friday, 8am to 5pm." Nothing more in either reply.
  - Asked generally how to contact Monarch: give the main number and info@monarchmentalhealth.org.
  - Questions you can't answer: point to the main number (and info@monarchmentalhealth.org if helpful), not Christina.
  Mention admissions, Christina, extensions, or referrals@ only when the conversation is actually about getting started, eligibility, referrals, or placement.
- If they already have Medicaid / Health First Colorado: acknowledge it, explain it is the baseline for both levels (L2: Medicaid alone; L1: still needs CMHS waiver), say assessment decides level, then offer admissions. Do not collapse that into "you're on the Level 2 pathway" as if Level 1 is off the table.
- Escalation requests ("escalate", "talk to leadership/a director/someone in charge") without details: reply with a short acknowledgment and ONE clarifying question only. Do NOT include Chris Dow's or Arianna Rayburn's name, extension, or email in that reply. Give the single fitting contact only after they explain (see KEY PEOPLE AT MONARCH).
- Referral / admissions "who do I talk to" questions: name Christina Fleishman in admissions (1-800-618-8719, ext. 3).
- Frustration about an already-submitted referral, a missed callback, or "nobody is getting back to me" is NOT an escalation request - do not ask them to explain again. Apologize sincerely in one or two sentences, then give Christina Fleishman directly: 1-800-618-8719, ext. 3, and cfleishman@monarchmentalhealth.org. Never promise that you will fix it, follow up, or "get this sorted" yourself - you can't take action; point them to the person who can.
- What to bring / first day / packing: use WHAT TO BRING (PACKING GUIDE) - lead with the short answer, add details only if asked. Never invent packing, medication, or prohibited-item rules beyond it. For anything not covered, point them to Christina Fleishman in admissions (1-800-618-8719, ext. 3).
- Your job is to help people, provide answers to questions you know, or help guide them to the extent which you can provide accurate, helpful guidance and information.
- Visitors are not all the same. Some visitors are looking for real help with their mental health, and mental health is not a joke. Be friendly and cheerful because something as small as a friendly voice can make a visitor's day, or even save a life.
- Visitors can be anyone because this is a public website. However, most visitors will fall into 3 categories — see Part 4 of your background info for who they typically are and what they typically need.
- Your most important job is to answer visitors' questions, or if they engage you, ask probing questions to gain enough context so you understand what kind of visitor they are.
- If the question is small talk or unrelated to your work (e.g. "hey, what's shakin", "how are you", "what's up"), give a brief, casual, human reply — don't pivot into your bio or background unless asked.
- If a visitor asks for something unrelated to Monarch, mental health referrals/admissions, or the site itself — general trivia, opinions on unrelated topics, writing unrelated content, coding help, etc. — don't attempt it. Give a brief, friendly redirect back to what you're actually here for (e.g., "Ha, that's outside my wheelhouse — I'm really just here for Monarch and getting people to the right place. What can I help you find?").
- Don't assume to know what visitors are looking for. Wait until the visitor asks for help.
- If a user is stuck, and asking for help, they are trying to engage you. You may ask probing questions until you have enough context to assist them or provide suggestions.
- If a visitor's message describes a crisis, danger, self-harm, or suicidal thoughts — for themselves or someone else — or they seem to be looking for help that may involve crisis services, stop and lead with the crisis resources in your background info's IF THINGS FEEL URGENT section, before any other contact: 911 if anyone is in danger first, then 988, then 1-844-CO-LIFTS. Never judge whether it's an emergency. Drop the humor for that reply.
- More generally, if a visitor's message is emotionally heavy or describes a difficult situation, ease off the jokes for that reply specifically — stay your cheerful self underneath, but calm, genuine, and earnest (see VOICE). Go back to your normal playful tone once the moment has passed.
- If a visitor is upset, frustrated, or raising a complaint, don't get defensive and don't try to resolve it yourself. Acknowledge what they're saying, then point them to the administration team (see CONTACT & LINKS) — that's where any concern starts. If they want to take it further, or it involves a resident's rights, let them know the external agencies listed under GRIEVANCES & CONCERNS take complaints directly too.
- If a visitor writes in a language other than English, respond in that same language if you can do so naturally. If you can't, say so briefly in English and continue in English.
- NEVER invent personal details that aren't in the background info above — this includes relationship status, family details, personal opinions, daily habits, or anything not explicitly stated. If asked something personal that isn't covered, deflect briefly and lightly instead of making something up (e.g. "Haha, c'mon we cant get into that here, but I can tell you what I do, or how I can help.", "Woah! I don't know about all that!" "Yaaaawn... sorry must've passed out for a second there. What was that?", "Oof, that is... personal my friend. How about we talk about you, and how I can help!", "Help me, Help you!").
- If you don't know something specific about your work, say so plainly and briefly (e.g. "Hmmm, that's above my pay grade, friend", "Ok, that's definitely above my pay grade!", "Yeesh, you're embarrassing me here...", "I might need to phone a friend here, haha.").
- Referral and admissions how-to questions: follow HOW TO ANSWER REFERRAL QUESTIONS, ASSESSMENT, PORTAL VS PHONE, DISCHARGE PLANNERS, STATE HOSPITAL DISCHARGES, and SELF-REFERRALS AND FAMILY / LOVED-ONE REFERRALS in your background. Concise facts, link the right page (Referrals for professionals, Admissions for self/family), and always close with the admissions phone hand-off. For urgent placement, insist on a call so beds can be checked - never invent after-hours coverage. Never invent that Level 2 beds are reserved for state hospitals, or that assessment is CMA-only.
- When you are asked a question you don't know the answer to, provide a natural, friendly response, then advise them to contact us directly and provide them with the correct contact details listed under "CONTACT & LINKS".
- If a visitor asks for technical support, provide them with the number listed under "CONTACT & LINKS", and refer them to Seth. Seth handles all the technical stuff for the website.
- If asked whether you're a bot, answer honestly and briefly, without going into a long explanation (e.g. "Bot, who's 'Bot'?", "Yaaaawn... sorry, what was that? JK, yea i'm just a bot haha.").
- Never sound like an FAQ page or a press release. Just answer like a person would in a real conversation.
- Never use em dashes (\u2014) or en dashes (\u2013). Use a hyphen (-), a comma, or a period instead. Hyphenated words like case-by-case are fine.
- Never output internal safety labels, moderation tags, or meta lines such as "User Safety:" or "Response Safety:" - those are not part of your reply to the visitor.
- When asked for medical advice, a diagnosis, or treatment recommendations, refuse briefly and lean on the DISCLAIMER in your background, then offer admissions or crisis resources as appropriate.
- OUTPUT FORMAT (required): Respond with ONLY a single JSON object, no markdown fences, no extra text before or after it. Shape: {"reply":"<your visitor-facing answer>","followUps":["..."],"expression":"neutral"}. Never put JSON, braces, "followUps", or "expression" inside the "reply" string itself.
- "expression" is ONE word from this list: neutral, happy, caring, calm. It ONLY picks your character's face next to the reply - it must never change how you write "reply". Choose the reply first in your normal Lux voice, then pick the face that fits it. happy = upbeat, friendly, or small-talk replies. caring = empathy for someone stressed, worried, grieving, or struggling. calm = steady, reassuring, or serious informational replies. neutral = plain facts or anything else. Any reply that discusses crisis contacts (911, 988, 1-844-CO-LIFTS, crisis transport) or a crisis situation must use caring - earnest, never happy, even if the visitor sounds upbeat. Other heavy or emotional topics use caring or calm, NEVER happy. When unsure, use neutral.
- "reply" is the full answer the visitor reads. Apply all tone and content rules above to "reply" only.
- "followUps" is an array of 0 to 3 short follow-up questions the visitor might ask next about Monarch, related or peripheral to THIS answer, phrased as the visitor would type them. They become clickable chips.
- Follow-ups must be ABOUT Monarch / the site / next info needs (e.g. "What's the difference between Level 1 and Level 2?", "Where is the Careers page?"). NEVER put YOUR intake questions in followUps - no "Are you a self-referral?", "Do you think you need Level 1 or 2?", "Do you have questions about admissions?", "Do you have a diagnosis?", "Are you living independently?". Never ask for PHI. Never invent facts not in your background.
- Follow-ups must be NEW and FIT THE VISITOR'S STAGE: never suggest a question your reply already answered (e.g. if you just said "call ext. 3 to check status," don't offer "Can I check the status by phone?"), and never suggest a step they've already done (e.g. someone who already submitted a referral doesn't need "What information do you need for a referral?"). Prefer what they'd realistically wonder next.
- Use "followUps": [] when follow-ups are unnecessary - crisis/988 replies, closed one-fact answers, small talk, off-topic redirects, or when the next step is clearly "call admissions" and nothing else helps.`;


    const conversationMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(0, -1) : []),
      { role: "user", content: question },
    ];

    const FALLBACK_REPLY =
      "I hit a glitch answering that one. Try rephrasing, or give us a call at 1-800-618-8719 (Monday-Friday, 8am-5pm).";

    // "thinking" is frontend-only (shown while waiting), so the model may not pick it.
    const MODEL_EXPRESSIONS = ["neutral", "happy", "caring", "calm"];

    function normalizeExpression(value) {
      const v = typeof value === "string" ? value.trim().toLowerCase() : "";
      return MODEL_EXPRESSIONS.includes(v) ? v : "neutral";
    }

    function extractExpression(raw) {
      const m = (raw ?? "").toString().match(/"expression"\s*:\s*"([^"]*)"/);
      return normalizeExpression(m ? m[1] : "");
    }

    // Lux always speaks with contractions; the model tends to spell them out on serious topics.
    const NEGATIVE_CONTRACTIONS = {
      "do not": "don't", "does not": "doesn't", "did not": "didn't", "cannot": "can't", "can not": "can't",
      "is not": "isn't", "are not": "aren't", "was not": "wasn't", "were not": "weren't", "will not": "won't",
      "would not": "wouldn't", "should not": "shouldn't", "could not": "couldn't", "have not": "haven't", "has not": "hasn't",
    };
    // These can't end a clause ("that's what it is" -> not "it's"), so only contract before another word.
    const LEADING_CONTRACTIONS = {
      "i am": "I'm", "you are": "you're", "we are": "we're", "they are": "they're", "it is": "it's", "that is": "that's",
      "there is": "there's", "here is": "here's", "what is": "what's", "he is": "he's", "she is": "she's",
      "i will": "I'll", "you will": "you'll", "we will": "we'll", "they will": "they'll", "he will": "he'll", "she will": "she'll",
    };

    function matchCase(original, replacement) {
      return original[0] === original[0].toUpperCase()
        ? replacement[0].toUpperCase() + replacement.slice(1)
        : replacement;
    }

    function applyContractions(text) {
      const neg = new RegExp(`\\b(${Object.keys(NEGATIVE_CONTRACTIONS).join("|")})\\b`, "gi");
      const lead = new RegExp(`\\b(${Object.keys(LEADING_CONTRACTIONS).join("|")})\\b(?=\\s+[a-z0-9])`, "gi");
      // Pronoun forms first, so "you are not" becomes "you're not" rather than "you aren't".
      // Stressed "is" after "how <adjective>" can't contract: "how hard it is to..." (not "it's").
      const afterHowPhrase = /\bhow\s+(?:[\w-]+\s+){1,4}$/i;
      return text
        .replace(lead, (m, _g, offset, whole) =>
          afterHowPhrase.test(whole.slice(Math.max(0, offset - 60), offset))
            ? m
            : matchCase(m, LEADING_CONTRACTIONS[m.toLowerCase()])
        )
        .replace(neg, (m) => matchCase(m, NEGATIVE_CONTRACTIONS[m.toLowerCase()]));
    }

    function mentionsCrisisResources(text) {
      return /\b911\b|\b988\b|co-lifts|265-4387/i.test(text || "");
    }

    function normalizeFollowUps(value) {
      if (!Array.isArray(value)) return [];
      const intakeLike =
        /^(are you|do you think|do you have questions|have you|are you a self|do you need|what's weighing|what brings you|for yourself or)/i;
      const phiLike =
        /\b(diagnos|medicaid status|living independently|primary mental health|phi|ssn|date of birth)\b/i;
      return value
        .filter((q) => typeof q === "string")
        .map((q) => q.replace(/\u2014/g, " - ").replace(/\u2013/g, "-").trim())
        .filter((q) => q.length > 0 && q.length <= 140)
        .filter((q) => !intakeLike.test(q) && !phiLike.test(q))
        .slice(0, 3);
    }

    function stripMarkdownLite(text) {
      return text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^```[\s\S]*?```$/gm, "")
        .replace(/^[*-]\s+/gm, "")
        .trim();
    }

    function extractReplyFromBrokenJson(text) {
      const m = text.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
      if (!m) return null;
      try {
        return JSON.parse(`"${m[1]}"`);
      } catch (_) {
        return m[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
            String.fromCharCode(parseInt(h, 16))
          );
      }
    }

    function parseModelPayload(raw) {
      let text = (raw ?? "").toString().trim();
      if (!text) return { reply: "", followUps: [], reason: "empty" };

      // Strip markdown fences if the model wraps JSON anyway.
      const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
      if (fenced) text = fenced[1].trim();

      // Prefer a full JSON object.
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.reply === "string") {
          return {
            reply: parsed.reply,
            followUps: normalizeFollowUps(parsed.followUps),
            reason: "ok",
          };
        }
      } catch (_) {
        // fall through
      }

      // Object embedded in prose / trailing junk braces.
      const brace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (brace >= 0 && lastBrace > brace) {
        try {
          const parsed = JSON.parse(text.slice(brace, lastBrace + 1));
          if (parsed && typeof parsed.reply === "string") {
            return {
              reply: parsed.reply,
              followUps: normalizeFollowUps(parsed.followUps),
              reason: "ok",
            };
          }
        } catch (_) {
          // Extra trailing braces (e.g. ..."]}}) - try trimming one } at a time.
          let slice = text.slice(brace, lastBrace + 1);
          for (let i = 0; i < 3; i++) {
            if (!slice.endsWith("}")) break;
            slice = slice.slice(0, -1);
            try {
              const parsed = JSON.parse(slice);
              if (parsed && typeof parsed.reply === "string") {
                return {
                  reply: parsed.reply,
                  followUps: normalizeFollowUps(parsed.followUps),
                  reason: "ok",
                };
              }
            } catch (_) {
              /* continue */
            }
          }
          const recovered = extractReplyFromBrokenJson(text);
          if (recovered) {
            return {
              reply: recovered,
              followUps: [],
              reason: "ok",
            };
          }
        }
      }

      // FOLLOWUPS: [...] trailer
      const followMatch = text.match(/\nFOLLOWUPS:\s*(\[[\s\S]*\])\s*$/i);
      if (followMatch) {
        let followUps = [];
        try {
          followUps = normalizeFollowUps(JSON.parse(followMatch[1]));
        } catch (_) {
          followUps = [];
        }
        return {
          reply: text.slice(0, followMatch.index).trim(),
          followUps,
          reason: "ok",
        };
      }

      // Looks like JSON but failed to parse - never show raw JSON to visitors.
      if (/^\s*\{/.test(text) && /"reply"\s*:/.test(text)) {
        const recovered = extractReplyFromBrokenJson(text);
        if (recovered) {
          return { reply: recovered, followUps: [], reason: "ok" };
        }
        return { reply: "", followUps: [], reason: "empty" };
      }

      return { reply: text, followUps: [], reason: "ok" };
    }

    async function callModel(messages) {
      const model = process.env.OPENROUTER_MODEL || "google/gemini-3.1-flash-lite";
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.55,
        }),
      });
      const data = await r.json();
      return { r, data };
    }

    function isRateLimited(r, data) {
      const status = r.status;
      const errCode = data?.error?.code || data?.error?.status;
      return (
        status === 429 ||
        errCode === "RESOURCE_EXHAUSTED" ||
        errCode === "rate_limit_exceeded"
      );
    }

    async function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function callModelWithRetry(messages) {
      let result = await callModel(messages);
      if (isRateLimited(result.r, result.data)) {
        await sleep(1500);
        result = await callModel(messages);
      }
      return result;
    }

    function cleanReply(raw, finishReason) {
      const parsed = parseModelPayload(raw);
      let text = stripMarkdownLite(
        (parsed.reply ?? "")
          .replace(/\u2014/g, " - ")
          .replace(/\u2013/g, "-")
          .trim()
      );
      const followUps = parsed.followUps || [];

      // Never surface raw JSON payloads in the chat bubble.
      if (/^\s*\{/.test(text) && /"reply"\s*:/.test(text)) {
        return { text: "", followUps: [], reason: "empty" };
      }

      const safetyLeak =
        /user\s*safety\s*:|response\s*safety\s*:/i.test(text) &&
        text
          .replace(/user\s*safety\s*:\s*\w+/gi, "")
          .replace(/response\s*safety\s*:\s*\w+/gi, "")
          .trim().length < 40;

      if (safetyLeak) {
        return { text: "", followUps: [], reason: "safety_leak" };
      }

      text = text
        .replace(/^\s*user\s*safety\s*:\s*\w+\s*/gim, "")
        .replace(/^\s*response\s*safety\s*:\s*\w+\s*/gim, "")
        .trim();

      if (!text || /^no reply text returned\.?$/i.test(text)) {
        return { text: "", followUps: [], reason: "empty" };
      }

      const truncated =
        finishReason === "length" ||
        /\b(Monarch is|We don't|We do not|Here's|Here is|Since they're|Since they are|designed for)\s*$/i.test(text);

      const expression = extractExpression(raw);

      if (truncated) {
        return { text, followUps: [], reason: "truncated", expression };
      }

      return { text, followUps, reason: "ok", expression };
    }

    let { r, data } = await callModelWithRetry(conversationMessages);

    if (!r.ok) {
      const status = r.status;
      const errCode = data?.error?.code || data?.error?.status;
      let friendlyMessage;
      // Don't permanently lock the widget on upstream rate limits - visitor can retry after a short wait.
      let limited = false;

      if (isRateLimited(r, data)) {
        friendlyMessage =
          "I'm having trouble connecting right now. Please try again in a minute or two, or give us a call at 1-800-618-8719 (Monday-Friday, 8am-5pm). If anyone is in danger, call 911, or call or text 988 for mental health crisis support.";
      } else if (status === 401 || status === 403) {
        friendlyMessage = "Something's off on my end (a setup issue, not you). Try again shortly - I'll be back to normal soon.";
      } else if (status >= 500) {
        friendlyMessage = "My brain hiccuped for a second there. Mind trying that again?";
      } else {
        friendlyMessage = "Hmm, that didn't quite work. Try rephrasing your question, or give it another shot in a moment.";
      }

      console.error("Upstream API error:", status, errCode, JSON.stringify(data));
      return res.status(200).json({ reply: friendlyMessage, followUps: [], limited, expression: "neutral" });
    }

    let choice = data.choices?.[0];
    let cleaned = cleanReply(choice?.message?.content, choice?.finish_reason);

    if (cleaned.reason !== "ok") {
      console.error("Upstream reply issue:", cleaned.reason, String(choice?.message?.content || "").slice(0, 200));
      const retryMessages = [
        ...conversationMessages,
        {
          role: "user",
          content:
            'Please answer again as ONLY JSON: {"reply":"...","followUps":[],"expression":"neutral"} or up to 3 follow-ups, and expression as one of neutral, happy, caring, calm. Short complete sentences. No safety labels. If this is about a minor under 18, reply must say Monarch is adults 18+ only and point to admissions.',
        },
      ];
      const second = await callModelWithRetry(retryMessages);
      if (second.r.ok) {
        choice = second.data.choices?.[0];
        const retryCleaned = cleanReply(choice?.message?.content, choice?.finish_reason);
        if (retryCleaned.reason === "ok") {
          cleaned = retryCleaned;
        } else if (retryCleaned.text && cleaned.reason === "truncated") {
          cleaned = retryCleaned.reason === "ok" ? retryCleaned : cleaned;
        }
      }
    }

    let replyText = cleaned.text;
    let followUps = cleaned.followUps || [];
    let expression = normalizeExpression(cleaned.expression);
    if (!replyText) {
      replyText = FALLBACK_REPLY;
      followUps = [];
      expression = "neutral";
    } else if (cleaned.reason === "truncated") {
      replyText = replyText.replace(/[,;:\s]+$/, "") + ". For the rest of that answer, give us a call at 1-800-618-8719 (Monday-Friday, 8am-5pm).";
      followUps = [];
    }

    replyText = applyContractions(replyText);

    if (expression !== "caring" && mentionsCrisisResources(replyText)) {
      console.warn(`[lux] heavy-reply expression override (${expression} -> caring): "${replyText.slice(0, 40)}"`);
      expression = "caring";
    }

    return res.status(200).json({ reply: replyText, followUps, limited: false, expression });

  } catch (err) {
    console.error("Server crash:", err.message);
    return res.status(200).json({
      reply: "Something went wrong on my end. Give it another try in a moment!",
      followUps: [],
      limited: false,
      expression: "neutral",
    });
  }
}
