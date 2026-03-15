# Web Frontend

This is a Next.js chat frontend customized from the [Dify webapp-conversation](https://github.com/langgenius/webapp-conversation) template. It serves both the UI and server-side API proxy routes to Dify.

## Template Attribution

The base project structure, API route scaffolding, chat streaming integration, session management, and component architecture come from the Dify `webapp-conversation` template. What is documented below focuses on the **customizations and additions** made on top of that template for the PolyU EEE advising context.

## Verified Stack

| Technology | Role |
|---|---|
| Next.js 15 (App Router) | SSR, server routes, standalone build |
| React 19, TypeScript | UI rendering and type safety |
| Tailwind CSS + typography plugin | Styling |
| i18next / react-i18next | Localization |
| `react-markdown`, `remark-gfm`, `rehype-raw` | Markdown rendering of LLM responses |
| `dify-client` | Dify API client (used server-side in proxy routes only) |

## Key Customizations

### Welcome Card
A welcome card is shown on first visit, describing the chatbot's scope (programme structure, career pathways, admissions, scholarships) and including a disclaimer about verifying decisions with official announcements. Users can dismiss it and opt out of seeing it again.

### Structured Onboarding Form
Before the first message, a 5-question form collects the user's profile as Dify conversation variables:

| Field | Label | Options |
|---|---|---|
| `admission_route` | What is your academic background? | JUPAS (HKDSE)<br>Non-JUPAS<br>Higher Diploma / Associate Degree<br>International (IB / A-Level)<br>Mainland Gaokao |
| `interest_stream` | Which programme interests you most? | Electrical Engineering<br>Info & AI Engineering<br>Undecided / Comparing Both |
| `project_style` | What kind of projects excite you the most? | Hardware & Making (Building robots, circuits)<br>Software & Logic (Coding apps, algorithms)<br>Innovation & Design (Brainstorming, UX)<br>Theory & Research (Understanding how things work) |
| `career_goal` | What is your primary career goal? | Professional Engineer (HKIE Chartered Status)<br>AI & Tech Specialist (Startups, R&D)<br>Academic Researcher (PhD path)<br>Entrepreneur / Management (Business focus)<br>Not sure yet (Open to exploration) |
| `fav_subjects` | What are your strongest or favourite subjects? | *(Optional)* Free-text, e.g. "Physics, Mathematics…" |

The active UI locale is automatically mapped to a human-readable language name (e.g., `zh-HK` → `"Traditional Chinese (Cantonese)"`) and injected as a `language` variable alongside the form inputs, instructing Dify which language to respond in.

### Branched Opener Questions
- After starting a chat, the opener's suggested questions adapt based on whether the user selected a specific programme:
  - **Selected:** Programme fit, learning experience, reasons to choose this programme.
  - **Unselected:** Which programme fits, key differences, prioritization advice.
- The "Undecided" option is detected in a locale-aware way — by matching against the last element of `options` in every loaded language bundle, so detection works regardless of the active locale.

### Voice Input / Read Aloud
- **Voice input:** Users can speak queries via the STT proxy route (`/api/audio-to-text`).
- **Read aloud:** Bot responses can be read aloud via the TTS proxy route (`/api/text-to-audio`).
- **Read aloud speed:** Users can adjust the TTS playback speed, giving control over how fast responses are read back.

### Light / Dark Mode
The UI supports system-level or manually toggled light and dark themes.

### Font Size Adjustment (Accessibility)
Users can adjust the app's font size for readability. This is surfaced as an accessibility feature in the UI settings.

### Conversation Management
- **Pinning:** Stored in `localStorage` per `APP_ID`. Pinned conversations sort to the top of the sidebar.
- **Renaming:** Persisted server-side via Dify API and reflected in local state.
- **Deleting:** Requires a confirmation dialog. Switches to a new chat if the deleted conversation was active.

### Transition Animations
Smooth animations are used throughout: conversation switching uses a staged fade out → fetch → fade in sequence (`isSwitchingChat`/`isContentReady` flags) to prevent content flicker, and the sidebar slides in/out with CSS transitions on mobile.

### Locale Resolution
`i18n/client.ts` resolves locale in strict priority order:
1. `localStorage` explicit choice (`user_locale_explicit`) — only written when the user picks via the language selector UI.
2. Browser `navigator.languages` auto-detection (mapped to `en`, `zh-Hans`, `zh-Hant`, `zh-HK`).
3. App default (`en`).

The generic `locale` cookie is intentionally not used as the primary source — older template versions wrote the app default into it on startup, making explicit user choices invisible.

### Mobile Keyboard Handling
Uses `window.visualViewport` resize/scroll events to lock the root container height to the visible viewport when the soft keyboard opens on mobile, preventing layout shift.

## Session Identity (from template, verified)

- `app/api/utils/common.ts` reads `request.cookies.get('session_id')` and constructs the Dify user as `user_<APP_ID>:<sessionId>`.
- If no cookie exists, a UUIDv4 is generated. The cookie is set to `Max-Age = 10 years`.
- `disable_session_same_site` in `config/index.ts` can be set to `true` for iframe embedding (`SameSite=None; Secure`).

## API Proxy Routes

All routes in `app/api/` forward requests to Dify with the server-injected `API_KEY` (never exposed to the browser):

| Route | Purpose |
|---|---|
| `chat-messages` | Stream chat responses |
| `messages` | Fetch message history |
| `messages/[messageId]/feedbacks` | Submit thumbs up/down ratings |
| `conversations` | List all user conversations |
| `conversations/[conversationId]/variables` | Read conversation-level variables |
| `parameters` | Fetch app config (form fields, opening statement) |
| `suggested` | Fetch follow-up suggestions |
| `audio-to-text` | Proxy STT |
| `text-to-audio` | Proxy TTS |
| `file-upload` | Proxy file uploads |

## Development

```bash
cd web
yarn
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_APP_ID=
NEXT_PUBLIC_APP_KEY=
NEXT_PUBLIC_API_URL=
```

## Build Notes

- `output: 'standalone'` — produces a self-contained build suitable for server deployment.
- `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — active development trade-off. Re-enable for stricter CI gating.
