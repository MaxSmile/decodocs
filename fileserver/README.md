## DecoDocs Fileserver — Ansible Provisioning

One-command provisioning of a production-ready **MinIO** (S3-compatible)
object storage server behind **Nginx** with **Let's Encrypt** TLS on
`storage.decodocs.com`.

### Why MinIO?

DecoDocs needs an S3-compatible object store for PDF documents and
artifacts.  The project architecture (see `docs/ARCHITECTURE.md`) defines
two options:

1. **Contabo Object Storage** — managed S3-compatible buckets.
2. **Storage VPS + MinIO** — self-hosted S3-compatible storage on a VPS.

This playbook implements option 2.  MinIO was chosen because it:

- Exposes a **full S3 API** — the web/mobile apps use standard AWS SDK
  calls (`PutObject`, `GetObject`, pre-signed URLs) with zero custom code.
- Runs as a **single static binary** (no JVM, no Docker required).
- Supports **private buckets by default** and **short-lived pre-signed
  URLs** — matching the project's security policy (see `docs/SECURITY.md`).
- Can be migrated to Contabo Object Storage (or any S3 provider) later by
  changing only the endpoint URL and credentials in the application config.

### How it fits the DecoDocs architecture

```
  Client (browser / mobile)
      │
      │  HTTPS (pre-signed URL)
      ▼
  Cloudflare  ──  DNS proxy, caches nothing (S3 pre-signed URLs are unique)
      │
      │  Origin rule: rewrite destination port → 8443, preserve Host & SNI
      ▼
  Nginx (this VPS, port 8443)
      │
      │  reverse proxy, TLS termination (Let's Encrypt)
      │  proxy_buffering off (streaming uploads/downloads)
      ▼
  MinIO (localhost:9000)
      │
      │  S3 API — validates signature, serves/stores objects
      ▼
  /opt/minio/data   (on-disk storage)
```

**Key rule:** Clients never see MinIO credentials.  The VPS backend
(AI decode service, not part of this repo) generates short-lived
pre-signed URLs and hands them to clients.  MinIO validates the
signature embedded in the URL and serves or accepts the object.

### What gets installed

| Component  | Purpose |
|------------|---------|
| **MinIO**  | S3-compatible object storage server (binary at `/usr/local/bin/minio`) |
| **mc**     | MinIO command-line client (for bucket management, at `/usr/local/bin/mc`) |
| **Nginx**  | TLS reverse proxy — `storage.decodocs.com:8443` → `127.0.0.1:9000` |
| **Certbot**| Automatic Let's Encrypt certificate provisioning and renewal |
| **UFW**    | Firewall rule ensuring port `8443/tcp` is open |

### File layout

```
fileserver/
├── ansible.cfg                          # Ansible defaults (inventory path, Python)
├── inventory.ini                        # Target host & SSH settings
├── setup-fileserver.yml                 # ★ Main provisioning playbook
├── .gitignore                           # Excludes SSH key, credential file, retry files
├── group_vars/
│   ├── all.yml                          # Domain, ports, bucket name
│   └── vault.yml                        # MinIO credentials (plain YAML)
├── templates/
│   ├── storage.decodocs.com.conf.j2    # Nginx vhost (HTTP redirect + HTTPS proxy)
│   ├── minio.env.j2                     # /etc/default/minio environment vars
│   └── minio.service.j2                # systemd unit for MinIO
└── the_keys/                            # SSH keys (gitignored — never committed)
    ├── id_rsa
    └── id_rsa.pub
```

### Configuration reference

**`group_vars/all.yml`** — non-secret settings:

| Variable | Default | Purpose |
|----------|---------|---------|
| `fileserver_domain` | `storage.decodocs.com` | Nginx `server_name` and Certbot domain |
| `fileserver_tls_port` | `8443` | Nginx HTTPS listen port (443 stays untouched) |
| `enable_certbot` | `true` | Set `false` to skip Let's Encrypt (uses snakeoil cert) |
| `certbot_email` | `ops@decodocs.com` | Renewal failure notifications |
| `minio_api_port` | `9000` | MinIO S3 API port (localhost only) |
| `minio_console_port` | `9001` | MinIO web console port (localhost only) |
| `minio_data_dir` | `/opt/minio/data` | On-disk object storage path |
| `minio_default_bucket` | `decodocs` | Auto-created bucket (private, no anonymous access) |

**`group_vars/vault.yml`** — secrets (plain YAML):

| Variable | Purpose |
|----------|---------|
| `minio_root_user` | MinIO admin username |
| `minio_root_password` | MinIO admin password (use a strong random string) |

### First-time setup

1. **Place your SSH key** in `the_keys/id_rsa` (already gitignored).

2. **Create the vault file** with your MinIO credentials:

   ```bash
   # Create or edit group_vars/vault.yml and set:
   # minio_root_user
   # minio_root_password
   ```

3. **Run the playbook** (from this directory):

   ```bash
   ansible-playbook setup-fileserver.yml
   ```

### What the playbook does (in order)

1. **System packages** — installs Nginx, Certbot, UFW, curl, ssl-cert.
2. **Firewall** — opens port `8443/tcp` via UFW (no other ports are touched).
3. **MinIO install** — creates `minio` system user/group, downloads the
   MinIO server binary and `mc` client to `/usr/local/bin/`, deploys the
   systemd unit and environment file, starts the service.
4. **Health check** — waits up to 60 s for MinIO's `/minio/health/live`
   endpoint to return 200.
5. **Default bucket** — creates the `decodocs` bucket with `mc` and sets
   anonymous access to `none` (private).
6. **Nginx vhost** — renders `storage.decodocs.com.conf.j2` into
   `sites-available`, symlinks it into `sites-enabled`.  Validates config
   with `nginx -t` before starting.
   - **Shared-Nginx safe:** the playbook never removes `default` or any
     other site configs.  If the symlink target already exists and is not
     a symlink, the playbook fails rather than silently overwriting.
7. **TLS bootstrap** — the first Nginx config uses the Ubuntu snakeoil
   certificate so Nginx can start before Certbot has run.
8. **Let's Encrypt** — Certbot obtains a certificate via HTTP-01 challenge
   (port 80, `/.well-known/acme-challenge/`).  Once obtained, Nginx is
   re-rendered with the real cert and reloaded.
9. **Auto-renewal** — a cron job runs `certbot renew` daily at 03:13 and
   reloads Nginx on success.
10. **Smoke test** — verifies MinIO is reachable through
    `https://127.0.0.1:8443/minio/health/live` (self-signed OK).

### Idempotency and recovery

The playbook is **fully idempotent** — safe to re-run at any time against
a running server or a fresh VPS.  To rebuild from scratch:

1. Spin up a fresh Debian/Ubuntu VPS on Contabo (or any provider).
2. Point DNS for `storage.decodocs.com` to the new IP (via Cloudflare).
3. Place the SSH key and run the playbook.

**Data lives in `/opt/minio/data`.** Back this directory up if you need
to preserve stored files (e.g. via a cron-based `rsync` or snapshot).

### Accessing the MinIO Console

The MinIO web console binds to `127.0.0.1:9001` only — it is **never**
exposed to the internet.  Access it via SSH tunnel:

```bash
ssh -L 9001:127.0.0.1:9001 root@storage.decodocs.com
# Then open http://localhost:9001 in your browser
```

Log in with the credentials from `vault.yml`.  The console lets you
browse buckets, view objects, manage access policies, and check server
metrics.

### Network and port layout

| Port | Listener | Purpose |
|------|----------|---------|
| `80` | Nginx | ACME HTTP-01 challenge + redirect to `https://$host:8443` |
| `8443` | Nginx | TLS termination, reverse proxy to MinIO (only port exposed via UFW) |
| `9000` | MinIO | S3 API (localhost only — never directly exposed) |
| `9001` | MinIO | Web console (localhost only — SSH tunnel access) |
| `443` | — | **Not used** — left free for other services on this VPS |

### Cloudflare configuration

The DNS record for `storage.decodocs.com` should be **proxied** (orange
cloud) through Cloudflare.  Add an **Origin Rule** in the Cloudflare
dashboard:

- **When:** hostname equals `storage.decodocs.com`
- **Then:** rewrite destination port to `8443`

This lets clients connect on the standard `443` while Cloudflare forwards
to the actual listen port.  Make sure **"Preserve Host header"** is
enabled so the Nginx `server_name` match works correctly.

### Nginx template nuances

The template (`storage.decodocs.com.conf.j2`) has several MinIO-specific
settings worth understanding:

- **`proxy_buffering off` / `proxy_request_buffering off`** — critical
  for MinIO.  Without this, Nginx would buffer entire uploads into temp
  files before forwarding, causing timeouts on large PDFs and doubling
  disk I/O.
- **`chunked_transfer_encoding on`** — allows streaming multipart
  uploads without knowing the content length up-front.
- **`proxy_set_header Connection ""`** — keeps the upstream connection
  alive (HTTP/1.1 keepalive) between Nginx and MinIO, reducing latency
  for sequential requests.
- **`client_max_body_size 100m`** — the maximum file upload size.
  Increase this if the project needs to accept files larger than 100 MB.
- **`proxy_set_header X-Forwarded-Proto https`** — hardcoded to `https`
  because all external traffic arrives via TLS.  MinIO uses this to
  generate correct pre-signed URL schemes.
- **HSTS header** — tells browsers to always use HTTPS for this domain.

### Security notes

- **Private buckets only** — the playbook sets `mc anonymous set none`
  on the default bucket.  All object access requires a valid pre-signed
  URL or MinIO credentials.
- **Credentials file** — `minio_root_user` and `minio_root_password`
  are read from `group_vars/vault.yml` (plain YAML in this setup).
- **SSH key gitignored** — `the_keys/id_rsa` is excluded from version
  control by `.gitignore`.
- **Console not exposed** — the MinIO web console binds to `127.0.0.1`
  only, accessible exclusively via SSH tunnel.
- **MinIO runs as unprivileged user** — the `minio` system user has
  `nologin` shell and owns only `/opt/minio/data`.

### Relationship to `infra/` planned structure

The `infra/README.md` describes a future multi-role Ansible layout
(`/infra/ansible/roles/common`, `docker`, `reverse_proxy`, etc.).  This
fileserver directory is the **first concrete Ansible implementation** in
the project.  When the broader infra is built out, the tasks here can be
refactored into roles, but for now it works as a self-contained playbook
that can provision the storage layer independently.
