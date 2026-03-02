# world — Mira Internal Operations Dashboard

Live at [world.mira.ml](https://world.mira.ml).

Access restricted to `@mira.ml` email addresses.

## Sections

| Section | Description |
|---|---|
| **Overview** | Service health, AWS costs, Anthropic costs, active clients, referral network pulse, recent CloudWatch alarms |
| **Clients** | All orgs with conversation stats, detail panel with notes and per-org feature flags |
| **Costs** | AWS Cost Explorer by service + daily trend; Anthropic API usage; per-org token attribution |
| **Prompts** | Edit AUTOFILL_001–008 prompts live (changes take effect in ≤5 minutes) |
| **Network** | D3 force-directed graph of agent-to-agent connections and referral counts |
| **Feature Flags** | Global and per-org feature flags with toggle UI |

## Tech stack

- React 19 + TypeScript (Create React App)
- Tailwind CSS (same design tokens as client-dashboard)
- Auth0 (`@auth0/auth0-react`)
- React Router v6
- Recharts (cost charts)
- D3 (network graph)

## API

All requests go to `https://api.mira.ml/world/*` via the `mira-world-api` Lambda (Python 3.12).

## Local dev

```bash
cp .env.example .env
# Fill in Auth0 credentials
npm install
npm start  # http://localhost:3013
```

## Deploy

CodePipeline deploys `build/` to S3 bucket `mira-world-frontend` → CloudFront distribution for `world.mira.ml`.
