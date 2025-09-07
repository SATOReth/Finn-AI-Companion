FINN — AI Meme Companion (cut-out talking head)

Animated, money-obsessed AI companion that talks, moves its jaw (South-Park-style cut-out), and replies in chat.
Front-end is vanilla HTML/CSS/JS (no build tools). Serverless Cloudflare Pages Functions provide an optional /api/chat endpoint for LLM replies. If no API key is configured, FINN falls back to local witty lines so the demo still works.

Live: << https://finn-ai-companion.pages.dev/ >>
License: MIT

✨ Features

Cut-out mouth animation (upper face + animated jaw) synced to speech boundaries.

Male “weird” voice via the browser Web Speech API (no TTS credits needed).

Greedy/degenerate personality tuned for short, punchy replies.

Zero build: just open public/index.html.

Optional AI replies: add an API key (OpenAI-compatible) to Cloudflare → real LLM responses.

Money cursor: pixel money-bag cursor for extra degen vibes.

One image in /public/companion/top.png → drop in your own face to reskin.

🗂️ Project layout
.
├─ public/                  # Static site (what gets deployed)
│  ├─ index.html            # FINN UI + animation + chat
│  ├─ companion/
│  │  └─ top.png            # The face image (upper+lower; jaw is clipped in CSS)
│  └─ cursor/
│     └─ money.png          # Custom cursor (optional)
└─ functions/
   └─ api/
      └─ chat.js            # Cloudflare Pages Function (optional LLM proxy)

🚀 Quick start (no coding)
Option A — Just open it locally

Double-click public/index.html.

Type in the chat. You’ll hear FINN speak and the jaw will animate.

Without an API key the chat uses local witty lines (fallback).

Option B — Free hosting on Cloudflare Pages

Push this repo to GitHub (Public).

In Cloudflare → Pages → Create project → Connect to Git

Build command: (leave empty)

Output directory: public

Functions: Auto-detect (functions/api/chat.js)

Deploy → your site appears at https://<project>.pages.dev.

(Optional, for real AI replies)
In Pages → Settings → Environment variables, add:

OPENAI_API_KEY – your API key (OpenAI-compatible provider).

MODEL – e.g. gpt-4o-mini (or any compatible chat model).

OPENAI_BASE_URL – only if you use a non-OpenAI endpoint.

Redeploy, and FINN will answer with real model outputs.

⚙️ Configuration & customization

All the visual behavior is in CSS variables at the top of public/index.html:

:root{
  --seam: 73.5;     /* where the mouth is cut (0–100, percent of height) */
  --jaw-open: 26px; /* how wide FINN opens the jaw */
  --jaw-rot: 3deg;  /* tiny oscillation while talking */
  --jaw-py: 74%;    /* transform origin for rotation */
}


Change face: replace public/companion/top.png with your image (similar framing).

Cursor: swap public/cursor/money.png or remove the cursor: line in CSS to use default.

Personality: search for the system prompt in index.html (You are FINN: greedy, sarcastic…) and tweak.

Fallback lines: edit the randomSnark() array in index.html.

🔒 Security notes

Never put API keys in the front-end.

Keys live only in Cloudflare Pages → Environment variables.

The function functions/api/chat.js is a thin proxy that keeps secrets server-side.

🧪 Browser support

Tested in recent Chrome/Edge.

Web Speech API voices differ per OS/browser; FINN auto-picks an English male voice and falls back gracefully.

🛠 Local development tips

No toolchain required. If you want a local server (not necessary), you can use any static server. Example with Python:

cd public
python -m http.server 8080
# visit http://localhost:8080


Note: the /api/chat function only runs after deploying to Cloudflare Pages. Locally, the UI will use the fallback messages.

❓ Troubleshooting

Blank page after deploy → Ensure Pages “Output directory” is public.

/api/chat 404 → Check the file is exactly functions/api/chat.js.

No AI reply → Add OPENAI_API_KEY (and optional MODEL) in Pages variables; redeploy.

Cursor not visible → Confirm public/cursor/money.png exists; hard refresh (Ctrl/Cmd+F5).

Mouth cut not aligned → Adjust --seam (e.g. 72 → 74).

Jaw too small/large → Tweak --jaw-open.

Voice odd/silent → Web Speech voices vary by platform; try another browser or OS.

🤝 Contributing

PRs and issues are welcome!
Ideas: better phoneme mapping, emoji reactions, emotion-based expressions, multi-language TTS, audio input (Mic → lipsync).

📄 License

MIT — do whatever you want, just keep the license notice.
See LICENSE.

🙏 Credits

Web Speech API (client-side TTS)

Cloudflare Pages + Functions (serverless deploy)

You, for the face assets and the FINN personality 😈

📬 Contact

Open an issue on GitHub for bugs/requests, or fork and push improvements. Have fun!
