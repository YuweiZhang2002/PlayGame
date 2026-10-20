import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));

export function pagesConfig(env = process.env) {
  const target = env.PAGES_TARGET || "github";
  if (!["github", "gitlab"].includes(target)) throw new Error("Unknown PAGES_TARGET.");
  const gitlab = target === "gitlab";
  const pagesUrl = env.PAGES_URL || (gitlab ? env.CI_PAGES_URL : "https://yuweizhang2002.github.io/PlayGame/");
  if (!pagesUrl) throw new Error("Set PAGES_URL or run the build in GitLab CI with CI_PAGES_URL.");
  const site = new URL(pagesUrl);
  if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash) {
    throw new Error("PAGES_URL must be a public HTTPS website URL without credentials, query or hash.");
  }
  const basePath = site.pathname.replace(/\/+$/, "") + "/";
  const apiValue = env.GAME_API_URL || (gitlab ? "" : "https://probability-detective-20261020.yuweizhang2002.chatgpt.site");
  if (!apiValue) {
    throw new Error("Set GAME_API_URL to the independently hosted game backend. GitLab Pages cannot run the shared leaderboard API.");
  }
  const api = new URL(apiValue);
  if (api.protocol !== "https:" || api.username || api.password || api.search || api.hash || api.pathname !== "/") {
    throw new Error("GAME_API_URL must be an HTTPS origin without credentials or a path.");
  }
  if (gitlab && (api.hostname === "chatgpt.site" || api.hostname.endsWith(".chatgpt.site"))) {
    throw new Error("The GitLab migration must use an independent backend, not chatgpt.site.");
  }
  return {
    config: { basePath, apiBase: api.origin },
    output: path.join(root, gitlab ? "gitlab-pages" : "docs"),
    target,
  };
}

export async function buildPages({ config, output, target }) {
  await mkdir(path.join(output, "lesson"), { recursive: true });
  const source = await readFile(path.join(root, "web/index.html"), "utf8");
  const serialized = JSON.stringify(config).replaceAll("<", "\\u003c");
  const html = source
    .replace(/(href|src)="\/(?!\/)/g, (_, attr) => `${attr}="${config.basePath}`)
    .replace("</head>", `  <script>window.PROBABILITY_SITE=${serialized};</script>\n</head>`);
  await writeFile(path.join(output, "index.html"), html);
  await writeFile(path.join(output, "lesson/index.html"), html);
  await cp(path.join(root, "public"), output, { recursive: true });
  await writeFile(path.join(output, ".nojekyll"), "");
  console.log(`${target} Pages bundle ready in ${path.relative(root, output)} (home, lesson, scripts and styles).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildPages(pagesConfig());
}
