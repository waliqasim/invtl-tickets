# INVTL Tickets

Free registration for INVTL shows, at **tickets.theinvtl.com**. A complete, separate website. It shares the same Supabase database as theinvtl.com, so events and registrations are the same everywhere.

## Pages

| Address | What it is |
|---|---|
| `tickets.theinvtl.com` | Every show that's open for registration (goes straight to it if only one is open) |
| `tickets.theinvtl.com/<event-slug>` | Registration page for one show, e.g. `/spooky-supercars` |
| `tickets.theinvtl.com/pass/<code>` | A guest's pass (private link, sent by email) |
| `tickets.theinvtl.com/pitlane` | Registrations dashboard (sign in with your Pitlane email and password) |

## Netlify environment variables

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as the main INVTL site |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as the main INVTL site |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as the main INVTL site (keep secret) |
| `NEXT_PUBLIC_SITE_URL` | `https://tickets.theinvtl.com` |
| `PITLANE_ADMIN_EMAILS` | Who can open the dashboard, comma-separated, e.g. `wali@theinvtl.com` |
| `RESEND_API_KEY` | From resend.com (for pass emails; the site works without it) |

## Database

`supabase/registrations.sql` has already been run. Nothing else to do there.
