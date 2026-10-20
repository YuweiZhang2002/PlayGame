CREATE TABLE `game_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`player_name` text NOT NULL,
	`avatar` integer NOT NULL,
	`started_ms` integer NOT NULL,
	`answers` text DEFAULT '[]' NOT NULL,
	`answered_count` integer DEFAULT 0 NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`finished_ms` integer,
	`elapsed_ms` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_attempts_public_id_unique` ON `game_attempts` (`public_id`);--> statement-breakpoint
CREATE INDEX `game_ranking_idx` ON `game_attempts` (`finished_ms`,`correct_count`,`elapsed_ms`);