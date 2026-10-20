import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStandalone, validatedOrigin } from "./server/standalone.mjs";

const dir = await mkdtemp(path.join(os.tmpdir(), "probability-backend-"));
const pagesOrigin = "https://classroom-example.gitlab.io";
const publicOrigin = "https://backend.example.test";
let now = 1000;
let app, base;
const launch = async () => {
  app = createStandalone({
    databasePath: path.join(dir, "results.sqlite"), publicOrigin,
    allowedOrigins: [pagesOrigin], now: () => now,
  });
  await new Promise(resolve => app.server.listen(0, "127.0.0.1", resolve));
  base = "http://127.0.0.1:" + app.server.address().port;
};
const call = async (route, input, token, origin = pagesOrigin) => {
  const response = await fetch(base + route, {
    method: input ? "POST" : "GET",
    headers: {
      origin, "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: input ? JSON.stringify(input) : undefined,
  });
  return { response, data: await response.json() };
};
try {
  assert.throws(() => validatedOrigin("https://example.test/path"));
  assert.throws(() => validatedOrigin("https://user:secret@example.test"));
  assert.throws(() => validatedOrigin("http://public.example.test"));
  await launch();
  assert.deepEqual(await (await fetch(base + "/healthz")).json(), { ok: true });
  const home = await (await fetch(base + "/")).text();
  assert.ok(home.includes("conditional-lesson"));
  assert.ok(!home.includes("chatgpt.site"));
  for (const asset of ["flow.js", "classroom.js", "arcade.css", "classroom.css"]) {
    assert.equal((await fetch(base + "/" + asset)).status, 200);
  }
  for (const blocked of ["/server/standalone.mjs", "/.env", "/data/game.sqlite", "/.git/config"]) {
    assert.equal((await fetch(base + blocked)).status, 404);
  }
  const locked = await fetch(base + "/lesson", { redirect: "manual" });
  assert.equal(locked.status, 303);
  assert.equal(locked.headers.get("location"), "/");
  const preflight = await fetch(base + "/api/start", {
    method: "OPTIONS", headers: {
      origin: pagesOrigin, "access-control-request-method": "POST",
      "access-control-request-headers": "authorization,content-type",
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), pagesOrigin);
  assert.equal((await call("/api/session", null, null, pagesOrigin + ".untrusted.test")).response.status, 403);
  const token = crypto.randomUUID();
  const initial = await call("/api/start", { startId: token, name: "Group 12", avatar: 7, rulesAccepted: true }, token);
  assert.equal(initial.response.status, 200);
  assert.equal(initial.response.headers.get("access-control-allow-origin"), pagesOrigin);
  assert.ok(initial.response.headers.get("set-cookie").includes("Secure"));
  const publicId = initial.data.session.publicId;
  assert.equal((await call("/api/answer", { round: 1, value: 0.75 }, token)).response.status, 409);
  const pending = await call("/api/leaderboard", null, token);
  assert.equal(pending.data.total, 0);
  for (let round = 0; round < 3; round++) {
    now += 1000;
    const answer = await call("/api/answer", { round, value: [0.5, 0.75, 0.25][round] }, token);
    assert.equal(answer.data.session.answered, round + 1);
  }
  const board = await call("/api/leaderboard", null, token);
  assert.equal(board.data.total, 1);
  assert.equal(board.data.own.publicId, publicId);
  assert.equal(board.data.own.score, 3);
  assert.equal(board.data.own.elapsedMs, 3000);
  assert.ok(!JSON.stringify(board.data).includes(token));
  assert.equal((await fetch(base + "/lesson", { headers: { cookie: "probability_attempt=" + token } })).status, 200);
  const otherDevice = await call("/api/leaderboard");
  assert.equal(otherDevice.data.entries[0].publicId, publicId);
  assert.equal(otherDevice.data.own, null);
  const tooLarge = await fetch(base + "/api/start", {
    method: "POST", headers: { "Content-Type": "application/json", origin: pagesOrigin },
    body: JSON.stringify({ name: "x".repeat(5000) }),
  });
  assert.equal(tooLarge.status, 413);
  await app.close();
  app = null;
  await launch();
  const restored = await call("/api/session", null, token);
  assert.equal(restored.data.session.completed, true);
  assert.equal(restored.data.session.score, 3);
  assert.equal(restored.data.session.elapsedMs, 3000);
  assert.equal((await call("/api/leaderboard?mode=speed")).data.entries[0].publicId, publicId);
  const retry = await call("/api/answer", { round: 2, value: 0.5 }, token);
  assert.equal(retry.data.session.score, 3);
  console.log("PASS: standalone HTTP game, shared rankings, lesson gate, exact-origin CORS, body limits, private paths and durable restart recovery.");
} finally {
  if (app) await app.close();
  await rm(dir, { recursive: true, force: true });
}
