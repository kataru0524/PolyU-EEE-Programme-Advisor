# Data Pipeline

This folder contains the production preprocessing pipeline that converts PRD PDFs into retrieval-ready markdown and quality diagnostics. The single script `dataset_cleansing.py` is built on top of [MinerU](https://github.com/opendatalab/MinerU) — an open-source PDF-to-Markdown engine.

## Entry Point

```bash
cd data-pipeline
python dataset_cleansing.py
```

The script auto-discovers `*.pdf` in `../knowledge-base/raw/` (non-recursive) and skips any document whose `_processed.md` and `_processed_stats.txt` already exist in `processed/`.

## Environment

| Component | Version |
|---|---|
| MinerU (`mineru`) | 2.7.3 |
| Python | 3.13 |

## Processing Configuration

| Constant | Value | Purpose |
|---|---|---|
| `MAX_ROWS_PER_CHUNK` | 20 | Max rows per table block before splitting with repeated headers |
| `MAX_H2_CHARS` | 2500 | Max characters per H2 section before splitting into `(Part N)` |

> **Tip:** The `_processed_stats.txt` files report `max_h2_after_processing` and section size distributions. Use these values to calibrate the chunking size settings in Dify's knowledge pipeline configuration.

## Processing Workflow

`process_pdf_document()` runs the following stages for each PDF:

### Stage 1 — PDF Parsing (MinerU)
Runs MinerU's `hybrid_auto` method (combines layout analysis with inline formula detection). Output is cached in `knowledge-base/intermediate/`; re-run is skipped if a previous parse exists.

### Stage 2 — Structure Normalization
1. **TOC extraction:** Detects and removes the CONTENTS/PAGE block; retains it as an HTML table for later conversion.
2. **Heading normalization:** Uses the parsed TOC to build a heading → expected depth map. Headings absent from the TOC are demoted to plain text.
3. **Appendix handling:** Appendix sections are tracked separately; their subsections are prefixed with `Appendix X >` during promotion.
4. **H1 subsection flattening:** Dotted headings like `# 1.1 …` are converted to H2, preparing for promotion.

### Stage 3 — Table Conversion
1. **Table integrity guard:** Adds blank lines around `<table>` tags to prevent the Dify chunker from splitting mid-table.
2. **HTML → Markdown conversion:** `TableParser` propagates `rowspan`/`colspan` across a grid, splits on section-header rows, deduplicates merged-cell artifacts, combines two-row headers, and breaks large tables into chunks with repeated headers.

### Stage 4 — Heading Restructuring
1. **H1 removal + H2 promotion:** All H1 headings are removed; children become `## Parent > Child` headings. Pre-H2 content under an H1 is wrapped in an auto-inserted `> Introduction` block.
2. **`## Basic Information` insertion:** A fixed anchor heading is prepended to every document as a consistent retrieval entry point.

### Stage 5 — Section Splitting
H2 sections exceeding `MAX_H2_CHARS` (2500 chars) are split into `(Part 1)`, `(Part 2)`, etc., prioritizing paragraph boundaries, falling back to sentence boundaries.

### Stage 6 — Statistics Output
Computes section sizes and character distributions, writes `_processed_stats.txt`. The key metric is **`max_h2_after_processing`** — confirms splitting kept every final chunk within Dify's indexing limits.

## Directory Contract

| Path | Description |
|---|---|
| `../knowledge-base/raw/*.pdf` | Input PDFs |
| `../knowledge-base/intermediate/<doc>/` | MinerU parse cache |
| `../knowledge-base/processed/<doc>_processed.md` | Final retrieval-ready markdown |
| `../knowledge-base/processed/<doc>_processed_stats.txt` | Section sizes and diagnostics |

## Why This Matters

Retrieval quality is determined here. The `Parent > Child` heading schema maps directly to Dify's parent-child chunking strategy — the parent chunk provides topic context, the child chunk holds the retrieved content. Poor heading hierarchy or table normalization degrades RAG relevance regardless of LLM quality.