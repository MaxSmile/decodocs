# TODO

## MCP-Markdown-RAG
- [ ] Design a local-first MCP markdown RAG engine for this repo (components, data flow, and security model)
- [ ] Select and wire a local vector store (e.g., SQLite/pgvector or similar) with an embedding pipeline for `/docs`, `/infra`, `/web`, `/ai`, and `/projects`
- [ ] Build ingestion: chunk markdown, embed, store metadata (path, headings, hashes, updated_at) and enable incremental re-index
- [ ] Expose retrieval for agents (MCP server or CLI endpoint) that returns ranked chunks + source paths
- [ ] Add validation: small suite to confirm ingest/retrieval works end-to-end and guards against stale indexes
- [ ] Document runbooks: how to ingest, query, and refresh the index locally

## Documentation structure and gaps
- [ ] Map ownership and “source of truth” per domain (product, web, infra, AI/pipelines, projects) and capture it in `docs/README.md`
- [ ] Normalize document structure (titles, headings, status/last-updated/owner front-matter) across `docs/` and `projects/`
- [ ] Run a gap pass: note missing sections or inconsistencies (product vs. roadmap vs. decisions; infra rules vs. actual setup; web architecture vs. code)
- [ ] Adopt the hybrid project structure: brief entries in `docs/ROADMAP.md` under an “External/Side Projects” section, with full detail + contacts/links in `projects/<name>/README.md` and indexed in `projects/README.md` (start with SMRT16 and Voice VPN)
- [ ] Ensure cross-references are accurate (links between roadmap, decisions, product, infra/web AGENTS) and remove duplicates/contradictions
- [ ] Write a concise changelog or doc-index so contributors know where to put updates and how to keep the info complete/consistent

## Monetization integrations (Gamezop + Qureka)
- [ ] Voice VPN: place Gamezop/Qureka surfaces at natural breaks (post-connect/disconnect), enforce frequency caps, and measure ARPU/retention impact
- [ ] Bella Chess: add rewarded/playable units between games or in menus; offer “watch/play to unlock hint/analysis” for free users; keep mid-game clean
- [ ] 2ul: design free tier with rewarded/interstitial units; offer paid “remove ads + perks”; add optional “engage to earn perks” loop
- [ ] 2ul desktop: implement Qureka web offer wall (https://cumbersome-vpn.web.app/api/ads/) at breakpoints; add a desktop-friendly CPA/native offer rail; instrument RPM/retention by device to avoid cannibalizing upgrades
- [ ] Traffic fit: confirm Gamezop/Qureka mobile vs. desktop RPMs and SDK/web support; document any mobile-only constraints
- [ ] Partner ops: add contacts/terms, revenue share, and reporting cadence for Gamezop and Qureka
