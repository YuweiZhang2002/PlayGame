import { env } from "cloudflare:workers";
import html from "../../web/index.html?raw";
import { getAttempt } from "../../server/game.mjs";

export async function GET(request: Request) {
  const attempt = await getAttempt(request, env.DB);
  if (!attempt || attempt.finished_ms === null) {
    return new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store" } });
  }
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
