# PurpleXPurple – portfolio / link hub

A tiny personal page that shows off all my links, bio, and contact info—all pulled automatically from my Linktree. Honestly, I built this because I wanted something a little more customizable than just sending people to linktr.ee/PurpleXPurple. It's just HTML, CSS, and JavaScript, nothing fancy, but it's mine.

## how it works

1. You open the page.
2. The JavaScript fetches my Linktree profile via a proxy (allorigins).
3. It grabs the bio, extracts every external link from the page (skipping internal nav links and linktr.ee itself), and turns them into neat little cards with favicons.
4. The "Contact" section gets populated with the first WhatsApp link it finds.
5. Everything shows up with a nice purple gradient theme and some subtle animations. For some reason, I spent way too long getting that gradient shift animation right, but honestly? Worth it.

## tech stuff

- **HTML5** – structure, accessible semantic tags
- **CSS3** – flexbox, grid, animations, backdrop blur, gradient text, custom properties
- **JavaScript (vanilla ES6)** – fetch API, DOM manipulation, regex for link extraction

No build steps. No dependencies. You can serve it with any static server—or just open `index.html` in your browser, though you'll need to disable CORS or use a local server for the fetch to work (CORS headers from the proxy handle that).

## setup

1. Clone the repo.
2. Place a `logo.png` in the root directory (or change the `src` in `index.html`).
3. Run `npx serve .` or `python -m http.server` or just use VS Code's Live Server.
4. Open localhost and you're golden.

The code is intentionally minimalist and self-contained. The `LICENSE` file is the full GPLv3 text, but feel free to relicense your own fork under whatever terms you like—it's your project now.

## customizing

- The fetch target is `https://linktr.ee/PurpleXPurple` in `web.js`. Change that to your own Linktree URL and it'll just work.
- The favicon endpoint uses Google's s2 service. That's free and works pretty well, surprisingly.
- The proxy endpoint (`api.allorigins.win`) is rate-limited but fine for personal use. If you need something more reliable, consider setting up your own CORS proxy or using a different service.

## design choices (and why)

- Background uses two radial gradients with very low opacity. Gives a subtle glow without being distracting.
- The header has that glass-morphism look (backdrop blur + semi-transparent background) because it's 2024 and I have to, apparently. The part that annoyed me was getting the border transition smooth on hover—CSS transitions on `border-color` aren't instant and it caused a tiny jump, so I added `box-shadow` as a second layer to mask it.
- Link cards are on a grid that auto-fills based on available space. Small screens? They collapse. Big screens? They spread out. The `minmax(150px, 1fr)` approach is, for some reason, my favorite way to handle responsive grids without media queries.
- Animations are staggered. The first section fades in at 0.1s, the second at 0.25s, etc. Gives a nice waterfall effect when the page loads.

## license

GNU GPLv3 – see `LICENSE` for all the legal text. Short version: you can copy, modify, and distribute this freely as long as you keep it open-source under the same license. If you want to use it in a closed-source project, you'd need a different license—but I'm not your lawyer, so check with one if that matters to you.

## extra

The logo text is animated with a gradient shift that moves every 4 seconds. On hover, it flips to a solid color with a white glow. It's a tiny interactive detail that makes the page feel alive without being obnoxious. I actually think small touches like that matter more than huge flashy animations.

**Built with coffee, purple-themed emojis, and way too much time staring at CSS gradient syntax.**
