# RedactMZ

A free, browser-based PDF redaction tool. Draw boxes over the parts of a document you want to hide, and download a clean copy — no uploads, no server, no account.

**Live →** [Redactmz.com](https://redactmz.com)

---

## Why I built this

I needed to redact sensitive info from PDFs before adding them to my portfolio, and went looking for a tool to do it. The options were surprisingly bad: paid services, or "free" ones that felt like a sketchy deal somewhere.

Most "free" PDF redaction tools online work by uploading your file to someone else's server, processing it there, and sending it back. For a tool whose entire purpose is hiding sensitive information, that's a strange trust model — you're handing the sensitive document to a third party just to black part of it out.

RedactMZ runs entirely in the browser. The PDF you open never leaves your machine; there's no backend, no upload step, and no network request involving your file at any point. It's also a small, readable codebase (plain JavaScript, no framework, no build step) that I built as a way to learn how PDF rendering, canvas drawing, and PDF generation actually work under the hood — rather than relying on a library that does all of it as a black box.

## How it works

1. You drop in a PDF, and [pdf.js](https://mozilla.github.io/pdf.js/) renders each page onto a canvas.
2. You draw rectangles over anything you want hidden — names, account numbers, photos, whatever.
3. On export, every page is rasterized (turned into a flattened image) with your redaction boxes baked permanently into the pixels, then reassembled into a new PDF using [pdf-lib](https://pdf-lib.js.org/).

That last step matters: simply drawing a black box _on top of_ existing PDF text doesn't actually delete the text underneath — it's still selectable and extractable by anyone who copies it or runs it through a text-extraction tool. RedactMZ avoids that trap by flattening each page to an image before re-exporting, so there's no text layer left to recover. The trade-off is that the exported PDF is no longer searchable or text-selectable anywhere, not just under the redacted areas — a reasonable cost for a tool whose job is making sure something is actually gone.

## Features

- Draw, preview, and remove redaction boxes per page
- Choose black, white, or any custom fill color
- Multi-page support with page navigation
- Drag-and-drop or file picker to load a PDF
- Entirely client-side — works offline once the page is loaded, no data ever transmitted

## Tech stack

- Vanilla JavaScript (ES modules), no framework, no build step
- [pdf.js](https://mozilla.github.io/pdf.js/) for rendering and reading PDFs
- [pdf-lib](https://pdf-lib.js.org/) for generating the redacted output
- Plain HTML/CSS

## Running it locally

Because the app uses ES module imports (`import`/`export`), you can't just double-click `index.html` and open it as a `file://` URL — browsers block module imports over the local filesystem for security reasons. You need to serve the folder over a local HTTP server. Any of these work:

```bash
# Option 1: Python (built into most systems)
python3 -m http.server 8000

# Option 2: Node, no install required
npx serve

# Option 3: VS Code
# Install the "Live Server" extension, right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8000` (or whatever port your tool prints) in your browser.

## Limitations

- Only works with PDFs that pdf.js can parse and render (standard PDFs; not encrypted/password-protected files without modification)
- Exported PDFs lose text-selection and search everywhere, not just behind redaction boxes, since pages are rasterized
- No OCR — if your "text" is actually an image of text, redacting requires drawing a box over the relevant pixels, same as any other content

## Contributing

Issues and pull requests are welcome. The codebase is intentionally small and dependency-light, so it should be easy to read top to bottom even if you're new to JavaScript.

## License

MIT — see [LICENSE](LICENSE) for details.
