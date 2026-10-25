import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pagesConfig, buildPages } from "./scripts/build-pages.mjs";

const original = pagesConfig({});
assert.equal(original.config.basePath, "/PlayGame/");
assert.equal(original.config.apiBase, "https://43.129.175.218");
assert.equal(original.target, "github");

assert.throws(() => pagesConfig({ PAGES_TARGET: "gitlab" }), /PAGES_URL/);
assert.throws(() => pagesConfig({
  PAGES_TARGET: "gitlab", CI_PAGES_URL: "https://example.gitlab.io/PlayGame/",
}), /GAME_API_URL/);
assert.throws(() => pagesConfig({
  PAGES_TARGET: "gitlab", CI_PAGES_URL: "https://example.gitlab.io/PlayGame/",
  GAME_API_URL: "https://probability-detective-20261020.yuweizhang2002.chatgpt.site",
}), /independent backend/);
assert.throws(() => pagesConfig({
  PAGES_TARGET: "gitlab", CI_PAGES_URL: "https://example.gitlab.io/",
  GAME_API_URL: "https://user:secret@api.example.test",
}), /without credentials/);

const temp = await mkdtemp(path.join(os.tmpdir(), "probability-pages-"));
try {
  const previousOutput = original.output;
  original.output = path.join(temp, "github-regression");
  await buildPages(original);
  for (const file of ["index.html", "lesson/index.html", "flow.js", "classroom.js", "arcade.css", "classroom.css"]) {
    assert.equal(
      await readFile(path.join(original.output, file), "utf8"),
      await readFile(path.join(previousOutput, file), "utf8"),
      `The default build must preserve the current GitHub output: ${file}`,
    );
  }
  for (const pathname of ["/", "/PlayGame/", "/subgroup/PlayGame"]) {
    const settings = pagesConfig({
      PAGES_TARGET: "gitlab",
      CI_PAGES_URL: "https://example.gitlab.io" + pathname,
      GAME_API_URL: "https://game-api.example.test",
    });
    settings.output = path.join(temp, encodeURIComponent(pathname));
    await buildPages(settings);
    const home = await readFile(path.join(settings.output, "index.html"), "utf8");
    const lesson = await readFile(path.join(settings.output, "lesson/index.html"), "utf8");
    assert.equal(home, lesson);
    assert.ok(!home.includes("chatgpt.site"));
    assert.ok(home.includes('"apiBase":"https://game-api.example.test"'));
    assert.ok(home.includes(`"basePath":"${settings.config.basePath}"`));
    const assets = [...home.matchAll(/(?:src|href)="([^"]+\.(?:css|js))"/g)].map(match => match[1]);
    assert.ok(assets.length >= 4);
    for (const asset of assets) {
      assert.ok(asset.startsWith(settings.config.basePath), asset);
      const local = path.join(settings.output, asset.slice(settings.config.basePath.length));
      assert.ok((await stat(local)).isFile(), local);
    }
    for (const asset of ["flow.js", "classroom.js", "arcade.css", "classroom.css"]) {
      assert.ok(!(await readFile(path.join(settings.output, asset), "utf8")).includes("chatgpt.site"));
    }
  }
  console.log("Pages migration checks passed: root/subdirectory paths, lesson assets, independent API and explicit configuration.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
