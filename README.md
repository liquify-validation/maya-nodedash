# Maya Network – classic dashboard

MAYAChain node monitoring dashboard, served from the site root.

## Requirements

- Node.js 22.12 or later (or 20.19+)
- npm

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173/. The dashboard reads live data from `https://maya-api.liquify.com/maya/api`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm test` | Run the unit tests |
| `npm run typecheck` | Type-check without building |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |

## Deployment (nginx)

1. Build: `npm ci && npm run build`
2. Copy the contents of `dist/` to `/var/www/maya-classic` on the server.
3. Add the contents of `deploy/nginx.conf` to the dashboard's server block.
4. Test and reload nginx: `sudo nginx -t && sudo systemctl reload nginx`

For later releases, repeat steps 1 and 2. The config serves `index.html` uncached and the
fingerprinted files in `assets/` with long-term caching, so new builds take effect immediately.

The config sets a Content-Security-Policy. If the app needs to call another host, add it to
`connect-src` (API calls) or `img-src`/`font-src` as appropriate.

## Common changes

Most MAYAChain-specific settings are in `src/chain.ts`:

| Setting | What it controls |
| --- | --- |
| `API_BASE` | API host |
| `BASE_UNITS`, `UNIT` | CACAO base units (1e10) and the unit label |
| `CHAINS` | Chain columns shown on the active table (add an icon in `chainIcons` in `src/assets/index.ts`) |
| `explorer` | Explorer and node API links |
| `POSITION_CHART_MAX` | Y-axis maximum of the "Performance Over Time" chart |
| `REWARDS_AVG_DIVISOR` | Scaling of the rewards "Average / 100 Blocks" chart |
| `CHURN_IN_MIN_BOND` | Minimum bond for the "Churn In" label |
| `SHOW_BAD_REDLINE` | Whether the "Bad Redline" label is shown |

Other places:

| To change | Edit |
| --- | --- |
| ISP logos | `ispLogos` in `src/assets/index.ts` (image in `src/assets/isp/`) |
| Refresh interval | `REFRESH_MS` in `src/hooks/networkData.tsx` |
| Overview tiles | `src/components/dashboard/OverviewStats.tsx` |
| Table columns | `COLUMNS` in `src/components/dashboard/NodeTable.tsx` and the cells in `NodeRow.tsx` |
| Header logo | `src/components/layout/PageLayout.tsx` |

## Styles

Styles load in this order from `src/main.tsx`:

1. `src/styles/vendor/antd-v4-core.css`
2. `src/styles/global.css`
3. `src/styles/vendor/antd-v4-components.css`
4. `src/styles/app.css`

Make styling changes in `src/styles/app.css` (or `global.css`). Leave the `vendor/` files
unedited. Light and dark colours are CSS variables at the top of `app.css`.

## Project structure

```
src/
  chain.ts      MAYAChain-specific settings
  api/          API client and chart history loaders
  lib/          data transform, churn labelling, sorting and search (unit tested)
  hooks/        theme, favourites and data polling
  components/
    ui/         buttons, popovers, modals, selects, tables and icons
    charts/     chart components and chart option builders
    layout/     header, footer and loading spinner
    dashboard/  overview tiles, node table, toolbar and dialogs
  pages/        dashboard pages and the node report page
deploy/
  nginx.conf
```

Favourites are stored in the `myFavNodes` cookie and the theme in `localStorage` (`theme`).
