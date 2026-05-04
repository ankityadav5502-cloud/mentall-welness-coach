# Mentall Wellness Coach

Vite + React + Supabase. Deploy on Vercel with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## PWA on iPhone (install to Home Screen)

1. Deploy or run the app over **HTTPS** (required for a proper install), e.g. your Vercel production URL.
2. In **Safari**, open the site, tap **Share** (square with arrow).
3. Tap **Add to Home Screen**, then **Add**.
4. Open the app from the new icon — it runs in **standalone** mode (minimal Safari UI).

After each deploy, Safari may pick up updates when the service worker refreshes; you can close the app fully and reopen, or clear site data if testing an old build.

Regenerate teal placeholder icons: `npm run generate:pwa-icons` (requires `sharp`).
