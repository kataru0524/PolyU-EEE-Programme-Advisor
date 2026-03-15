# Fine-Tuning Assets

This folder contains supervised chat data and helper scripts used to shape assistant tone and interaction behavior beyond pure RAG grounding.

## Dataset Snapshot

| File | Lines | Description |
|---|---|---|
| `fine_tune_data.jsonl` | 100 | Full curated dataset (canonical artifact, used for final fine-tuning run) |
| `fine_tune_train.jsonl` | 80 | 80/20 train split (produced but not used in final run) |
| `fine_tune_validation.jsonl` | 20 | 80/20 validation split (produced but not used in final run) |
| `fine_tune_data.csv` | 100 (excl. header) | Human-readable export for manual revision |
| `convert_to_csv.py` | — | JSONL → CSV converter |
| `eee-facts/` | — | Firecrawl-sourced EEE website pages, enrichment corpus |

## Fine-Tuning Model and Outcome

- **Target model:** `gpt-4.1-mini` on the OpenAI Platform — chosen to balance fine-tuning cost and inference performance.
- **Initial approach:** The dataset was split 80/20 into `fine_tune_train.jsonl` and `fine_tune_validation.jsonl` for a supervised fine-tuning run with evaluation.
- **Outcome:** Validation evaluation results were below expectations. The fine-tuned checkpoint was judged insufficient in quality when assessed on the validation split.
- **Final decision:** The full 100-example dataset (`fine_tune_data.jsonl`) was used for the production fine-tuning run without a held-out validation set, prioritizing dataset coverage over evaluation ceremony.

## `convert_to_csv.py`

This script reads `fine_tune_data.jsonl`, extracts `messages[0].content` (user) and `messages[1].content` (assistant), and writes `fine_tune_data.csv` with three columns:

| Column | Description |
|---|---|
| `ID` | Sequential integer per example |
| `Question` | User message text |
| `Answer` | Assistant message text |

The CSV is encoded `utf-8-sig` (UTF-8 with BOM) specifically for Excel/Numbers compatibility.

Run:

```bash
cd fine-tuning
python convert_to_csv.py
```

## `eee-facts/` Enrichment Corpus

This sub-directory contains 23 markdown files crawled from the PolyU EEE website (research pages, student experience pages, opportunities, faculty highlights) and one integration script.

**Sourcing:** Pages were crawled using **Firecrawl** and manually curated — only pages providing useful narrative context about the department, student life, and research were retained.

### `integrate_eee_facts.py`

The integration script iterates over all `.md` source files (alphabetically) and for each file:

1. Extracts YAML front matter (url, title) if present.
2. Strips everything before the first `# ` heading (removes crawler navigation noise).
3. Removes the standard PolyU chatbot-invite footer block.
4. Removes all `![...]()` markdown images and `<img>` HTML tags.
5. **Downgrade heading levels:** H1→H2, H2→H3, ..., H5→H6 (to prevent colliding with the top-level heading that anchors each source page).
6. Outputs a cleaned section prefixed with `# {title}\n{url}`.
7. Appends all cleaned sections into a single `eee_facts.md` file (~86 KB).

This `eee_facts.md` is a **secondary narrative corpus** (department highlights, research themes, scholarships, exchange programs, student activities), not the formal policy corpus used in primary RAG retrieval.

**Dataset generation:** The consolidated `eee_facts.md` was uploaded to **Google Gemini 3 Pro** to generate 100 fine-tuning Q&A examples in JSONL format. The output was converted to CSV via `convert_to_csv.py` and **manually reviewed and revised** before being accepted as the canonical dataset.

## Position In Overall System

| Layer | Role |
|---|---|
| RAG (knowledge-base) | **Policy source of truth** — programme regulations, admission rules, fees. Served at inference time via Dify retrieval. |
| Fine-tuning (this folder) | **Style and persona layer** — bakes response tone, helpful framing, and basic EEE knowledge into model weights at training time. |
| `eee-facts/` | **Fine-tuning input only** — used exclusively to generate the training dataset; never uploaded to any Dify knowledge base or used for RAG retrieval. |

This separation allows policy updates (new year PRDs) to be applied via knowledge base refreshes without rebuilding the fine-tuning dataset. Style and persona changes require rebuilding the dataset, not the knowledge base.

## Practical Guidance

- Keep JSONL as the canonical training artifact. CSV is for annotation review only.
- When extending the dataset, maintain balanced coverage across:
  - Admissions, programme planning, student opportunities, multilingual prompts.
- Do not use `eee-facts/` content as the sole source for strict academic policy decisions.