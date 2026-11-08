# JC efficiency and local storage report

This report compares JC’s current meal routing with its earlier Gemini-first approach. It measures request counts in a controlled replay and estimates token volumes from the text sent and returned. It also shows how to measure production usage accurately.

## Latest update

The floating glass navbar marks the active tab with a blue icon and label. Removing the selection background leaves one continuous glass surface at Home and Settings, where the selected tab meets the rounded edge. All four tabs retain centered icons, labels, and equal-width tap targets.

The navbar update adds **zero Gemini requests, zero tokens, and zero database bytes** compared with the immediately previous build. The Android export’s uncompressed JavaScript bytecode decreased from 5,135,812 to 5,135,412 bytes. That 400-byte difference applies to the exported bundle file.

## What saves requests

| Meal or action | Earlier Gemini-first path | Current path |
|---|---:|---|
| A plain food with an explicit weight and an approved database match | 1 request each time | 0 requests |
| A new or changed text meal | 1 request | 1 request on a cache miss |
| An exact repeat of a meal whose estimate was saved, at the same oil setting | 1 request each time | 0 requests on a hit |
| A recipe used for the first time | The serving is analyzed as part of the meal | 1 request to analyze the entire batch |
| A serving from a saved recipe | 1 request for a recipe-only meal | 0 requests |
| A saved recipe plus new free text | 1 request with the full description | Only the new text goes through the normal routing |

The cache normalizes case and whitespace and preserves wording, portions, punctuation, and the oil setting. For example, `rice with chicken` and `fried rice with chicken` have separate entries. An eligible Gemini estimate becomes reusable after the user saves it. Cache entries survive the seven-day meal-log cleanup. Each profile has a 200-entry cache that evicts the least recently used estimate when full.

An explicit Gemini refresh sends a request. Retry keys can send multiple HTTP attempts for one analysis. A fallback estimate produced after a failed Gemini request does not reverse the attempt already made. API-key rotation changes which credential sends an attempt, so it does not contribute to the savings calculation.

Home recalculates saved-recipe portions locally, even when the meal also includes newly analyzed food. Manual macro edits use the same calorie and macro calculation across meal, recipe, and target forms. Profile switching, day selection, and opening a saved meal or recipe are also local operations. The request estimate in Settings helps track quota use alongside these routing changes.

## Short- and long-run replay

The benchmark uses three meal logs per day and an initially empty cache. The schedule contains recurring breakfasts and lunches, three weekly meals with eligible plain weighed foods, three novel dinners each week, three recipe-only servings and one mixed recipe meal per week, and occasional oil changes. The optimized path analyzes one whole batch when the recipe is first used. Both paths process the same meal schedule and receive successful fixture responses.

The script runs the current Gemini prompt builder and text router with real in-memory SQLite and intercepts the Gemini HTTP transport. The baseline sends each full meal description through the Gemini service. The optimized path uses the current local matcher, cache, and recipe routing. This isolates savings from routing while keeping the same prompt builder in both runs. The checkpoints below are cumulative from day one.

| Horizon | Earlier requests | Current requests | Requests avoided | Request reduction |
|---|---:|---:|---:|---:|
| 1 day | 3 | 2 | 1 | 33.3% |
| 7 days | 21 | 16 | 5 | 23.8% |
| 30 days | 90 | 28 | 62 | 68.9% |
| 365 days | 1,095 | 174 | 921 | 84.1% |

The first week pays the setup cost for new text meals and the first recipe. The 30-day replay includes 37 text cache hits and 13 local calculations. The full-year replay includes 609 cache hits, 157 local calculations, and 208 uses of the saved recipe. Recipe uses overlap with other categories in mixed meals. The request totals in the table account for that overlap and for the one-time batch analysis.

## Token estimates

For input, the replay captures the text actually assembled by the Gemini service. For output, it uses compact JSON fixtures with a food-item count chosen for each meal. Both character totals are divided by four, following Google’s approximate English-text conversion. Figures are rounded independently. [Gemini token-counting documentation](https://ai.google.dev/gemini-api/docs/tokens)

| Horizon | Input before → after | Output before → after | Total before → after | Total avoided |
|---|---:|---:|---:|---:|
| 1 day | 2,221 → 1,484 | 220 → 171 | 2,441 → 1,655 | ≈787 (32.2%) |
| 7 days | 15,558 → 11,982 | 1,577 → 1,430 | 17,135 → 13,412 | ≈3,723 (21.7%) |
| 30 days | 66,680 → 20,923 | 6,750 → 2,453 | 73,430 → 23,376 | ≈50,054 (68.2%) |
| 365 days | 811,340 → 129,861 | 82,237 → 14,900 | 893,577 → 144,760 | ≈748,817 (83.8%) |

Most of the reduction comes from skipping entire requests. The baseline sends roughly 741 estimated input tokens per request on average. The optimized path still sends roughly 746 in this replay because new meals retain the same prompt, and the one-time batch request adds recipe instructions. The request-count and token-reduction percentages differ because the size of a Gemini response varies with the meal.

The fixture outputs, character conversion, and selected workload make these estimates rather than measured billing totals. Live model outputs, internal token usage, different languages, failures, and retries can change the result.

## How the savings vary

- **A regular meal.** If someone logs the same eligible saved text meal once a day for 30 days and it stays in the cache, one initial analysis replaces 30 calls. That avoids 29 requests, or 96.7%. Over 365 days at the same rate, it avoids 364 of 365 requests.
- **Simple weighed foods.** If all three daily meals match the strict local route, the app can avoid all three requests each day. This path currently covers a small set of plain foods.
- **Mostly new or edited meals.** If each meal has different wording, a different portion or oil level, or ingredients that require interpretation, the number of Gemini calls can stay close to the previous version.
- **Repeat recipes.** A batch analyzed once and logged as a recipe-only meal ten times uses one request across those ten logs. Changing the batch or requesting a fresh estimate can add calls.
- **Cache turnover.** A large variety of distinct descriptions can push older meals out of the 200-entry cache. Repeated descriptions save more when they are used often enough to stay cached.

For a separate planning estimate, multiply the number of meal logs by the fraction that can be served locally, and subtract any additional batch analyses or manual refreshes. For example, 90 monthly meals with a 50% local service rate avoid about 45 requests before those extra analyses. Use an observed rate from real use rather than the replay’s 84.1% for forecasting.

## Measured local storage

The storage benchmark uses the archived version-one schema for the original app and the current schema for JC today. Both one-profile cases have 24 sample meal logs. The current cases also include one recipe and seven days of usage counters. Measurements are for the main SQLite file after checkpointing, with 4 KiB pages. Android installation files, temporary journal files, and SecureStore are outside these measurements.

| Scenario | Database file | Increase over archived app |
|---|---:|---:|
| Archived app with settings and logs | 12 KiB | — |
| Current app with an empty meal cache | 72 KiB | 60 KiB |
| Current app with 27 representative cached meals | 84 KiB | 72 KiB |
| Current app with 200 representative cached meals | 168 KiB | 156 KiB |
| Current app with 200 entries at the cache’s payload limit | 484 KiB | 472 KiB |

In this run, the cache itself added **12 KiB** with 27 entries, **96 KiB** with 200 ordinary entries, and **412 KiB** in the full-cache stress test. The app caps each entry at 1,536 bytes, counting the estimate JSON and two copies of the normalized description. SQLite adds indexes and page overhead. The earlier rough 125–400 KB estimate was a planning range, and the stress test shows how disk allocation can exceed it.

Adding a second empty profile fit within already allocated pages. Filling that profile with the same 24 logs, one recipe, seven days of usage counters, and 27 cached meals raised the file from 84 to 96 KiB. Deleting it released three 4 KiB pages for SQLite to reuse. The allocated file remained at 96 KiB after deletion. Each profile’s cache stays capped, while saved recipes grow with the number of recipes kept.

## Reproduce and verify

Run these commands from the project root with Node 22.13 or later.

```powershell
npm install
node scripts/benchmark-gemini-savings.cjs
node scripts/benchmark-jc-storage.cjs
```

The Gemini replay prints request counts, input and output character counts, and how each meal was served. The storage benchmark prints file sizes and reusable page counts. Both run offline on sample data. The automated tests cover cache matching and eviction, profile isolation and deletion, database migration, Pacific-time quota rollover, retries, and structured daily quota rejections.

The latest update passed all 13 automated tests, TypeScript checking, and Android export. On a Samsung running Expo Go, all four tabs switched correctly. Home and Settings both showed the blue active icon and label against the continuous glass bar.

In the app, open **Settings → Gemini** for the seven-day on-device counters. They track actual attempts made by JC, including retries, along with cache hits and local calculations. The remaining-request number uses the device’s attempts and the entered daily limit, or JC’s starter planning budget. The [AI Studio rate-limit page](https://aistudio.google.com/rate-limit) shows the project’s limits.

For precise token savings, record the response’s Gemini `usageMetadata` for live requests, including any reported thinking tokens, and compare representative samples against a Gemini-first baseline. To project savings with paid usage, multiply avoided input and output tokens separately by the applicable rates. [Gemini token counts](https://ai.google.dev/gemini-api/docs/tokens) · [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
