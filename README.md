# WaterOps

WaterOps is a local operations workspace for ClearFlow Water Services. It organizes customers, water systems, service visits, measurements, source reports, and evidence-backed findings in one responsive interface.

## Run locally

Double-click `start.cmd`. The first launch installs dependencies when needed, starts WaterOps at `http://127.0.0.1:5173`, and opens it in the default browser.

Sign in with:

```text
Username: demo
Password: demo
```

Double-click `stop.cmd` to stop only the WaterOps process recorded by the launcher.

## Local data

The application is fully client-side. The session, editable workspace profiles, and finding decisions use separate versioned browser-storage keys. Signing out removes only the authentication session. Reports, visits, measurements, and source-document previews are read-only.

WaterOps Intelligence summaries and findings are produced from structured records with deterministic rules. The assistant panel does not contact a model provider until an API integration is configured.

## Development checks

```text
npm test
npm run test:e2e
npm run build
```
