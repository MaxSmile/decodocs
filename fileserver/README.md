## DecoDocs Fileserver Ansible Setup

This directory contains a minimal Ansible setup for `storage.decodocs.com`:

- SSH key: `./the_keys/id_rsa`
- SSH user: `root`
- Fileserver TLS port: `8443` (port `443` is not touched)
- Nginx reverse proxy in front of the fileserver app
- Certbot provisioning and renewal for TLS certificates

### Files

- `ansible.cfg`: local Ansible defaults
- `inventory.ini`: host and SSH settings
- `group_vars/all.yml`: domain, upstream, and certbot settings
- `setup-fileserver.yml`: provisioning playbook
- `templates/storage.decodocs.com.conf.j2`: Nginx site template

### Usage

Run from this directory:

```bash
ansible-playbook setup-fileserver.yml
```

### Notes

- The playbook configures Nginx on `8443` and keeps `443` untouched.
- `80` is used for ACME HTTP challenge and redirects traffic to `https://$host:8443`.
- Cloudflare origin rule should preserve host and SNI and rewrite destination port to `8443`.
