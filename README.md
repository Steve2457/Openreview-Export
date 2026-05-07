<p align="center">
  <img src="logo/logo.png" alt="OpenReview Export logo" width="108" />
</p>

<h1 align="center">OpenReview Export</h1>

<p align="center">
  <b>English</b>
</p>

<p align="center">
  One-click export of <code>openreview.net</code> forum reviews to clean, well-structured Markdown files.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/njebpcgdkmphbnchmaapbphcidhcacag">
    <img src="https://img.shields.io/badge/Chrome-Available-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Available" />
  </a>
  <img src="https://img.shields.io/badge/OpenReview-8B1A1A?logo=openaccess&logoColor=white" alt="OpenReview" />
  <img src="https://img.shields.io/badge/Format-Markdown-000000?logo=markdown&logoColor=white" alt="Markdown" />
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/njebpcgdkmphbnchmaapbphcidhcacag">
    <img src="logo/chrome.png" alt="Chrome Logo" width="48" />
  </a>
</p>

---

## Why Choose OpenReview Export?

- One-click export of official reviews from any OpenReview forum page into a clean Markdown file.
- Automatically structures review content — paper title, reviewer info, scores, strengths/weaknesses, and full review text.
- Preserves mathematical formulas, converting MathJax and KaTeX rendering into standard LaTeX notation (inline `\(...\)` and display `\[...\]`).
- Intelligent field partitioning — short fields (ratings, confidence, recommendation) are grouped separately from long-form review text.
- Robust fallback scraping — if structured parsing fails, the extension still captures visible review content from the DOM.
- Runs entirely locally — no account required, no data sent anywhere. Reviews are saved directly to your disk.

## Quick Start

1. Go to [Chrome Web Store](https://chromewebstore.google.com/detail/njebpcgdkmphbnchmaapbphcidhcacag) to install **OpenReview Export**
2. Open any OpenReview forum page, e.g., `https://openreview.net/forum?id=XXXX`
3. Look for the **"Export Review"** button at the bottom-right corner of the page
4. Click it — the extension will scroll to load all reviews, parse them, and download a `.md` file

> Make sure you are logged into OpenReview and the reviews are visible on the page. The extension reads what's rendered in the browser.

## Core Capabilities

### Structured Markdown Export

The exported Markdown file includes:

- **Paper title** as the top-level heading
- **Review heading** with reviewer signature (e.g., "Official Review", "Official Meta-Review")
- **Scores & short fields** — rating, confidence, recommendation, soundness, presentation, contribution, etc.
- **Review text** — summary, strengths, weaknesses, questions, limitations, rebuttal, ethics concerns, and more
- **Metadata** — Note ID for reference

### Math Formula Preservation

Mathematical notation is preserved in LaTeX format:

- MathJax-rendered formulas → `\(...\)` (inline) or `\[...\]` (display)
- KaTeX-rendered formulas → `$...$` or `$$...$$`
- MathML fallback parsing for complex expressions

### Robust Parsing

- **Primary parser**: Extracts structured review data from OpenReview's DOM, matching what you see while logged in
- **Fallback scraper**: If structured parsing fails, captures all visible review text from the page
- Both paths produce a valid Markdown download

### SPA-Aware

OpenReview is a single-page application. The extension:

- Detects route changes (pushState, popState, hash changes)
- Shows/hides the export button based on whether you're on a forum page
- Monitors DOM mutations and visibility changes to keep the button available

## Privacy

- The extension works entirely locally in your browser.
- No data is collected, transmitted, or stored externally.
- Reviews are parsed from the page DOM and saved directly to your local disk as Markdown files.
- No account registration or additional configuration required.

## FAQ

<details>
<summary><strong>Why is the Export button not showing up?</strong></summary>

The button only appears on OpenReview forum pages with an `?id=` parameter (e.g., `openreview.net/forum?id=XXXX`). Make sure you are on a paper forum page, not the main venues listing or other pages.

</details>

<details>
<summary><strong>Some reviews are missing from the export?</strong></summary>

The extension scrolls the page to trigger lazy-loaded reviews. If the page hasn't finished loading all replies, wait a moment and try again. For very long discussion threads, you may need to manually scroll down first.

</details>

<details>
<summary><strong>Why are math formulas not rendered correctly in my Markdown editor?</strong></summary>

The extension exports formulas in LaTeX notation (`\(...\)` / `\[...\]`). Make sure your Markdown viewer or editor supports LaTeX math rendering (e.g., VS Code with Markdown+Math extension, Typora, Obsidian, or Jupyter notebooks).

</details>

<details>
<summary><strong>Can I export reviews for papers I don't have access to?</strong></summary>

The extension can only export what's visible to you in the browser. If a review requires specific permissions to view, you'll need to be logged in with the appropriate account.

</details>

## Support and Feedback

If you encounter a bug, have a feature request, or find a paper whose reviews don't export correctly, please open an issue on the [GitHub repository](#).

If this plugin saves you time during paper review season, consider giving it a ⭐ Star on GitHub — it helps more researchers discover the tool!
