# DEVER Admin Dashboard

The authenticated administration workspace for FU-DEVER Club. It is used to provision members, maintain club structure, and manage public content shown across the DEVER platform.

## Related services

| Service | Repository | Production |
| --- | --- | --- |
| Landing page | [fu-dever-landingpage](https://github.com/fudever-club/fu-dever-landingpage) | [Open](https://fu-dever-landingpage-v2.vercel.app) |
| Member portal | [dever-client](https://github.com/fudever-club/dever-client) | [Open](https://dever-client-sigma.vercel.app/vi/sign-in) |
| Admin dashboard | [dever-admin](https://github.com/fudever-club/dever-admin) | [Open](https://dever-admin-three.vercel.app/vi/sign-in) |
| Backend API | [dever-backend](https://github.com/fudever-club/dever-backend) | [Open](https://dever-backend-production.up.railway.app/health) |

## Key flows

- Administrators create member accounts manually or from CSV data. The API creates one-time temporary credentials; users never choose an admin role in the UI.
- Manage member metadata, departments, positions, majors, projects, albums, events, resources, Project Lab entries, and alumni content.
- Review per-row CSV outcomes before sharing a created member's one-time credential.

## Tech stack

Next.js 14 App Router, TypeScript, Ant Design, Redux Toolkit Query, and `next-intl` (Vietnamese, English, and French).

## Run locally

Requires Node.js 20+ and a running DEVER backend.

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev -- -p 3003
```

Set the following in `.env.local`:

```env
NEXT_PUBLIC_API_SERVER=http://localhost:5000
NEXT_PUBLIC_ASSETS_URL=http://localhost:5000/static
```

Open [http://localhost:3003/vi/sign-in](http://localhost:3003/vi/sign-in).

## Quality checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Security notes

This UI is not an authorization boundary. Every mutation must remain protected by the backend with a current administrator role check. Never commit secrets, generated credentials, or exported member data.
