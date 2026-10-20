import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameAttempts = sqliteTable("game_attempts", {
  id: text("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  playerName: text("player_name").notNull(),
  avatar: integer("avatar").notNull(),
  startedMs: integer("started_ms").notNull(),
  answers: text("answers").notNull().default("[]"),
  answeredCount: integer("answered_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  finishedMs: integer("finished_ms"),
  elapsedMs: integer("elapsed_ms"),
}, table => [
  index("game_ranking_idx").on(table.finishedMs, table.correctCount, table.elapsedMs),
]);
