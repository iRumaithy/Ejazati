# Architecture

GitHub (`beta` / `main`)
→ Cloudflare Workers Static Assets
→ Supabase Auth + Postgres/RLS

## Roles
- `owner`: user management + release registry
- `user`: own leave data only

## Release flow
1. Code pushed to beta
2. Cloudflare Preview URL
3. Owner tests
4. Owner marks release approved in Ejazati
5. Merge beta → main
6. Cloudflare production deploy
7. Owner records release as published
8. Installed PWA prompts each user before activating the new service worker
