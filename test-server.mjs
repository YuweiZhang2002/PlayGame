import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleGameRequest, getAttempt, PAGES_ORIGIN } from "./server/game.mjs";

// Run the actual D1 queries against SQLite, including ranking windows and CAS updates.
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync("drizzle/0000_mean_deathstrike.sql", "utf8"));
const db = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return statement.get(...args) ?? null; },
      async all() { return { results: statement.all(...args) }; },
      async run() { return { meta: statement.run(...args) }; },
    };
  },
};
async function request(path, input, cookie = "", now = 1000, origin = "https://example.test") {
  const req = new Request("https://example.test" + path, {
    method: input ? "POST" : "GET",
    headers: { cookie, origin, "content-type": "application/json" },
    body: input ? JSON.stringify(input) : undefined,
  });
  const response = await handleGameRequest(req, db, now);
  return { response, data: await response.json() };
}
async function start(name = "Tester", now = 1000, id = crypto.randomUUID()) {
  const result = await request("/api/start", {startId:id,name,avatar:2,rulesAccepted:true}, "", now);
  assert.equal(result.response.status, 200);
  const cookie = result.response.headers.get("set-cookie").split(";")[0];
  assert.match(result.response.headers.get("set-cookie"), /HttpOnly/);
  return {cookie, id, session:result.data.session};
}
async function finish(player, answers, finalTime) {
  for(let round = 0; round < 3; round++) {
    const result = await request("/api/answer", {round,value:answers[round]}, player.cookie, finalTime - (2-round)*100);
    assert.equal(result.response.status, 200);
    if (round === 2) assert.equal(result.data.session.completed, true);
  }
}

assert.equal((await request("/api/session")).data.session, null);
assert.equal((await request("/api/answer", {round:0,value:0.5})).response.status, 401);
assert.equal((await request("/api/start", {startId:crypto.randomUUID(),name:"Bad",avatar:1,rulesAccepted:false})).response.status, 400);
assert.equal((await request("/api/start", {startId:crypto.randomUUID(),name:"Bad",avatar:99,rulesAccepted:true})).response.status, 400);
assert.equal((await request("/api/start", {startId:crypto.randomUUID(),name:"Bad",avatar:1,rulesAccepted:true}, "", 1000, "https://other.test")).response.status, 403);
const first = await start("Alice");
const retried = await start("Alice", 2000, first.id);
assert.equal(retried.session.elapsedMs, 1000, "A start retry must preserve the original start time");
assert.equal(first.session.publicId, retried.session.publicId);
assert.equal((await request("/api/answer", {round:1,value:0.75}, first.cookie)).response.status, 409);
const firstChoice = await request("/api/answer", {round:0,value:0.25,score:3,elapsedMs:1}, first.cookie, 1500);
assert.equal(firstChoice.data.session.score, 0, "Score and timing cannot be supplied by the browser");
const duplicate = await request("/api/answer", {round:0,value:0.5}, first.cookie, 1800);
assert.equal(duplicate.data.session.score, 0, "Retrying with a correct value cannot change a wrong first answer");
assert.equal(duplicate.data.session.answers[0], 0.25);
assert.equal((await request("/api/leaderboard", null, first.cookie)).data.total, 0, "Incomplete games must not enter rankings");
await finish(first, [0.25,0.75,0.25], 2500);
const finalRetry = await request("/api/answer", {round:2,value:0.25}, first.cookie, 9000);
assert.equal(finalRetry.data.session.elapsedMs, 1500, "Final retries never extend or duplicate the result");
const faster = await start("Bob");
await finish(faster, [0.5,0.75,0.25], 2100);
const slowerPerfect = await start("Charlie");
await finish(slowerPerfect, [0.5,0.75,0.25], 4000);
const fastestWrong = await start("<b>Delta</b>");
await finish(fastestWrong, [0.25,0.25,0.5], 1600);
const tied = await start("Echo");
await finish(tied, [0.5,0.75,0.25], 2100);
const overall = (await request("/api/leaderboard", null, first.cookie)).data;
assert.equal(overall.total, 5);
assert.deepEqual(overall.entries.map(row => row.score), [3,3,3,2,0]);
assert.deepEqual(overall.entries.map(row => row.rank), [1,1,3,4,5]);
assert.equal(overall.own.rank, 4);
assert.ok(!JSON.stringify(overall).includes(first.id), "Private session IDs must not appear in a public leaderboard");
const accuracy = (await request("/api/leaderboard?mode=accuracy")).data;
assert.deepEqual(accuracy.entries.map(row => row.rank), [1,1,1,4,5]);
const speed = (await request("/api/leaderboard?mode=speed")).data;
assert.deepEqual(speed.entries.map(row => row.elapsedMs), [600,1100,1100,1500,3000]);
assert.equal(speed.entries[0].name, "<b>Delta</b>", "Names are data, not markup");
const resumed = (await request("/api/session", null, first.cookie, 9999)).data.session;
assert.equal(resumed.score, 2);
assert.equal(resumed.elapsedMs, 1500);
assert.equal(resumed.completed, true);
assert.ok((await getAttempt(new Request("https://example.test/lesson", {headers:{cookie:first.cookie}}),db)).finished_ms !== null);
assert.equal(await getAttempt(new Request("https://example.test/lesson"),db), null);
const concurrent = await start("Concurrent");
await Promise.all([
  request("/api/answer", {round:0,value:0.5}, concurrent.cookie, 1700),
  request("/api/answer", {round:0,value:0.25}, concurrent.cookie, 1701),
]);
const concurrentState = (await request("/api/session",null,concurrent.cookie,1800)).data.session;
assert.equal(concurrentState.answered, 1);
assert.equal(concurrentState.answers.length, 1);
assert.equal(concurrentState.score, 1);
assert.equal((await request("/api/answer", {round:1,value:0.75}, concurrent.cookie, 86401001)).response.status, 410);
assert.equal((await request("/api/leaderboard?mode=invalid")).response.status, 400);

// Pages uses an explicit attempt token, so browsers can block third-party cookies.
const preflight = await handleGameRequest(new Request("https://example.test/api/start", {
  method:"OPTIONS",
  headers:{origin:PAGES_ORIGIN,"access-control-request-method":"POST","access-control-request-headers":"authorization,content-type"},
}), db);
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("access-control-allow-origin"), PAGES_ORIGIN);
assert.equal(preflight.headers.get("access-control-allow-credentials"), null);
const blocked = await handleGameRequest(new Request("https://example.test/api/session", {
  headers:{origin:"https://untrusted.example",authorization:"Bearer "+first.id},
}), db);
assert.equal(blocked.status, 403);
assert.equal(blocked.headers.get("access-control-allow-origin"), null);
const pageId = crypto.randomUUID();
async function pagesRequest(path, input, now = 5000, token = pageId) {
  const response = await handleGameRequest(new Request("https://example.test" + path, {
    method:input ? "POST" : "GET",
    headers:{origin:PAGES_ORIGIN,"content-type":"application/json",authorization:"Bearer "+token},
    body:input ? JSON.stringify(input) : undefined,
  }), db, now);
  assert.equal(response.headers.get("access-control-allow-origin"), PAGES_ORIGIN);
  return {response,data:await response.json()};
}
const pageStart = await pagesRequest("/api/start", {startId:pageId,name:"Pages player",avatar:4,rulesAccepted:true});
assert.equal(pageStart.response.status, 200);
assert.equal((await pagesRequest("/api/session", null, 5500)).data.session.elapsedMs, 500);
assert.equal((await pagesRequest("/api/session", null, 5500, "invalid")).data.session, null);
for (const [round,value] of [0.5,0.75,0.25].entries()) {
  const result = await pagesRequest("/api/answer", {round,value}, 6000 + round * 100);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.session.answered, round + 1);
}
const pageBoard = (await pagesRequest("/api/leaderboard", null, 7000)).data;
assert.equal(pageBoard.own.publicId, pageStart.data.session.publicId);
assert.equal(pageBoard.own.score, 3);
assert.equal(pageBoard.own.elapsedMs, 1200);
assert.ok(!JSON.stringify(pageBoard).includes(pageId));
assert.equal((await pagesRequest("/api/answer", {round:2,value:0.5}, 8000)).data.session.score, 3);
sqlite.close();
console.log("PASS: scoring, timing, sessions, idempotency, concurrency, rankings, ties, GitHub Pages CORS and cookie-free session recovery.");
