# Civic Lens (Prototype)

Makes local government visible, starting from your address: which bodies govern you, their upcoming meetings, and where each agenda item stands.

Wave 1 covers address-to-bodies lookup, the main three-column screen, body pages, and loading agendas with a checked import. Neighbor discussion (Wave 3) and "who represents you" (Wave 4) are not built yet.

## Set up
1. Create a NEW Supabase project for Civic Lens (separate from BallotBridge).
2. Turn on anonymous sign-ins (Authentication > Sign In / Providers).
3. Run `supabase/schema.sql`, then `supabase/seed-bodies.sql` in the SQL Editor.
4. Put the project URL and publishable key in `js/config.js`.
5. Load the sample agendas (see `tools/README.md`), or leave them empty and use the list.
6. Host the folder on GitHub Pages or any static host.

## Structure
    index.html          Shell: top bar, toasts, modal, one script tag
    css/                Tokens, base, layout, and components (shared with BallotBridge), plus civic.css
    js/
      app.js            Entry point: connects, routes, account corner
      routes.js         Route table
      config.js         Connection values, levels, stages
      state.js          Signed-in profile
      lib/              Supabase client, geocoder and point-in-boundary checks, route helpers
      services/         auth, bodies (all data reads)
      components/       Shared UI and toasts
      views/            welcome, address, home (three columns), body
    supabase/           Schema and seed
    tools/              Agenda import (uses the secret key on your computer only)
    data/agendas/       Agenda files (sample.json is sample data)
    data/boundaries/    Body boundary files (add these for address matching)

## Rules that keep it honest
- The stage shown is what the agenda says, labeled as such until it's checked against the official record.
- The address is never stored. Only the body ids you choose are saved.
- Visitors can only read agenda data. Only the import tool, with the secret key, writes it.
