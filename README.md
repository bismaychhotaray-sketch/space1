# Orbital Watch — Cloudflare Free Deployment

This package is prepared for Cloudflare Pages with a server-side `/api/catalogue` Function. The browser never fetches CelesTrak directly, so the previous `LIVE CATALOGUE UNAVAILABLE` problem caused by `file://`/browser CORS is avoided.

## One-time deployment

1. Create a free GitHub account if needed.
2. Create a new empty repository, for example `orbital-watch`.
3. Upload the contents of this folder to that repository. **Do not upload the ZIP itself.**
4. Sign in to Cloudflare and open **Workers & Pages** → **Create application** → **Pages** → connect the GitHub repository.
5. Use:
   - Framework preset: `None`
   - Build command: `exit 0`
   - Build output directory: `.`
6. Click **Save and Deploy**.

Cloudflare will provide a `*.pages.dev` URL. Open that URL and the page will call `/api/catalogue` on the same site. The Function fetches real CelesTrak records, caches the merged catalogue for two hours, and returns only real objects.

## What is real-time

- Catalogue records are genuine CelesTrak GP/TLE records.
- Browser positions are recalculated with SGP4 from the current UTC time.
- No synthetic satellites, debris, or rocket bodies are generated.
- Catalogue refreshes are cached server-side for 2 hours to avoid repeatedly downloading large source groups.

If the upstream catalogue is temporarily unavailable after a successful load, the Function may return its last real cached catalogue marked stale. It never fabricates objects.
