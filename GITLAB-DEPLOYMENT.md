# Optional GitLab Pages entry

The independent backend and complete game are live at https://43.129.175.218/.
The GitHub entry at https://yuweizhang2002.github.io/PlayGame/ uses this backend.
See [Tencent deployment](TENCENT-DEPLOYMENT.md) for operation, backups and the
one-month rental end date. No Render service was deployed.

The GitLab project, CI tests and Pages build are prepared, but **GitLab Pages has
not been published**. It can be added as another frontend. GitLab Pages cannot
run the scoring API or database itself.

## Publish another frontend

1. Obtain the GitLab project's actual Pages URL and origin, including its unique
   domain if enabled.
2. Add that exact HTTPS origin to `GAME_ALLOWED_ORIGINS` in
   `/etc/probability-game/service.env` on the Tencent server. Keep the existing
   GitHub origin and separate additional origins with commas. Restart
   `probability-game.service`.
3. Set the GitLab CI/CD variable `GAME_API_URL` to `https://43.129.175.218`.
   This is a public endpoint, not a credential.
4. Sync the source to GitLab. `.gitlab-ci.yml` runs tests, builds `gitlab-pages/`
   without framework dependencies and publishes the default branch when
   `GAME_API_URL` is configured. The build uses `CI_PAGES_URL`; if the final
   public URL differs, set `PAGES_URL` explicitly.
5. Verify the URL from GitLab's Deploy > Pages screen, anonymous play, refresh
   recovery, lesson unlocking, both languages and shared rankings. Test from
   the actual classroom network before sharing a QR code.

The builder rejects `chatgpt.site` as the GitLab API origin. GitHub and GitLab
frontends use a private attempt token in an Authorization header, avoiding a
reliance on third-party cookies. Each origin has its own current session.

The original Sites website and its historical leaderboard remain separate; old
D1 results have not been imported into the new SQLite database.

## Local checks

```sh
node test-pages.mjs
node test-server.mjs
node test-standalone.mjs
```

For GitLab output, set `PAGES_TARGET=gitlab`, `PAGES_URL` (or `CI_PAGES_URL`) and
`GAME_API_URL`, then run `node scripts/build-pages.mjs`. Without `PAGES_TARGET`,
the builder writes the current GitHub frontend to `docs/`.

References: [GitLab Pages](https://docs.gitlab.com/user/project/pages/),
[Pages domains and base URLs](https://docs.gitlab.com/user/project/pages/getting_started_part_one/).
