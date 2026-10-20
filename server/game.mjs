export const CORRECT_ANSWERS = Object.freeze([0.5, 0.75, 0.25]);
export const AVATAR_COUNT = 12;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE = "probability_attempt";
const MAX_AGE = 24 * 60 * 60 * 1000;

function json(value, status = 200, extra = {}) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra },
  });
}

export function sessionId(request) {
  const value = request.headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  return UUID.test(value ?? "") ? value : null;
}

export async function getAttempt(request, db) {
  const id = sessionId(request);
  if (!id) return null;
  return db.prepare("SELECT * FROM game_attempts WHERE id = ?").bind(id).first();
}

export function snapshot(row, now = Date.now()) {
  const answers = JSON.parse(row.answers);
  return {
    publicId: row.public_id,
    name: row.player_name,
    avatar: row.avatar,
    answers,
    results: answers.map((answer, i) => answer === CORRECT_ANSWERS[i]),
    score: row.correct_count,
    answered: row.answered_count,
    completed: row.finished_ms !== null,
    elapsedMs: row.elapsed_ms ?? Math.max(0, now - row.started_ms),
  };
}

async function body(request) {
  const text = await request.text();
  if (text.length > 4096) throw new Error("invalid_input");
  try { return JSON.parse(text); } catch { throw new Error("invalid_input"); }
}

export async function handleGameRequest(request, db, now = Date.now()) {
  const url = new URL(request.url);
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json({ error: "wrong_origin" }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "invalid_input" }, 415);
  }
  if (!db) return json({ error: "unavailable" }, 503);
  try {
    if (url.pathname === "/api/session" && request.method === "GET") {
      const row = await getAttempt(request, db);
      if (!row || (!row.finished_ms && now - row.started_ms > MAX_AGE)) return json({ session: null });
      return json({ session: snapshot(row, now) });
    }
    if (url.pathname === "/api/start" && request.method === "POST") {
      const input = await body(request);
      const name = typeof input.name === "string" ? input.name.normalize("NFKC").trim() : "";
      if (!name || [...name].length > 20 || /[\u0000-\u001f\u007f]/.test(name) ||
          !Number.isInteger(input.avatar) || input.avatar < 0 || input.avatar >= AVATAR_COUNT ||
          input.rulesAccepted !== true || !UUID.test(input.startId ?? "")) {
        return json({ error: "invalid_input" }, 400);
      }
      // The request ID makes a retry after a lost response safe; it never resets a timer.
      await db.prepare("INSERT INTO game_attempts (id, public_id, player_name, avatar, started_ms) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING")
        .bind(input.startId, crypto.randomUUID(), name, input.avatar, now).run();
      const row = await db.prepare("SELECT * FROM game_attempts WHERE id = ?").bind(input.startId).first();
      const cookie = `${COOKIE}=${row.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${url.protocol === "https:" ? "; Secure" : ""}`;
      return json({ session: snapshot(row, now) }, 200, { "Set-Cookie": cookie });
    }
    if (url.pathname === "/api/answer" && request.method === "POST") {
      const input = await body(request);
      if (!Number.isInteger(input.round) || input.round < 0 || input.round > 2 ||
          ![0.25, 0.5, 0.75].includes(input.value)) return json({ error: "invalid_input" }, 400);
      let row = await getAttempt(request, db);
      if (!row) return json({ error: "no_session" }, 401);
      if (!row.finished_ms && now - row.started_ms > MAX_AGE) return json({ error: "expired" }, 410);
      // Once a round has an answer, a retry returns the recorded answer even if
      // the caller supplies a different value. Only the first choice is scored.
      if (input.round < row.answered_count) return json({ session: snapshot(row, now) });
      if (input.round !== row.answered_count || row.finished_ms !== null) return json({ error: "wrong_round" }, 409);
      const answers = [...JSON.parse(row.answers), input.value];
      const count = row.answered_count + 1;
      const score = answers.reduce((sum, value, i) => sum + Number(value === CORRECT_ANSWERS[i]), 0);
      const finished = count === 3 ? now : null;
      const elapsed = finished === null ? null : Math.max(1, now - row.started_ms);
      // Compare-and-set protects against two simultaneous clicks or retrying tabs.
      await db.prepare("UPDATE game_attempts SET answers = ?, answered_count = ?, correct_count = ?, finished_ms = ?, elapsed_ms = ? WHERE id = ? AND answered_count = ? AND finished_ms IS NULL")
        .bind(JSON.stringify(answers), count, score, finished, elapsed, row.id, input.round).run();
      row = await db.prepare("SELECT * FROM game_attempts WHERE id = ?").bind(row.id).first();
      return json({ session: snapshot(row, now) });
    }
    if (url.pathname === "/api/leaderboard" && request.method === "GET") {
      const mode = url.searchParams.get("mode") ?? "overall";
      if (!["overall", "accuracy", "speed"].includes(mode)) return json({ error: "invalid_input" }, 400);
      const rankOrder = mode === "accuracy" ? "correct_count DESC" : mode === "speed" ? "elapsed_ms ASC" : "correct_count DESC, elapsed_ms ASC";
      const displayOrder = mode === "speed" ? "elapsed_ms ASC, correct_count DESC" : "correct_count DESC, elapsed_ms ASC";
      const cte = `WITH ranked AS (SELECT public_id AS publicId, player_name AS name, avatar, correct_count AS score, elapsed_ms AS elapsedMs, finished_ms, RANK() OVER (ORDER BY ${rankOrder}) AS rank FROM game_attempts WHERE finished_ms IS NOT NULL) `;
      const rows = await db.prepare(cte + `SELECT publicId, name, avatar, score, elapsedMs, rank FROM ranked ORDER BY ${displayOrder.replaceAll("correct_count", "score").replaceAll("elapsed_ms", "elapsedMs")}, finished_ms ASC, publicId ASC LIMIT 50`).all();
      const total = await db.prepare("SELECT COUNT(*) AS count FROM game_attempts WHERE finished_ms IS NOT NULL").first();
      const current = await getAttempt(request, db);
      let own = null;
      if (current?.finished_ms !== null && current?.finished_ms !== undefined) {
        own = await db.prepare(cte + "SELECT publicId, name, avatar, score, elapsedMs, rank FROM ranked WHERE publicId = ?").bind(current.public_id).first();
      }
      return json({ entries: rows.results, total: total.count, own, mode, updatedAt: now });
    }
    return json({ error: "not_found" }, 404);
  } catch (error) {
    if (error.message === "invalid_input") return json({ error: "invalid_input" }, 400);
    console.error("Game request failed", { path: url.pathname, message: error.message });
    return json({ error: "unavailable" }, 503);
  }
}
