# Deploy checklist

## 1. GitHub
Create a repository named `ejazati` and upload the contents of this folder.

Recommended branches:
- `main` → production
- `beta` → owner testing

## 2. Cloudflare Workers
Workers & Pages → Create → Import a repository → choose `ejazati`.

Use Workers Static Assets. The repository already contains `wrangler.jsonc`.

Production branch: `main`.

Preview URLs are enabled. Use the beta branch / preview deployment for owner testing.

## 3. First account
Before sharing the URL, create your own account first.
The first authenticated Ejazati account claims the one-time Owner role.

## 4. Supabase redirect URLs
After Cloudflare gives you the final URL, add it to:
Authentication → URL Configuration → Redirect URLs.

This is needed for password-recovery emails to return to Ejazati.

## 5. Recommended security setting
In Supabase Auth security settings, enable leaked-password protection when available for your plan.

## 6. Release flow
Develop on beta → test Preview → approve in Owner panel → merge beta into main → Cloudflare production deploy → record release as published.
