# PolyU EEE Programme Advisor

**Intelligent Programme Advisor Chatbot: AI-Driven Guidance for EEE Department** is my Final-Year Project for the **Bachelor of Science (Honours) in Internet and Multimedia Technologies** at **The Hong Kong Polytechnic University**.

This repository is an end-to-end advisory system for PolyU EEE, spanning document preprocessing, Dify RAG orchestration, a Next.js chat frontend, a Capacitor mobile wrapper, and fine-tuning datasets.

**Live App: [https://polyu-eee-advisor.vercel.app/](https://polyu-eee-advisor.vercel.app/)**

## Highlights

### Problem Context

Students need fast, reliable, multilingual guidance on programme regulations and planning, but official documents are long and difficult to navigate efficiently.

### Engineering Contributions

- Built a document preprocessing pipeline that transforms PRD PDFs into structured `Parent > Child` markdown aligned with Dify's parent-child chunking strategy, using [MinerU](https://github.com/opendatalab/MinerU) as the PDF parser.
- Designed a Dify Chatflow with multi-branch intent routing, conversation-variable-aware retrieval, and multilingual response via injected language context.
- Developed a full-stack Next.js web app (based on the [Dify webapp-conversation](https://github.com/langgenius/webapp-conversation) template) with a 5-question onboarding form, voice input/TTS, light/dark mode, font size adjustment, branched opener questions, and 4-locale i18n.
- Packaged the web app as a Capacitor 6 native Android app for full-screen deployment on a Temi Robot at PolyU Info Day.
- Fine-tuned `gpt-4.1-mini` on a 100-example dataset generated from Firecrawl-sourced EEE web pages via Google Gemini 3 Pro to shape assistant persona and tone.

### Impact

This project demonstrates applied AI system design for an authentic university advising scenario — combining retrieval-grounded policy accuracy with a fine-tuned conversational persona, delivered across web and mobile surfaces.

## End-to-End Data Flow

```
━━━━━━━━━━━━━━━━━━━  TRAINING-TIME (run once)  ━━━━━━━━━━━━━━━━━━━

eee-facts/ (Firecrawl, 23 EEE official webpages)
        │
        ▼  integrate_eee_facts.py
        eee_facts.md
        │
        ▼  Google Gemini 3 Pro  +  manual revision
        fine_tune_data.jsonl (100 examples)
        │
        ▼  OpenAI fine-tuning
        gpt-4.1-mini (fine-tuned)  ─────────────────────────────────┐
                                                                    │
━━━━━━━━━━━━━━━━━━━━━  INFERENCE-TIME FLOW  ━━━━━━━━━━━━━━━━━━━━━━	│
																	│
raw PDFs (knowledge-base/raw/)										│
        │															│
        ▼  dataset_cleansing.py + MinerU 2.7.3						│
        TOC extraction, heading normalization ("Parent > Child"),	│
        HTML table conversion, H2 splitting (≤2500 chars)			│
        │															│
        ▼															│
knowledge-base/processed/            ← indexed into Dify			│
        │															│
        ▼  dify-config/*.pipeline									│
        hybrid search (0.3 kw / 0.7 vec) + Jina reranker			│
        parent-child segmentation									│
        │															│
        ▼                                                           │
Intelligent Programme Advisor Chatbot.yml (Chatflow) ◄──────────────┘
        │  multi-branch intent routing
        │  conversation variables: user profile, language
        │
        ▼  web/app/api/*
        server-side proxy  ← API key never in browser
        │
        ▼  web/app/components/
        welcome card → onboarding form → chat
        i18n: explicit preference > browser > default
        │
        ▼
mobile/  ← Capacitor 6, full-screen on Temi Robot
```

## Key Technologies

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| i18n | `i18next` / `react-i18next`, 4 locales (`en`, `zh-Hans`, `zh-Hant`, `zh-HK`) |
| Speech | STT + TTS via server-side Dify audio proxy routes |
| Retrieval | `text-embedding-3-large`, hybrid search (0.3 kw / 0.7 vec), Jina rerankers |
| Data parsing | [MinerU](https://github.com/opendatalab/MinerU) 2.7.3, custom Python normalizer |
| Fine-tuning | `gpt-4.1-mini` (OpenAI), Firecrawl + Google Gemini 3 Pro for dataset generation |
| Mobile | Capacitor 6 — Temi Robot (Android 6.0.1), requires WebView update |

## Repository Structure

| Folder | What it contains |
|---|---|
| `data-pipeline/` | MinerU 2.7.3 + normalization pipeline: 6 processing stages (TOC extraction, heading hierarchy, HTML table conversion, section splitting, diagnostics) |
| `knowledge-base/` | Source PDFs (`raw/`), MinerU parse cache (`intermediate/`), retrieval-ready markdown + stats (`processed/`) |
| `dify-config/` | 3 ingestion pipelines (per domain, distinct Jina rerankers) + 1 Chatflow YAML |
| `web/` | Next.js chat UI on the Dify webapp-conversation template. Adds 5-question onboarding form, branched opener questions, voice input/TTS with speed control, light/dark mode, font size adjustment, conversation pin/rename/delete, transition animations, and 4-locale i18n |
| `mobile/` | Capacitor 6 shell (server URL mode). Deployed on **Temi Robot** (Android 6.0.1) for PolyU Info Day — requires WebView update on device |
| `fine-tuning/` | 100-example JSONL dataset fine-tuned on `gpt-4.1-mini`. Corpus generated from 23 Firecrawl-sourced EEE pages via Google Gemini 3 Pro, manually revised |

## Local Run

### Data Pipeline

```bash
cd data-pipeline
python dataset_cleansing.py
```

MinerU 2.7.3 must be installed in the active Python environment. The script auto-discovers all `*.pdf` in `knowledge-base/raw/`.

### Web

```bash
cd web
yarn
cp .env.example .env.local
# fill in NEXT_PUBLIC_APP_ID, NEXT_PUBLIC_APP_KEY, NEXT_PUBLIC_API_URL
npm run dev
```

### Mobile

```bash
cd mobile
npm install
./build-mobile.sh          # builds web + syncs both platforms
npm run open:android       # open in Android Studio
npm run open:ios           # open in Xcode
```

## Key Design Decisions

- **API key security:** All Dify API calls are made server-side via `web/app/api/` proxy routes. The `API_KEY` is never exposed to the browser.
- **Chunking alignment:** The `Parent > Child` heading format produced by `data-pipeline/` maps directly to Dify's parent-child chunk segmentation — the two components are co-designed.
- **Policy vs. persona separation:** RAG (knowledge-base) provides factual accuracy from official PRDs; fine-tuning (`gpt-4.1-mini`) shapes tone and persona. Policy updates only require re-indexing; persona updates require retraining.
- **Language injection:** The active UI locale is mapped to a human-readable name and injected as a Dify conversation variable to be used in the system prompt, so the model responds in the correct language.