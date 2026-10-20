import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = {
  basePath: "/PlayGame/",
  apiBase: "https://probability-detective-20261020.yuweizhang2002.chatgpt.site",
};
const output = path.join(root, "docs");
await mkdir(path.join(output, "lesson"), { recursive: true });
const source = await readFile(path.join(root, "web/index.html"), "utf8");
const html = source
  .replace(/(href|src)="\/(?!\/)/g, `$1="${config.basePath}`)
  .replace("</head>", `  <script>window.PROBABILITY_SITE=${JSON.stringify(config)};</script>\n</head>`);
await writeFile(path.join(output, "index.html"), html);
await writeFile(path.join(output, "lesson/index.html"), html);
await cp(path.join(root, "public"), output, { recursive: true });
await writeFile(path.join(output, ".nojekyll"), "");
console.log("GitHub Pages bundle ready in docs/ (home, lesson, scripts and styles).");
