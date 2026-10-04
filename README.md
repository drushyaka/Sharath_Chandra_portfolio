# Sharath Chandra Thota — Photography Portfolio

Next.js 14 portfolio with static export. All images live in `public/images/`.

## Setup

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static export → out/
```

## Deploy to GitHub Pages

After `npm run build`, the `out/` folder contains the static site.  
Upload the contents of `out/` to your GitHub repo (rename `out/index.html` → root `index.html` at repo root).

Or use this GitHub Action — create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

## Project Structure

```
src/
  app/
    layout.tsx        # Root layout + metadata
    page.tsx          # Entry point
    globals.css       # All styles
  components/
    ClientRoot.tsx    # Page router + providers
    PortfolioContext.tsx  # Page state (home/postcards)
    Nav.tsx           # Navigation
    Hero.tsx          # Hero section
    PhotoGrid.tsx     # 7-photo masonry grid
    About.tsx         # About + portrait
    Locations.tsx     # Where I've shot
    Contact.tsx       # Contact section
    Footer.tsx        # Footer
    PostcardsPage.tsx # Full postcards page
    PostcardCard.tsx  # Individual flip card
    PostcardComing.tsx # Coming soon card
  data/
    content.ts        # All photo/postcard metadata
public/
  images/             # All photos (22 images)
```

## Adding new photos

Edit `src/data/content.ts` — add to `gridPhotos`, `antarcticaPostcards`, or `portoPostcards`.  
Drop the image into `public/images/`.
