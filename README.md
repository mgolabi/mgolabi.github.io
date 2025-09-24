# Academic Personal Website — GitHub Pages Template

A minimal, accessible personal site for researchers (About, Education, Experience, Projects, Publications with JSON/BibTeX, Contact).

## Quick start

1. **Rename** the folder to `{yourusername}.github.io` for a user/organization site, or any repo name for a project site.
2. Replace placeholders in `index.html` (your name, links) and swap `assets/avatar.png` with your portrait.
3. Update `data/publications.json` with your publications (see schema below).
4. Commit and push to GitHub.

### Deploy on GitHub Pages

- **User/Organization site**: create a repo named `yourusername.github.io`. Push the project to the default branch. Pages will serve from the root automatically.
- **Project site**: push to any repo, then enable **Settings → Pages** and select the branch (e.g., `main`) and `/ (root)` folder.

This repo includes a `.nojekyll` file to disable Jekyll processing so that files like `assets/*` are served verbatim.

## Publications JSON schema

Create `data/publications.json` with either a bare array or an object with a `publications` array. Each entry roughly follows BibTeX fields:

```json
{
  "publications": [
    {
      "id": "smith2023",
      "type": "article",
      "title": "Title of the paper",
      "authors": ["First A.", "Second B."],
      "year": 2023,
      "venue": "Journal/Conference",
      "publisher": "Publisher (optional)",
      "volume": "",
      "number": "",
      "pages": "",
      "doi": "10.xxxx/xxxxx",
      "url": "https://…",
      "abstract": "(optional)",
      "bibtex": "@article{...}"
    }
  ]
}
```

If `bibtex` is omitted, the site generates a minimal entry automatically. Authors can be either an array or a comma/semicolon-separated string.

## Local development

Open the folder in VS Code. You can use the built-in Live Server extension (or similar) to serve the site locally so that `fetch('data/publications.json')` works.

## Customization tips

- Colors and spacing live in `css/styles.css` under the `:root` variables.
- Publications UI and loading logic live in `js/main.js`.
- Replace `assets/og-image.png` and `assets/favicon.ico` as desired.
- Add a `CNAME` file at repository root if you use a custom domain.

## License

MIT © 2025 Your Name
