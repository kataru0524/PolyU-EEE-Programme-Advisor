# Dify Configuration

This folder stores exported Dify artifacts that define ingestion pipelines and the runtime chat workflow. Without these, the web frontend alone cannot reproduce the retrieval and orchestration behavior.

## Files

| File | Type | Purpose |
|---|---|---|
| `Intelligent Programme Advisor Chatbot.yml` | Chatflow | Runtime conversation orchestration |
| `PolyU EEE PRDs.pipeline` | Knowledge Pipeline | Ingestion config for programme regulation docs |
| `PolyU Admissions.pipeline` | Knowledge Pipeline | Ingestion config for admissions documents |
| `PolyU Fees and Scholarships.pipeline` | Knowledge Pipeline | Ingestion config for fees/scholarship docs |

## Knowledge Ingestion Pipelines (`*.pipeline`)

All three pipelines share the same foundational retrieval architecture, with per-pipeline weight tuning:

- **Embedding model:** `text-embedding-3-large`
- **Retrieval mode:** Hybrid (vector + keyword), combining semantic and lexical matching
- **Keyword weight:** `0.3` / **Vector weight:** `0.7`
- **Reranking:**
  - `PolyU EEE PRDs.pipeline` uses `jina-reranker-v3`
  - `PolyU Admissions.pipeline` and `PolyU Fees and Scholarships.pipeline` use `jina-reranker-m0`
- **Chunking strategy:** Parent-child segmentation — this maps directly to the `Parent > Child` heading format produced by `data-pipeline/dataset_cleansing.py`. The parent chunk provides topic context; the child chunk holds the specific content retrieved.

Separating the three domains into distinct pipelines allows retrieval weight tuning and reranker selection per document type without cross-contaminating results between programme policy, admissions, and financial content.

## Chatbot App Workflow (`Intelligent Programme Advisor Chatbot.yml`)

This is a **Chatflow** workflow that goes beyond a simple Q&A loop:

- **Multi-branch intent routing:** Incoming queries are classified by intent before reaching the LLM. This ensures that admissions questions route to the Admissions knowledge base, financial questions route to the Fees pipeline, etc., rather than performing a scattershot retrieval across all documents simultaneously.
- **Conversation variable handling:** Variables from the user onboarding form (programme interest, language preference) are carried as conversation-level state and used to shape retrieval context across turns.
- **Conditional LLM path selection:** The workflow applies conditional logic to select which retrieval pipeline(s) to invoke, which prevents unnecessary over-retrieval on single-domain queries.
- **Speech features:** STT and TTS are enabled, proxied through the web app's `/api/audio-to-text` and `/api/text-to-audio` routes.

## Reproducibility Workflow

1. Import all `*.pipeline` files into Dify and create the corresponding knowledge bases.
2. Index the processed markdown files from `../knowledge-base/processed/` into each knowledge base.
3. Import `Intelligent Programme Advisor Chatbot.yml` as a Chatflow app.
4. Wire the model providers and knowledge bases to the app nodes.
5. Copy the app's credentials (`APP_ID`, `APP_KEY`, `API_URL`) into `web/.env.local`.

## Versioning Note

These exports are versioned infrastructure. Frontend UX can change freely, but retrieval quality, routing logic, and chunking strategies are defined here. Any changes to pipeline parameters or workflow routing should be re-exported and committed alongside corresponding changes to `data-pipeline/` output formats.