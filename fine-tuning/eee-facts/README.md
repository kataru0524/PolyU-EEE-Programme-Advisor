# EEE Facts Corpus

This folder contains PolyU EEE website pages crawled as enrichment material for fine-tuning data creation, plus an integration script that consolidates them into a single artifact.

## Sourcing

- Pages were crawled using **Firecrawl** and **manually curated** — only pages with useful narrative context about the department, student life, research, and opportunities were retained.
- 23 markdown files are included, covering research themes, research centres, student exchange, mentorship, scholarships, academic advising, and faculty highlights.

## Corpus Role

`eee_facts.md` is a **fine-tuning dataset input only** — it was used exclusively to prompt Google Gemini 3 Pro to generate the 100-example training dataset, shaping the model's persona and baking basic EEE department knowledge into its weights. It was **never uploaded to any Dify knowledge base** and plays no role in RAG retrieval at inference time.

## Integration Script

```bash
cd fine-tuning/eee-facts
python integrate_eee_facts.py
```

This script iterates over all `.md` source files (alphabetically) and for each:

1. Extracts YAML front matter (`url`, `title`) if present.
2. Strips everything before the first `# ` heading (removes crawler navigation noise).
3. Removes the standard PolyU chatbot-invite footer block.
4. Removes all markdown images (`![...]()`) and `<img>` HTML tags.
5. Downgrade heading levels: H1→H2, H2→H3, ..., H5→H6 (prevents collision with the top-level title anchor added per page).
6. Outputs a cleaned section prefixed with `# {title}\n{url}`.
7. Appends all sections into `eee_facts.md` (~86 KB consolidated).

## Dataset Generation

The consolidated `eee_facts.md` was uploaded to **Google Gemini 3 Pro** to generate 100 fine-tuning Q&A examples in JSONL format. The output was converted to CSV for **manual revision** before being accepted into the canonical `fine_tune_data.jsonl`.

## Practical Boundary

Use these files to improve warmth and contextual richness. Do not use them as the sole source for strict academic policy decisions — that role belongs to the PRD documents in `knowledge-base/raw/`.