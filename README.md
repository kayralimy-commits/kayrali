# Kayrali

Marketing site for Kayrali, a saree and lehenga rental boutique in Kelana Jaya,
Petaling Jaya. Live at https://www.kayrali.com.

Static site, no build step. Deployed on Cloudflare Workers (static assets) from
`main`; every push to `main` goes live.

## Structure

```
index.html        Single landing page, JSON-LD (ClothingStore, FAQPage), OG tags
css/style.css     All styles. Tokens at the top (rust, gold, cream on rust-black)
js/main.js        Loader, smooth scroll (Lenis), scroll motion (GSAP), cursor, nav
js/silk.js        WebGL silk shader behind the hero (Three.js, ES module)
images/           Logos, favicons, kolam.svg (the motif), og-cover.png
robots.txt        Allows all, points to sitemap.xml
sitemap.xml       One URL
wrangler.jsonc    Cloudflare Workers assets config
```

Libraries are loaded from CDNs with pinned versions (GSAP 3.12.5 and
ScrollTrigger from cdnjs, Lenis 1.1.18 and Three 0.170.0 from jsdelivr).
If any of them fail to load the page still renders and scrolls normally.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000. The shader needs a real origin, so open it
via the server rather than as a file.

## Editing content

- Copy, collection cards, FAQ, address and hours are all in `index.html`.
  The FAQ answers are duplicated in the JSON-LD block at the top; keep both in sync.
- WhatsApp number and prefilled messages are in the `wa.me` links.
- To swap the collection swatches for real photos, replace each `.swatch`
  div with an `<img>` of the same aspect ratio (3:4).
- `prefers-reduced-motion` turns off the loader, shader, smooth scroll and cursor.
