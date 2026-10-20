import { env } from "cloudflare:workers";
import { handleGameRequest } from "../../../server/game.mjs";

export const GET = (request: Request) => handleGameRequest(request, env.DB);
export const POST = (request: Request) => handleGameRequest(request, env.DB);
