Calorie Meter — Upgrade: Database + Recipes + Diary (2 AM boundary)
===================================================================

What this upgrade adds
----------------------
- Local **SQLite** database in the browser (via sql.js), persisted to OPFS (or localStorage as fallback).
- **Recipes**: create + search + list (weight-based, grams-only).
- **Add Entry**: choose a recipe → enter grams → logs a diary entry with frozen totals.
- **Today**: shows today's (2 AM → 2 AM) totals + list of entries.

How to install this upgrade (no coding)
---------------------------------------
1) Download this ZIP and unzip it.
2) On your GitHub repo page (calorie-meter-pwa) → **Add file → Upload files**.
3) Drag these to overwrite existing files/folders:
   - package.json
   - next-env.d.ts
   - tsconfig.json
   - next.config.js
   - app/ (folder)
   - lib/ (folder)  ← NEW
   - public/ (folder)
4) Commit changes. Vercel will redeploy automatically.
5) Open your app URL → Try:
   - Go to **Recipes → New Recipe**, create one (e.g., Paneer Bowl 1000 g, 1200 kcal, P 90, C 150, F 60).
   - Go to **Add** → search and select your recipe → enter grams (e.g., 320) → confirm.
   - Go to **Home** → you should see **Today's totals** and the entry (2 AM day boundary).

Notes
-----
- The database file is kept in the browser using OPFS when available; otherwise, it falls back to localStorage.
- We can add **Export/Import JSON** next for manual backup.
- Manual one-off food entries (without a recipe) can be added in the following update.
