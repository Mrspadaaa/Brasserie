# Harness and prompting techniques for invoice reading with Gemini 3.5 Flash-Lite and 3.8 Flash (state as of 1 November 2026)

Scope note: model facts come from Google docs pages stamped "Last updated 2026-10-09" to "2026-10-23". Google now presents the **Interactions API** as the main API and labels `generateContent` as "(Legacy)". The app uses `generateContent`, so legacy parameter names are given wherever the docs provide them. Anything from 2025 or about another model version is flagged.

## 1. Thinking levels: does more thinking help document/OCR extraction, and what does it cost?

### Takeaway
The evidence is mixed and comes from vendors and individuals, not peer review. On 3.8 Flash, `high` raised Roboflow's OCR score by +5.9 points (structured-JSON sub-score 86.1% to 90.9%) for 8x the cost and 6.3x the latency. A small 4-page OCR benchmark instead found `low` best and `high` worse at 4x the latency. Google's own Flash-Lite guidance says to try both `minimal` and `high` depending on how complex the document is. Nobody has published a measurement for 3.5 Flash-Lite on invoices.

### Cited Findings
**Model status and allowed values**
- `gemini-3.8-flash` accepts `thinking_level` = `low`, `medium` (default), `high`. `minimal` "is not supported" and returns an error. `thinking_level` replaces `thinking_budget`. Limits: 1M context, 64k max output. Price: $0.75 in / $3.75 out per 1M tokens (introductory, through 31 Dec 2026), then $1.50 / $7.50 from 1 Jan 2027 — [What's new in Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8)
- The Vertex/Agent Platform guide lists LOW, MEDIUM and HIGH for 3.8 Flash, with MEDIUM as default; MINIMAL gives a validation error — [Developer's guide to Gemini 3.8 Flash (Cloud)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash)
- Gemini 3.8 Flash reached GA on 2 Sep 2026. Gemini 3.7 Flash and 3.5 Flash were deprecated on 8 Oct 2026, and `gemini-3.5-flash` is "automatically routed to `gemini-3.6-flash`" — [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog)
- `gemini-3.5-flash-lite` reached GA on 21 Jul 2026, with retirement on 21 Jul 2027 or later. It has 1,048,576 input tokens, 65,536 output tokens and up to 3,000 images per prompt (7 MB inline). Its thinking levels are MINIMAL (default, "for latency-sensitive classification, routing, and JSON extraction"), LOW, MEDIUM and HIGH — [Gemini 3.5 Flash-Lite (Cloud)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)
- 3.5 Flash-Lite is priced at $0.30 in / $2.50 out per 1M tokens. Google positions it for "high-volume data parsing and document extraction" and says it "improves accuracy on document parsing and structured data extraction". The page suggests trying both `minimal` and `high` thinking depending on document complexity. Benchmarks cited: CharXiv 74.5% vs 63.7% for an unnamed comparison model — [What's new in Gemini 3.6 Flash and 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6)
- `minimal` "does not guarantee that thinking is off". Google also warns that minimal can cause "premature tool termination on multi-step tasks", which matters if code execution is turned on — [Gemini 3.5 Flash-Lite (Cloud)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)
- **Sampling:** on Flash-Lite, "custom temperature, top-K, and top-P values are ignored" — [Gemini 3.5 Flash-Lite (Cloud)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite). Since 21 Jul 2026, "temperature, top_p and top_k are now deprecated" — [changelog](https://ai.google.dev/gemini-api/docs/changelog). For 3.6 Flash and 3.5 Flash-Lite they are "deprecated and ignored", "future generations return HTTP 400", and Google advises using a system instruction for determinism — [What's new 3.6 / 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6). The 3.8 migration checklist says to remove `temperature`, `top_p`, `top_k` and `candidate_count` — [What's new 3.8](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8). **The app's `temperature: 0` is therefore a no-op on both target models.**
- Older guidance (Gemini 3 / 3.1 page): "Keep the default of 1.0". Setting temperature below 1.0 "may cause looping or degraded performance". On that page `thinking_level` defaults to `high` for 3 Flash and 3.1 Pro, `minimal` is the default for 3.1 Flash-Lite, and `thinking_level` combined with `thinking_budget` gives a 400 — [Gemini 3 developer guide](https://ai.google.dev/gemini-api/docs/gemini-3) (flag: about 3 / 3.1 models, not 3.5 / 3.8)

**Measured effect of thinking on OCR and extraction**
- Roboflow Vision Evals for Gemini 3.8 Flash (snapshot 26 Oct 2026; OCR is a single preliminary run):
  - OCR at low effort: 72.8%, 12.6 s, $0.0049 per sample.
  - OCR at high effort: 78.7%, 79.8 s, $0.039 per sample. That is +5.9 points for 8x the cost and 6.3x the latency.
  - OCR sub-scores, low vs high: single value 73.5% vs **70.9%** (worse at high); transcription 91.3% vs 94.1%; **structured JSON 86.1% vs 90.9%**; **text localization 26.4% vs 58.6%**.
  - On the same page, Gemini 3.5 Flash scores 81.8% overall, above 3.8 Flash's 79.8%. Flash-Lite is not on that page.
  — [Roboflow: Gemini 3.8 Flash](https://playground.roboflow.com/models/google/gemini-3-8-flash). Conflict: the search-engine snippet of a page with the same name said "+1.5 points on OCR at 27x cost", and "2.4 points lower on data extraction at high effort for 4.8x cost and 1.8x latency". The fetched page (Oct 2026) does not show these figures; they may be from an earlier snapshot.
- `luseloso/gemini-thinking-ocr-benchmark` ran 3.8 Flash on dense report pages (200 DPI PNGs, **only 4 pages**, ELO from a pairwise judge, which was gemini-3.5-flash-lite):

  | Thinking | ELO | Latency | CER | Numeric F1 |
  |---|---|---|---|---|
  | LOW | 1022.0 (best) | 10.77 s | 0.302 | 97.6% |
  | MEDIUM | 998.1 | 15.27 s | 0.298 | 96.7% |
  | HIGH | 1012.9 | 42.60 s | 0.406 (worst) | 96.7% |
  | DEFAULT | 996.3 | 14.68 s | 0.226 (best) | 97.6% |

  Numeric F1 stays at 96.7–97.6% at every level. Cost per page is about $0.0107 at all levels. — [GitHub: gemini-thinking-ocr-benchmark](https://github.com/luseloso/gemini-thinking-ocr-benchmark). Caveat: the repo also reports a MINIMAL run on 3.8 Flash, which the official docs say returns an error. The sample is tiny and the run is undated.
- The 3.8 Flash model "can use more tokens on longer running and complex tasks, by design". Lowering reasoning effort reduces token use — [What's new 3.8](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8)
- Output tokens (billed) include thinking tokens — [Code execution docs](https://ai.google.dev/gemini-api/docs/code-execution)

### Inferences
- On 3.8 Flash, `medium` or `high` is most likely to help on the error types that need cross-checking: the price column, net vs gross, and the 2-rate VAT. Roboflow's "structured JSON" (+4.8 pts) and "text localization" (+32 pts) gains point that way. The likely cost is about 2–8x in tokens and 1.5–6x in latency. Because `high` hurt "single value" reading and CER in the small benchmark, use it as an **escalation level** (third read, failed arithmetic check), not as the default.
- For 3.5 Flash-Lite, Google's "try minimal and high" advice means an A/B on the 7-invoice bench is cheap. One page costs well under $0.01 even at `high`, given $2.50/M output.
- Interaction with `maxOutputTokens: 5100`: thinking tokens are billed as output. If, as in Gemini 2.5, they count toward the output cap (not confirmed for 3.x, see Gaps), then `high` on a long multi-page invoice could hit `MAX_TOKENS` before the JSON closes. Check `finishReason` and the thinking-token count in `usageMetadata` per read before raising the level.
- `temperature: 0` is ignored. So the two "independent" reads are not deterministic duplicates; they are samples at the model's default temperature. When they agree on a wrong value, the error is systematic (prompt or perception), not sampling noise. A vote over the same prompt cannot fix that.

### Gaps
- No published measurement of thinking level vs accuracy for **3.5 Flash-Lite** on documents or invoices.
- No official statement on whether `maxOutputTokens` includes thinking tokens for 3.5 / 3.8. The docs only say thinking tokens are billed as output.
- No published per-level token counts for document tasks on either model.

## 2. Agentic Vision / code execution with images (zoom, crop, annotate)

### Takeaway
Agentic Vision is code execution plus thinking on image inputs. Google announced it on 27 Jan 2026 for Gemini 3 Flash, claiming "a consistent 5-10% quality boost across most vision benchmarks". The current docs (Oct 2026) show it with `gemini-3.8-flash`. For 3.5 Flash-Lite, code execution is listed as supported, but image manipulation and agentic vision are **not documented**. No document, receipt or invoice gains and no latency figures are published.

### Cited Findings
- **Announcement (27 Jan 2026):**
  - Loop: Think, then Act (write and run Python to crop, rotate, annotate or compute), then Observe (the transformed image is appended to context).
  - Enabled in the API via `tools=[types.Tool(code_execution=types.ToolCodeExecution)]` (Python SDK, generateContent), or the "Code Execution" toggle in AI Studio.
  - Gain claimed: "consistent 5-10% quality boost across most vision benchmarks". The examples are building-plan validation (+5% at PlanCheckSolver), finger counting and dense tables turned into charts. **No OCR, receipt or invoice example.** Latency and cost are not mentioned.
  - Plans: implicit rotation and visual math, and extension "to model sizes beyond Flash".
  — [Google blog: Introducing Agentic Vision in Gemini 3 Flash](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/)
- At launch the feature was limited to Flash — [The Decoder](https://the-decoder.com/google-deepmind-gives-gemini-3-flash-the-ability-to-actively-explore-images-through-code/)
- **Current docs (updated 13 Oct 2026):**
  - The examples use `gemini-3.8-flash`. Interactions API syntax is `tools=[{"type": "code_execution"}]`.
  - Image use requires "enabling both Code Execution as a tool and Thinking".
  - "The model handles zooming automatically"; other image operations need an explicit prompt asking for code.
  - Limits: 30 s runtime, up to 5 code regenerations after errors, Python only, no custom libraries. Preinstalled libraries include numpy, pandas, opencv-python and pillow.
  - Billing: no extra charge. Intermediate tokens (prompt, generated code, execution results) are billed as input; the final answer, code, execution output, thinking and summary are billed as output.
  - Code execution can be combined with function calling on Gemini 3 / 4.
  - Warning: enabling code execution "can cause regressions in other output areas".
  — [Code execution docs](https://ai.google.dev/gemini-api/docs/code-execution)
- The changelog has no 2026 entry extending code execution with images beyond Gemini 3 Flash; the note is from December 2025 — [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog)
- 3.5 Flash-Lite: "Code execution: supported". Logprobs and image manipulation / agentic vision are not mentioned — [Gemini 3.5 Flash-Lite (Cloud)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite). The 3.5 Flash-Lite release describes code execution for "frontend JavaScript and tabular data", not images — [What's new 3.6 / 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6)
- Structured outputs can be combined with Code Execution on Gemini 3 / 4 (marked "Preview") — [Structured output (legacy generateContent)](https://ai.google.dev/gemini-api/docs/generate-content/structured-output); also [Gemini 3 guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- The Gemini 3 Flash model "is trained to implicitly zoom when detecting fine-grained details" — [Agentic vision docs page](https://ai.google.dev/gemini-api/docs/robotics-agentic) (via search snippet; that page centres on the Gemini Robotics ER models)

### Inferences
- For the app, Agentic Vision fits best as a **targeted re-read on 3.8 Flash**: "crop the line-items table and the VAT summary, re-read them, check qty × unit = line total", triggered only when arithmetic checks fail. Each code step adds a full model turn plus up to 30 s of sandbox time, so it is a poor fit for the default interactive path.
- Pairing with `thinkingLevel: LOW` is allowed, since thinking just has to be on. Google's minimal-level warning about early tool termination suggests `medium` is safer when tools are on.
- The same crop-and-zoom effect can be had deterministically and more cheaply in the Cloud Function: crop or tile the image server-side (sharp/Jimp) and send the crop as a new image part. This avoids the sandbox latency and does not depend on model support (works on Flash-Lite).

### Gaps
- No official statement that image code execution works on `gemini-3.5-flash-lite`. It must be tested (it costs tokens, so it is out of scope here).
- No published latency, token overhead, or accuracy gain for Agentic Vision on documents or invoices.
- The exact JS (`@google/genai`) legacy form is presumably `tools: [{ codeExecution: {} }]`, inferred from the Python SDK name; not confirmed in a fetched 2026 page.

## 3. Media resolution and image tiling for dense invoices

### Takeaway
On Gemini 3 / 4 models the image token budget is fixed by `media_resolution`: low 280, medium 560, high 1120, ultra_high 2240 tokens per image. `unspecified` also equals 1120 for images. The app's `MEDIA_RESOLUTION_HIGH` is already the documented "best setting for most use cases". The only step up is `ultra_high`, which can be set **per content item only**. It doubles image tokens, and Google recommends it for cases like computer use, not documents. No invoice measurement exists.

### Cited Findings
- Token table for Gemini 4 / 3 models (images): unspecified 1120, low 280, medium 560, high 1120, ultra_high 2240. `ultra_high` is "available only per content item".
- Per-item control uses `"resolution": "high"` on each media object, and different levels can be mixed in one request (Gemini 4 and 3). The page uses lowercase values.
- Recommendations: `high` "for most image analysis". For PDFs `medium` is the default recommendation ("high rarely improves OCR on standard documents"), with higher settings "for dense documents".
- Page updated 2026-10-13. It has no Flash-Lite-specific token table.
— [Media resolution docs](https://ai.google.dev/gemini-api/docs/media-resolution)
- The legacy image docs still describe older tiling: an image ≤384 px on both sides costs 258 tokens; larger ones are cut into 768×768 tiles at 258 tokens each (crop unit = floor(min(w,h)/1.5)). Gemini 3 adds `media_resolution`, which "sets the maximum tokens per image"; higher settings help fine text but raise tokens and latency. Advice: "Verify that images are correctly rotated" and "Use clear, non-blurry images". Inline requests are limited to 20 MB in total — [Image understanding (legacy)](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding) (flag: the tiling rule applies to pre-Gemini 3 models)
- Gemini 3 migration notes: "Test `media_resolution_high` for dense document parsing"; PDF token use may rise under the new defaults — [Gemini 3 guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- Roboflow lists 3.8 Flash input at $0.825/M and cached input at $0.083/M (third-party pricing snapshot, 1 Nov 2026) — [Roboflow: Gemini 3.8 Flash](https://playground.roboflow.com/models/google/gemini-3-8-flash)

### Inferences
- Cost per image at `high` (1120 tokens):

  | Model | Price per 1M input | Cost per image |
  |---|---|---|
  | 3.5 Flash-Lite | $0.30 | ≈ $0.00034 |
  | 3.8 Flash (intro) | $0.75 | ≈ $0.00084 |
  | 3.8 Flash (from 2027) | $1.50 | ≈ $0.0017 |

  `ultra_high` doubles each figure. Image tokens are therefore negligible next to output and thinking tokens; latency is the real cost.
- On Gemini 3+ the budget is a fixed **cap per image**. So a tall phone photo of a long receipt, or a dense A4 invoice, gets compressed into the same 1120 tokens as a small photo. Two cheap options raise the effective resolution on Flash-Lite:
  - **Client- or server-side tiling:** split the page into 2–3 overlapping horizontal bands, each sent as its own image part at `high`.
  - **Per-part `ultra_high`:** only on the line-item crop.
- Send each page of a multi-page invoice as its own image part; each costs one budget.
- Rotation and deskew before upload are explicitly recommended by Google, and cheap to do in the Cloud Function.

### Gaps
- The exact per-part field name in legacy `generateContent` JS (the Gemini 3 era used something like `mediaResolution: { level: "MEDIA_RESOLUTION_ULTRA_HIGH" }` on a Part) is not confirmed in a fetched 2026 page.
- No benchmark of `high` vs `ultra_high` (or tiling) on invoices or receipts for any Gemini 3.x model.
- Token counts for 3.5 Flash-Lite are not tabulated separately; presumably they match the "Gemini 3 models" table.

## 4. Structured outputs: responseJsonSchema vs responseSchema, ordering, enums, reasoning fields, long-array pitfalls

### Takeaway
The current legacy docs show only `responseMimeType` + **`responseJsonSchema`** (JSON Schema subset), and no longer mention `responseSchema`. Output keys follow schema key order (`propertyOrdering` is only needed for Gemini 2.0). Nullability is expressed with type arrays. `enum`, `minimum`/`maximum`, `minItems`/`maxItems`, `anyOf`, `$ref` and `format: date` are supported. The known failure on Flash models is runaway repetition inside schema-constrained JSON, reported up to gemini-3.7-flash in Aug 2026; `temperature: 0` does not prevent it.

### Cited Findings
- **Legacy generateContent parameters:** `response_mime_type` / `response_json_schema` (Python), `responseMimeType` / `responseJsonSchema` (JS). In REST: `generationConfig.responseFormat.text` with `mimeType` and `schema`.
- The model "will produce outputs in the same order as the keys in the schema"; `propertyOrdering` is mentioned only for Gemini 2.0.
- Nullability uses a type array such as `["string","null"]`.
- Supported keywords: `title`, `description`, `properties`, `required`, `additionalProperties`, `enum`, `format` (date-time / date / time), `minimum`/`maximum`, `items`, `prefixItems`, `minItems`/`maxItems`. `anyOf` and `$ref` appear in the examples.
- "The model ignores unsupported properties"; very large or nested schemas may be rejected.
- Best practices: clear `description` fields; `enum` for limited values; validate in code, because output "does not guarantee the values are semantically correct".
- Page updated 2026-10-19.
— [Structured output (legacy)](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
- Interactions API equivalent: `response_format: {type:"text", mime_type:"application/json", schema}`.
  - `minLength`, `maxLength`, `uniqueItems` and similar keywords are **stripped, not enforced**.
  - Complex schemas can return `400 INVALID_ARGUMENT` ("too many states / branching"). Causes: large `maxItems` on nested arrays, long names, many enums or `anyOf` branches, wide numeric bounds.
  - Structured output can be combined with Search, URL context, Code Execution, File Search and Function Calling on Gemini 3 (Preview).
  — [Structured output (Interactions)](https://ai.google.dev/gemini-api/docs/structured-output)
- **Repetition loop on gemini-3.7-flash (17 Aug 2026):**
  - With `responseMimeType: application/json` + `responseSchema` and `thinkingLevel: LOW`, an integer field's digits repeat until `maxOutputTokens`, finishing with `MAX_TOKENS`. JSON is truncated.
  - Rate: about 33% on a synthetic repro, up to 100% on some payloads. Trigger: about 10 **near-identical items** differing only in a decimal. `temperature: 0` did not prevent it.
  - Workarounds: cap `maxOutputTokens`, per-chunk retries, fall back to another model. No Google reply. 3.8 Flash status unknown.
  — [Forum: 3.7 Flash JSON degenerates into repeated 0](https://discuss.ai.google.dev/t/gemini-3-7-flash-schema-constrained-json-output-degenerates-into-repeated-0-until-maxoutputtokens-regression-vs-gemini-3-flash-preview/178681)
- Similar earlier reports:
  - A loop inside a JSON number literal under constrained decoding, late in long outputs — [Forum: repetition loop in number literal](https://discuss.ai.google.dev/t/structured-output-repetition-loop-inside-a-json-number-literal-runs-to-max-tokens-flash-vertex/175138)
  - About 30% of requests on 2.5 Flash — [Forum: 2.5 Flash repeats tokens](https://discuss.ai.google.dev/t/gemini-2-5-flash-repeats-tokens-until-max-tokens-reached-in-structured-output/107176) (flag: 2.5)
- ExtractBench (Feb 2026; tested Gemini 3 Flash and 3 Pro, GPT-5/5.2, Claude 4.5): performance "degrades sharply as schema breadth increases", with "0% valid output on a 369-field financial reporting schema across all tested models" — [arXiv 2602.12247](https://arxiv.org/abs/2602.12247)
- ExtractBench (LlamaIndex, Jul 2026; 4,869 pages): commercial VLMs "often truncate record lists on long" documents. Grounding (word- and page-level F1) is scored as a first-class metric — [arXiv 2607.29677](https://arxiv.org/abs/2607.29677)
- VAREX (Mar 2026): "schema echo" (returning structure instead of values) costs 45–65 points in small (<4B) models; frontier models are less affected — [arXiv 2603.15118](https://arxiv.org/abs/2603.15118)

### Inferences (mapped to the app's observed errors)
- **Ordering as reasoning:** since keys are emitted in schema order, any field placed first acts as an in-call "transcribe first" step at no extra request. For example: a `layout` object (column headers verbatim, `prices_include_vat`: `"net"|"gross"|"mixed"`, `vat_rates_present`), then per line a `row_text` verbatim, then the numeric fields. This targets the "wrong price column" and "net vs gross" errors. It costs output tokens (≈ one line of text per item).
- **Separate slots for confusable values:**
  - Dates: `invoice_date`, `service_period_start`/`end` and `due_date` as separate `format: date` fields, so a period date has a home that is not `invoice_date`.
  - VAT: a `vat_breakdown` array of `{rate, net, vat, gross}` instead of single net/VAT fields, to fix "missing net/VAT on a 2-rate receipt".
- **Enums and descriptions:**
  - `currency` as an `enum` (`CHF`, `EUR`, …) with a description such as "Fr., SFr., Fr are CHF". Constrained decoding then cannot emit "Fr.".
  - `vat_rate` as a number with `minimum`/`maximum`, or an enum of Swiss rates; descriptions on `unit_price` vs `line_total`.
  - Rule for qty-1 lines: in deterministic post-processing, `unit_price := line_total` when `quantity == 1` and `unit_price` is null.
- **Repetition guard:** invoices with many near-identical lines (the same article in several sizes) match the reported trigger. Keep the `maxOutputTokens` cap, treat `finishReason == MAX_TOKENS` as a failed read that triggers the third read or escalation, and avoid large `maxItems` on the line array (400 risk).
- Moving from `responseSchema` (OpenAPI subset, `nullable`) to `responseJsonSchema` (type-array null, `anyOf`, `$ref`) matches the current docs. Whether it changes accuracy is unmeasured.

### Gaps
- No published measurement of how much a leading "transcription/reasoning" field improves Gemini extraction accuracy.
- No official Google acknowledgment or fix for the structured-output repetition loop, and no data on whether 3.8 Flash or 3.5 Flash-Lite are affected.
- No documented maximum array length; one low-authority page claims truncation near 500 items (not used).

## 5. Pipeline techniques: two-stage OCR then extract, bounding-box grounding, targeted re-read, verifier, self-consistency, cascade, logprobs

### Takeaway
No clean, measured invoice study isolates transcribe-then-extract against direct extraction for Gemini 3.x. The strongest adjacent evidence is VAREX: layout-preserving text input gives the largest gain, +3 to 18 points, on forms. Logprobs are **deprecated for Gemini 3.x** and reported failing, so `avgLogprobs` is not a usable confidence signal. For the app's failure mode (two Flash-Lite reads agreeing on a wrong value), check-triggered escalation to 3.8 Flash and decorrelated reads are the relevant levers. These are inferences; no source tests them on Gemini 3.x invoices.

### Cited Findings
- **Two-stage evidence:**
  - VAREX (1,777 government forms, 4 input modalities, 20 models): layout-preserving text gives "the largest accuracy gain (+3 to 18 pp), larger than pixel-level visual cues" — [arXiv 2603.15118](https://arxiv.org/abs/2603.15118)
  - CENTURIA (archaeological metadata, not invoices): an LLM extractor reaches 96.76% given ground-truth transcriptions vs >87% overall from OCR output. Transcription quality caps extraction — [arXiv 2608.30616](https://arxiv.org/pdf/2608.30616) (via search summary)
  - RaftLabs reports an OCR-then-Gemini 2.5 Flash production pipeline at 97% line-item accuracy and says the split "reduced latency and improved accuracy", but gives no single-pass baseline — [RaftLabs](https://www.raftlabs.com/blog/ocr-vs-llm-how-we-built-automated-invoice-scanning) (flag: 2.5 Flash; via search summary)
- **Line items are the weak spot everywhere:**
  - A GPT-4o test: 90.8% invoice accuracy without line items vs 86.5% with them — [HackerNoon](https://hackernoon.com/can-your-llm-handle-an-invoice-i-tested-5heres-the-truth) (flag: other model, via search summary)
  - A vendor report puts line-item extraction at 88–92%, the lowest field group — [Invoox](https://invoox.io/en/blog/ai-vision-invoice-extraction-accuracy/) (vendor, via search summary)
  - Box measured a 10-point gain for Gemini 3 Flash over 2.5 Flash on about 1,000 extraction fields — [Box blog](https://blog.box.com/gemini-3-flash-sets-new-standard-accuracy-unstructured-data-extraction) (via search summary; flag: Gemini 3 Flash, likely Dec 2025)
- **Verifier pass:** a "second pass that verifies rather than re-extracts" is promoted, but the claimed "0.0001%" error rate is unsourced — [Thomas Wiegold](https://thomas-wiegold.com/blog/building-reliable-invoice-extraction-prompts/) (treat as unverified)
- **Grounding / bounding boxes:**
  - Gemini returns `box_2d` as [ymin, xmin, ymax, xmax] normalized to 0–1000 — [Image understanding (legacy)](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding)
  - On 3.8 Flash, Roboflow's "text localization" sub-score is 26.4% at low effort vs 58.6% at high — [Roboflow](https://playground.roboflow.com/models/google/gemini-3-8-flash)
  - ExtractBench scores grounding (citing source evidence) as a separate metric; agentic and coding-agent extractors keep higher accuracy on long documents at much higher cost — [arXiv 2607.29677](https://arxiv.org/abs/2607.29677)
- **Logprobs:** "The responseLogprobs parameter is deprecated for Gemini 3.x models and will soon be completely deprecated" — [Agent Platform inference reference](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/inference) (via search summary). Users report 400 "logprobs is not supported" for gemini-3-pro-preview and 3.1-pro-preview on Vertex — [Forum](https://discuss.ai.google.dev/t/were-logprobs-disabled-for-gemini-3-3-1-in-vertex-api/132426). The 3.5 Flash-Lite capability list does not mention logprobs — [Cloud 3.5 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)
- **Sampling diversity:** temperature is ignored on 3.5 Flash-Lite and deprecated on 3.x, and `candidate_count` is unsupported on Gemini 3+ — [What's new 3.6 / 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6). Diversity can therefore only come from prompt, model, thinking level or image variants.
- **Swiss QR-bill:** its payload carries an amount (0.01–999,999,999.99, or empty) and a mandatory currency limited to **CHF or EUR**, plus the creditor IBAN or QR-IBAN and address. QR-bill v2.3 stays valid alongside v2.4 until Nov 2027 — [Scandit Swiss QR parser](https://docs.scandit.com/data-capture-sdk/web/parser/swissqr.html), [chqr (PyPI)](https://pypi.org/project/chqr/), [HexaPDF SwissQRBill](https://hexapdf-extras.gettalong.org/api/HexaPDF/Extras/Layout/SwissQRBill.html) (secondary sources; the official spec is the SIX implementation guide)

### Inferences (harness options and their cost)
1. **Escalate on failed checks, not only on disagreement.** Today the third read runs only when the pair disagrees, so an agreed wrong value survives. If arithmetic fails (Σ lines ≠ net, net + VAT ≠ total, qty × unit ≠ line total), run 3.8 Flash at `medium`. A correlated Flash-Lite error then gets an independent model. Cost: one 3.8 Flash read (≈ $0.006–0.02 at intro prices, ≈ 10–15 s at low/medium per the benchmarks above), only on failing invoices.
2. **Decorrelate the pair.**
   - Read B could use a different prompt (rows first, then totals; or ask for `row_text` first), a different crop or tiling, or a different thinking level.
   - Or run a heterogeneous pair: Flash-Lite plus 3.8 Flash at `low`. 3.8 Flash at low was the fastest level in the OCR benchmark (10.8 s).
   - Same-prompt self-consistency cannot fix systematic errors, and temperature cannot be used to diversify.
3. **Targeted field re-read on a crop.** When a check fails, send only the failing region (the VAT summary block, or one line) as a new image part at `high` or `ultra_high`, with a narrow schema such as `{vat_breakdown}` or `{unit_price, line_total}`. Cheap in input (≈ 1120–2240 tokens) and short output. The crop needs a location:
   - `box_2d` per value from the first read. Unreliable at low thinking: 26% text localization on 3.8 Flash.
   - Or a fixed layout heuristic: totals usually sit at the bottom.
4. **Use deterministic data first.** Decode the Swiss QR-bill in the Function (a JS QR decoder, no LLM) to get the exact total and currency (CHF/EUR) and the creditor. Use them as ground truth for the vote and as a check on the model's total and currency. This directly fixes "Fr." and total errors on QR-bill invoices, at near-zero latency.
5. **In-call transcription (from section 4)** gives most of the two-stage benefit without a second request. A true two-stage design (transcribe to markdown, then extract from text plus image) adds one full round trip; the evidence for it is indirect (VAREX, CENTURIA).
6. **Confidence signal:** use read agreement plus arithmetic and QR consistency, not `avgLogprobs`, which is deprecated and failing on 3.x.

### Gaps
- No measured comparison, for Gemini 3.x on invoices, of: two-stage vs single pass; verifier vs re-extraction; diverse-prompt vs same-prompt voting; cascade thresholds.
- No published accuracy of `box_2d` grounding for individual invoice values on Flash-Lite.
- The ExtractBench papers' full results (Gemini line-item numbers) were not read beyond their abstracts.

## 6. Google's prompting guidance for document understanding in Gemini 3.x; system instructions, few-shot with images, context caching

### Takeaway
Google's 2026 guidance is short:
- put the text prompt after the image;
- keep prompts concise and direct, since Gemini 3 "may over-analyze elaborate prompt engineering";
- put instructions after large data, anchored with "Based on the preceding information";
- use system instructions for determinism now that temperature is ignored;
- check rotation and use sharp images.

Implicit caching needs at least 4,096 prefix tokens on 3.8 Flash; Flash-Lite's threshold is not listed. No official few-shot-with-images guidance for documents was found.

### Cited Findings
- "When using a single image with text, place the text prompt after the image part in the contents array"; "Verify that images are correctly rotated"; "Use clear, non-blurry images" — [Image understanding (legacy)](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding)
- Gemini 3 prompting: keep prompts concise and direct, since the model "may over-analyze elaborate prompt engineering". With large inputs, put instructions after the data, anchored with "Based on the preceding information". Responses are less verbose by default — [Gemini 3 guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- Use a `system_instruction` for determinism, and structured outputs or a system instruction instead of prefilled model turns. On 3.5 Flash-Lite, requests whose last turn is a model turn are rejected — [What's new 3.6 / 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6); [Cloud 3.5 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)
- **Context caching** (page updated 2026-10-23):
  - Implicit caching is on by default for 2.5+ models, with no guaranteed saving. Its minimum prefix is **4,096 tokens** for Gemini 3.8 Flash, 3.6 Flash and 3.1 Pro (2,048 for 2.5). Flash-Lite is not listed.
  - To maximise hits: put large common content at the start of the prompt and send requests with similar prefixes close together.
  - Explicit caching works on Gemini 3 and 2.5 (Beta, `v1beta`), with a 1 h default TTL; it is not supported on Gemini 4 Argon or later.
  — [Context caching (legacy)](https://ai.google.dev/gemini-api/docs/generate-content/caching)
- Cached input for 3.8 Flash is $0.083/M vs $0.825/M uncached, about −90% (third-party snapshot) — [Roboflow](https://playground.roboflow.com/models/google/gemini-3-8-flash)
- 3.5 Flash-Lite supports implicit and explicit caching — [Cloud 3.5 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)

### Inferences
- Order for each request: system instruction (rules, Swiss specifics: CHF/Fr., Swiss VAT rates (8.1/2.6/3.8% since 2024, from general knowledge, not checked in this research), QR-bill), then any few-shot examples, then the invoice image(s), then a short task line, with the `responseJsonSchema` in the config. This matches "prompt after image" and "instructions after data", and keeps the stable part first for implicit caching.
- Few-shot with an example invoice image costs about 1120 tokens per example image at `high`, plus its gold JSON. Two or three examples plus the rules would cross the 4,096-token implicit-cache minimum, so the prefix would be cached and largely discounted on 3.8 Flash. The examples should target the observed confusions: a 2-rate VAT receipt, a "Fr." invoice, a period-dated invoice, a gross-price column. The accuracy effect of image few-shot on Gemini 3.x is unmeasured.
- Google's "concise prompt" warning argues against long rule lists. Pushing rules into schema `description` fields and enums puts them in front of the constrained decoder at the point of use.

### Gaps
- No official Google document-understanding page for 3.5 / 3.8 with invoice-specific prompting (the image page has no OCR section).
- Implicit-cache minimum for 3.5 Flash-Lite and the exact cached-token discount rate on the official pricing page were not retrieved.
- No published measurement of few-shot-with-images gains for Gemini 3.x extraction.

## 7. Batch / Flex / Priority tiers for an interactive scan

### Takeaway
Flex (launched 1–2 Apr 2026) halves the price but adds latency and lowers reliability, which makes it unsuitable for the interactive scan. It could fit a background re-verification. Priority costs 75–100% more for lower latency and protection from preemption at peak. It is limited to Tier 2/3 paid projects and falls back to Standard when over quota. Batch is asynchronous and irrelevant for an interactive scan. No latency numbers are published for either tier.

### Cited Findings
- Flex: "Pay half the price of the Standard API by downgrading criticality of your request (making them less reliable, and adding latency)". It is synchronous, unlike Batch, and available on GenerateContent and Interactions for all paid tiers. Priority keeps traffic from being preempted "even during peak platform usage". The served tier is reported in the `x-gemini-service-tier` header — [Google blog: Flex and Priority inference](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-flex-and-priority-inference/)
- Priority is priced 75–100% above Standard, limited to Tier 2/3, and the docs list Gemini 3.5 Flash as supported — [Priority inference docs](https://ai.google.dev/gemini-api/docs/interactions/priority-inference?authuser=1&hl=en) (via search summary). Over-quota Priority requests fall back to Standard — [secondary report](https://www.pulse.bot/ai/news/new-ways-to-balance-cost-and-reliability-in-the-gemini-api-ca097287-2891-4d47-b615-d7ffdd14a512/)
- The changelog dates Flex and Priority to 1 Apr 2026 — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
- 3.5 Flash-Lite supports Standard, Flex and Priority pay-as-you-go, Batch inference and Provisioned Throughput (Vertex) — [Cloud 3.5 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)

### Inferences
- Interactive scan: Standard tier. Priority only if peak-hour latency or 429s are observed, and its +75–100% matters little given about $0.01 per invoice.
- Flex could suit an **asynchronous audit read**, for example a 3.8 Flash `high` re-read after the brewer has already seen the fast result, flagging discrepancies later. That keeps the slow, expensive "high thinking" pass out of the interactive path at half price.

### Gaps
- No published latency figures for Flex or Priority. Priority support for 3.8 Flash and 3.5 Flash-Lite on the Gemini Developer API (as opposed to Vertex) was not confirmed in a fetched page.
