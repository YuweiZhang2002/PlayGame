# GitLab migration

Status: the Pages build, CI configuration and independent backend are prepared.
The live GitLab Pages URL and replacement backend URL must be verified after
deployment; local preparation does not mean the migration is live.

## Why both hosts matter

The current public frontend is at https://yuweizhang2002.github.io/PlayGame/.
It still calls the original `chatgpt.site` API for starting a game, answering,
restoring progress and reading the shared rankings. Changing the frontend
hostname alone does not remove that dependency.

GitLab Pages serves the HTML, CSS and JavaScript. It cannot run the scoring API
or its database. Preserving the cross-device leaderboard therefore requires a
separate backend that participants can reach.

## Publish with the shared leaderboard

1. Obtain access to the destination GitLab project and the replacement backend
   hosting account. Keep tokens outside the repository and public assets.
2. Deploy the new standalone Node.js 24 server with persistent storage. It runs
   the same scoring and ranking logic with SQLite, without Cloudflare or Sites
   dependencies. The suggested Render setup is described below.
3. Configure the backend to allow the exact origin of the final GitLab Pages
   URL, including its unique domain if enabled. Set `GAME_ALLOWED_ORIGINS` on
   the standalone backend to a comma-separated list of exact HTTPS origins.
   The original Worker retains its existing GitHub origin allowance.
4. Set the GitLab CI/CD variable `GAME_API_URL` to the replacement HTTPS API
   origin. This is a public endpoint URL, not a token or other secret. The
   GitLab build intentionally rejects `chatgpt.site` endpoints.
5. Push the project to GitLab. `.gitlab-ci.yml` runs path/asset checks and builds
   `gitlab-pages/` without installing framework dependencies. It derives the
   base path from `CI_PAGES_URL` and publishes only the default branch. CI tests
   run before deployment. The deploy job waits until `GAME_API_URL` is set.
6. Obtain the actual published URL from GitLab's Deploy > Pages screen.
   If a custom domain or redirect changes the URL path, set `PAGES_URL` to the
   final URL and rebuild.
7. Verify anonymous access, all three questions, refresh recovery, the lesson
   gate, both languages and rankings across two devices. Test from the
   classroom network with VPN off before distributing the link or QR code.

The existing GitHub website and its data remain in place. Historical leaderboard
data has not been copied to another database; plan that transfer separately when
the destination is available.

## Recommended backend: Render, Singapore

`render.yaml` describes one Node.js service with a 1 GB persistent disk mounted
at `/var/data`. It uses the smallest paid compute size, one instance, and the
health check `/healthz`. Review Render's actual estimate before creating paid
resources. The user has not yet authorized a subscription or a charge.

The build command is `node --version`; the start command is
`node server/standalone.mjs`. The standalone application uses only Node.js
built-ins, so it does not install the original framework dependencies.

Environment:

| Variable | Value |
| --- | --- |
| `NODE_VERSION` | `24` |
| `DATABASE_PATH` | `/var/data/game.sqlite` |
| `GAME_ALLOWED_ORIGINS` | The actual GitLab Pages origin; additional exact origins separated by commas |
| `PUBLIC_ORIGIN` | Optional on Render; defaults to `RENDER_EXTERNAL_URL` |

The service also serves the complete game at its own root URL and checks the
lesson gate on the server. This gives a second game entry point if the GitLab
Pages domain is unavailable on a particular network. Both entry points use the
same leaderboard, but each browser origin has its own current game session.

Do not deploy this SQLite configuration on Render Free: that plan cannot attach
a persistent disk and loses local file changes on restart. On another host,
mount persistent storage and set `DATABASE_PATH` explicitly. Keep one server
instance per SQLite database. Back up the database consistently before moving
or upgrading it.

The tests verify HTTP gameplay, shared rankings, the lesson gate, request body
limits, CORS, private file isolation and data surviving a full server restart.

## Local build checks

```sh
node test-pages.mjs
node test-server.mjs
node test-standalone.mjs
```

For a GitLab build, set `PAGES_TARGET=gitlab`, `PAGES_URL` to the actual public
Pages URL, and `GAME_API_URL` to the independently deployed backend origin, then
run `node scripts/build-pages.mjs`.

The existing `npm run build:pages` command still generates the current GitHub
version in `docs/` when `PAGES_TARGET` is omitted.

References:

- [GitLab Pages](https://docs.gitlab.com/user/project/pages/)
- [Pages domains and base URLs](https://docs.gitlab.com/user/project/pages/getting_started_part_one/)
- [Render regions](https://render.com/docs/regions)
- [Render persistent disks](https://render.com/docs/disks)
