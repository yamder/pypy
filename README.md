**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

**Supabase**

The app can connect to Supabase for database, auth, storage, and realtime. Get the values from your Supabase project: **Project Settings → API** (Project URL and Publishable/anon key).

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Copy `.env.example` to `.env.local` and fill in the placeholders. The publishable (anon) key is safe to use in the browser when Row Level Security (RLS) is enabled on your tables; enable RLS for any tables this app will access. **On Vercel:** after adding these env vars, trigger a **Redeploy** (Deployments → latest → ⋯ → Redeploy) so the new build includes them.

This setup only connects the app to Supabase; campaigns, notifications, and auth still use Base44 until those features are migrated.

Run the app: `npm run dev`

**Deploy to GitHub Pages**

1. In the repo on GitHub: **Settings → Pages → Build and deployment**: Source = **GitHub Actions**.
2. **Add Supabase secrets** (required for login/signup in production): **Settings → Secrets and variables → Actions → New repository secret**. Add:
   - `VITE_SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
3. Push to `main`; the workflow builds and deploys with these env vars. The site will be at `https://<username>.github.io/pypy/` (or your custom domain). For a different repo name, edit `VITE_BASE_PATH` in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
