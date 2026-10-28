# Kin Autopilot

**Kin Autopilot** is TalentKit’s job-search → apply pipeline. The TalentKit web app is the control plane; the [Chrome extension](https://github.com/taskclan/talentkit) (`talentkit-extension`) is the in-browser apply executor. Orchestration lives in [taskclan-engine](https://github.com/taskclan/taskclan-engine) (`/api/naijacv/agent/*`).

This repository is a **clean-room** public surface: docs + a thin TypeScript SDK. It does **not** contain ApplyPilot (or any other AGPL) source.

> Pipeline *ideas* (discover → enrich → score → tailor → cover → auto-apply) were inspired by the open-source [ApplyPilot](https://github.com/Pickle-Pixel/ApplyPilot) project. Kin Autopilot reimplements that shape on Taskclan APIs and your Chrome session — no vendored AGPL code, no Claude Code CLI sidecar, no Playwright MCP in the cloud.

## Stages → Kin homes

| Stage | Kin Autopilot |
|-------|----------------|
| 1 Discover | Engine scout / job catalog |
| 2 Enrich | Job detail + JD fetch |
| 3 Score | Match scores (`/agent/matches`) |
| 4 Tailor | `tailorKit` + Apply with Kin |
| 5 Cover letter | Career kit / coach |
| 6 Auto-apply | Chrome extension (click Apply → fill → Next → Submit) |

Control plane: TalentKit web → `/autopilot/kin-autopilot`  
Executor: extension polls `GET /extension/queue`, reports via `POST /extension/queue`

## Architecture (v1)

```
TalentKit web ──► engine Autopilot runner (cron)
                      │  auto_mode + extension heartbeat + quota
                      ▼
              extension_queued applications
                      │
Chrome extension ─────┴──► open URL → Apply → fill → advance → report
```

Credits / plan gates still enforce apply quota. If the extension has not polled recently, Autopilot pauses enqueue (`autopilot_paused=extension_stale`).

## TypeScript SDK

Thin client for extension workers and future desktop agents:

```bash
npm install @taskclan/kin-autopilot
# or copy sdk/ from this repo
```

```ts
import { createAutopilotClient } from "@taskclan/kin-autopilot";

const client = createAutopilotClient({
  baseUrl: "https://engine.taskclan.com/api/naijacv",
  token: process.env.TALENTKIT_EXTENSION_TOKEN!,
});

const queue = await client.getQueue();
for (const item of queue.items) {
  // …open item.job.url in Chrome, fill, then:
  await client.reportQueue({
    applicationId: item.application_id,
    status: "submitted",
    note: "Filled and submitted via Kin Autopilot",
  });
}
```

See [`sdk/`](./sdk/) for types and methods (`getQueue`, `getFillData`, `reportQueue`, `match`, `answer`).

## What we deliberately do not do

- Shell out to Claude Code CLI from TalentKit Cloud
- Run Playwright MCP in Heroku/Cloud against user LinkedIn
- Vendor ApplyPilot Python into `taskclan-engine` or this repo

## License

MIT (Taskclan). ApplyPilot remains AGPL upstream; cite it as inspiration only — do not copy its source into this tree.
