# ScrapLink — Local Dev & Supabase Setup

This repo is a static front-end that can optionally use Supabase for storage and auth.

Quick setup

1. Copy `config.example.js` to `config.js` and fill `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2. Create a Supabase project and storage bucket named `avatars` (or change `DEFAULT_BUCKET` in `supabase.js`).
3. Optionally create a `posts` table with columns: `id` (uuid or int), `image_url` (text), `description` (text), `type` (text), `location` (text), `amount` (numeric), `uploader` (text), `created_at` (timestamp with time zone default now()).

What I changed

- Added `supabase.js` helpers for storage and posts table.
- Added `auth.js` for simple auth wrappers.
- Centralized credentials in `config.js` and added `.gitignore` to ignore it.
- Wired `profile.html`, `post.html`, `home.html`, and `view.html` to use Supabase when configured, with sensible localStorage fallbacks.

Security

- `SUPABASE_ANON_KEY` is for client use but keep it private.
- If you previously committed `config.js`, remove it from repo history.

Next steps (optional)

- Add server-side validation or edge functions.
- Improve UI for post details and pagination.
- Add unit tests and linting.

License: MIT

## Launch checklist

Before you publish the site, follow these steps to verify configuration, security, and behaviour.

- 1. Create `config.js` from `config.example.js` and fill values for `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- 2. Create a Supabase project and a storage bucket named `avatars` (or change `DEFAULT_BUCKET` in `supabase.js`).
- 3. Create the `posts` table (see migration snippet below) and consider adding an `image_storage_path` text column if you want to retain canonical storage paths for post images.
- 4. Confirm Supabase RLS policies for `posts` and `profiles` allow the intended client-side operations (or use server-side functions for restricted operations).
- 5. Verify CORS / allowed origins in Supabase so your hosted domain can use the anon key.
- 6. Run the local smoke tests (steps below) and verify cross-tab updates, signup/login avatar behavior, profile upload and cleanup, and posting flow.

## Local smoke tests

Run a simple static server and exercise the flows locally (Python is a quick option):

```powershell
# from the repo root
python -m http.server 8000
```

Smoke test steps:

- Open `signup.html` and sign up without uploading an image. Confirm `localStorage['profileData:anon']` contains a `pic` data-URL (initial avatar).
- Login with the new account via `login.html` and confirm `localStorage['profileData:<uid>']` includes the same `pic` (and `profileStoragePath` if you uploaded earlier).
- Upload a profile image on `profile.html` and verify the navbar image updates across tabs and the previous image (if any) was removed from storage (requires correct Supabase permissions).
- Post a scrap using `post.html`. Confirm the post appears in `view.html`, includes `uploader` and `uploaderPic`, and that `image_url` points to a public URL in the `avatars` bucket. Confirm `image_storage_path` is present in the local post object (if configured).

## Supabase setup checklist

- Create a Supabase project and copy the project URL and anon public key into `config.js`.
- Create a storage bucket called `avatars` and configure public access or signed URLs depending on your security model.
- Create `profiles` and `posts` tables. Example migrations exist in `migrations/`.
- Review Row Level Security (RLS) policies: Ensure only authenticated users can write their own `profiles` and only set `uploader_id` matching `auth.uid()` when inserting posts.

### Minimal DB migration (add image_storage_path)

If you want to store the storage path for post images, run a migration like:

```sql
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_storage_path text;
```

Add this as a migration or run it from the SQL editor in Supabase.

## Hosting & deployment

This is a static site, so any static hosting works. Common options:

- GitHub Pages: push to a repository and enable Pages.
- Netlify / Vercel: connect the repo and use their static hosting pipelines.
- Azure Static Web Apps or S3 + CloudFront: for more control.

When deploying, set your allowed origins in Supabase and ensure `config.js` on the deployed site contains the project URL and anon key.

## Post-launch notes

- Monitor storage usage and set a retention/cleanup policy if many images are uploaded. If you need server-side cleanup, implement a periodic job using a service role key (keep it server-side).
- Consider moving heavy image uploads to a dedicated `posts` bucket if you prefer separation from user avatars.
- Add telemetry (Sentry/LogRocket) and basic analytics to monitor errors and usage.

If you'd like, I can:

- Add a migration file to `migrations/` to add `image_storage_path`.
- Extract avatar helpers into a shared module to avoid duplication across pages.
- Prepare a short deploy guide for GitHub Pages/Netlify with exact steps.
