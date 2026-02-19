# DecoDocs (Nested Repository)

DecoDocs is an AI-powered document understanding workspace.

This folder is a nested independent git repository that remains physically inside the Firebase umbrella repo for deployment convenience.

## Start Here

- Documentation hub: `docs/README.md`
- Product definition: `docs/PRODUCT.md`
- Current status: `docs/STATUS_SUMMARY.md`
- Roadmap: `docs/ROADMAP.md`
- Engineering tasks: `TODO.md`

## Subprojects

- `web/` - DecoDocs website/app build deployed as static hosting output
- `admin/` - internal admin portal for runtime config docs
- `docs/` - canonical product/architecture/api/deployment docs
- `fileserver/` - MinIO/fileserver provisioning and ops runbooks
- `infra/` - infrastructure assets and notes
- `mobile/` - mobile app docs and planning

## Documentation Policy

- Canonical specs live in `docs/`.
- Task tracking lives in `TODO.md` and `admin/TODO.md`.
- App-specific setup/run instructions live in each app README.
- Snapshot/planning docs should not replace canonical docs; merge durable decisions into `docs/`.

## Config Policy (No `.env*` Files)

- This repo does not use `.env`, `.env.local`, `.env.production`, or similar env files.
- Do not add dotenv-based loading to app/runtime code.
- Configuration must come from platform environment (CI/runtime/shell) or Firestore admin config documents.

## Core Product Positioning

DecoDocs focuses on understanding before signing:
- explain complex documents in plain language
- identify risks and unclear obligations
- support edits, collaboration, and optional signing workflows

## Related Umbrella Repo Docs

From repository root:
- `README.md` - Firebase umbrella overview
- `docs/README.md` - documentation governance model
- `DOCS_INDEX.md` - curated index of Markdown docs
