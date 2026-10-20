import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, chmodSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleGameRequest, getAttempt } from "./game.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = { ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };

export function validatedOrigin(value) {
  const url = new URL(value);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Use an exact HTTPS origin; local HTTP origins are allowed for development.");
  }
  return url.origin;
}

export function openDatabase(filename) {
  if (filename !== ":memory:") mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(filename);
  if (filename !== ":memory:") chmodSync(filename, 0o600);
  sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  const version = sqlite.prepare("PRAGMA user_version").get().user_version;
  if (version > 1) {
    sqlite.close();
    throw new Error("Database schema is newer than this server.");
  }
  if (version === 0) {
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      const existing = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'game_attempts'").get();
      if (!existing) sqlite.exec(readFileSync(path.join(root, "drizzle/0000_mean_deathstrike.sql"), "utf8"));
      sqlite.exec("PRAGMA user_version=1; COMMIT;");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      sqlite.close();
      throw error;
    }
  }
  return {
    sqlite,
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
}

export function createStandalone({ databasePath, publicOrigin, allowedOrigins = [], now = Date.now }) {
  const origin = validatedOrigin(publicOrigin);
  const origins = allowedOrigins.map(validatedOrigin);
  const db = openDatabase(databasePath);
  const html = readFileSync(path.join(root, "web/index.html"));
  const assets = new Map(
    ["arcade.css", "flow.js", "classroom.js", "classroom.css", "favicon.svg"].map(name => [
      "/" + name,
      { body: readFileSync(path.join(root, "public", name)), type: types[path.extname(name)] },
    ]),
  );
  const json = (data, status = 200) => Response.json(data, {
    status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
  async function dispatch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz" && request.method === "GET") {
      db.sqlite.prepare("SELECT 1").get();
      return json({ ok: true });
    }
    if (url.pathname.startsWith("/api/")) return handleGameRequest(request, db, now(), origins);
    if (!["GET", "HEAD"].includes(request.method)) return json({ error: "method_not_allowed" }, 405);
    if (url.pathname === "/lesson" || url.pathname === "/lesson/") {
      const attempt = await getAttempt(request, db);
      if (!attempt || attempt.finished_ms === null) {
        return new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store" } });
      }
    }
    if (["/", "/index.html", "/lesson", "/lesson/"].includes(url.pathname)) {
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    const asset = assets.get(url.pathname);
    if (asset) return new Response(asset.body, { headers: {
      "Content-Type": asset.type + "; charset=utf-8", "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    } });
    return json({ error: "not_found" }, 404);
  }
  const server = createServer({ requestTimeout: 20000, headersTimeout: 10000 }, async (req, res) => {
    try {
      const url = new URL(req.url, origin);
      if (url.origin !== origin) {
        res.writeHead(400).end();
        return;
      }
      let buffer = Buffer.alloc(0);
      for await (const chunk of req) {
        if (buffer.length + chunk.length > 4096) {
          res.writeHead(413, { "Content-Type": "application/json", "Connection": "close" });
          res.end('{"error":"payload_too_large"}');
          return;
        }
        buffer = Buffer.concat([buffer, chunk]);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
      const request = new Request(url, {
        method: req.method, headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : buffer,
      });
      const response = await dispatch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(req.method === "HEAD" ? undefined : Buffer.from(await response.arrayBuffer()));
    } catch {
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end('{"error":"unavailable"}');
    }
  });
  return {
    server,
    async close() {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      db.sqlite.close();
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT.");
  const publicOrigin = process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${port}`;
  const allowedOrigins = (process.env.GAME_ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const app = createStandalone({
    databasePath: path.resolve(process.env.DATABASE_PATH || "data/game.sqlite"),
    publicOrigin, allowedOrigins,
  });
  app.server.listen(port, process.env.HOST || "0.0.0.0", () => {
    console.log(`Probability game listening on port ${port}; shared SQLite storage enabled.`);
  });
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await app.close();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
