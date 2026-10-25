# Tencent Cloud deployment

The complete classroom game is available at https://43.129.175.218/.
The GitHub Pages frontend uses the same API at `https://43.129.175.218`.
Both entry points share completed scores; current sessions remain separate per origin.

## Server and rental

- Tencent Cloud Lighthouse, Hong Kong; instance `lhins-pkfrbbj5`.
- Name: `probability-game-group12`.
- Ubuntu Server 24.04 LTS, 2 vCPU, 2 GB RAM, 40 GB SSD.
- One month, RMB 38 paid; paid automatic renewal is disabled.
- Console expiration: **2026-11-26 00:59:24**. The address is intended for this rental period.
- No domain purchase or paid hosting add-on was made.

The new server has its own SQLite database. Historical scores from the original
Sites / D1 database have not been imported. The old website remains separate.
Test classroom access with VPN disabled on the actual classroom network; a
successful deployment does not establish reachability from every network.

## Application

The runtime uses only Node.js built-ins; no framework dependency installation is needed.

| Item | Location / setting |
| --- | --- |
| Node.js | `/opt/node-24/bin/node`, version 24.22.1 |
| Runtime files | `/opt/probability-game/` |
| Service | `probability-game.service`, enabled at boot, restart on failure |
| Process user | `probability-game`, with no login shell |
| Internal listener | `127.0.0.1:8080` |
| Configuration | `/etc/probability-game/service.env`, root-readable |
| Database | `/var/lib/probability-game/game.sqlite`, mode 0600 |
| Reverse proxy | Nginx; `/etc/nginx/sites-available/probability-game` |
| Public health check | `https://43.129.175.218/healthz` |
| Allowed additional browser origin | `https://yuweizhang2002.github.io` |

The runtime files are `web/index.html`, `server/game.mjs`,
`server/standalone.mjs`, `drizzle/0000_mean_deathstrike.sql`, and the five public
assets (`arcade.css`, `flow.js`, `classroom.js`, `classroom.css`, `favicon.svg`).
Nginx proxies to the application; it does not expose the source tree or database.

After updating the runtime files, restart the service to reload the HTML and assets:

```sh
sudo systemctl restart probability-game
curl --fail https://43.129.175.218/healthz
sudo systemctl status probability-game --no-pager
```

Keep the database outside source releases. Do not run multiple writable application
instances against separate database copies and expect a shared leaderboard.

## HTTPS

Let’s Encrypt issues a free short-lived certificate for the public IP address.
HTTP redirects to HTTPS, except the public ACME validation path. No purchased
domain is required. The cloud firewall permits TCP 443 for the game; its
pre-existing HTTP 80, SSH 22 and ICMP rules remain in place.

- Certbot 5.8.0: `/opt/probability-certbot/bin/certbot`.
- Certificate name: `probability-game-ip`.
- Certificate files: `/etc/letsencrypt/live/probability-game-ip/`.
- `probability-certbot-renew.timer` checks every six hours with a randomized delay.
- The deploy hook `/etc/letsencrypt/renewal-hooks/deploy/probability-nginx`
  validates and reloads Nginx after a successful renewal.
- Certificate renewal is free and does not renew the paid server rental.

```sh
sudo systemctl list-timers probability-certbot-renew.timer --all --no-pager
sudo /opt/probability-certbot/bin/certbot renew --dry-run --run-deploy-hooks --no-random-sleep-on-renew
```

Do not copy private certificate keys or account credentials into Git, web assets,
or teaching materials. Keep port 80 reachable for renewal validation.

## Backups

`probability-backup.timer` performs a daily SQLite online backup using
`/usr/local/sbin/probability-backup`. Files are stored privately under
`/var/backups/probability-game/`, and each backup runs an integrity check.
These are **copies on the same server**; they do not survive loss or deletion of
that server. Download a consistent backup before the rental ends if the scores
need to be kept.

```sh
sudo systemctl start probability-backup.service
sudo journalctl -u probability-backup.service -n 20 --no-pager
```

## Validation

The game tests ran successfully on this server using its installed Node.js:
math and translations, scoring and timing, shared rankings, session recovery,
lesson gating, request limits, private-path isolation and SQLite restart recovery.
Public HTTPS checks also exercised an actual browser game and a separate
GitHub-origin API session, checking that both appeared in the same rankings.
Deployment-only results are removed by their exact public IDs after verification.

References: [Let’s Encrypt IP certificate instructions](https://letsencrypt.org/2026/03/11/shorter-certs-certbot.html),
[approved subscriber agreement v1.8](https://letsencrypt.org/documents/LE-SA-v1.8-July-06-2026.pdf).
