CREATE TABLE `objects` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL CHECK (`type` IN ('project', 'task', 'resource', 'daily-note', 'calendar-entry', 'person', 'weblink', 'page', 'custom', 'tag', 'collection', 'query')),
	`title` text NOT NULL CHECK (length(trim(`title`)) > 0),
	`content` text,
	`properties` text DEFAULT '{}' NOT NULL CHECK (json_valid(`properties`)),
	`metadata` text DEFAULT '{"tags":[],"favorited":false}' NOT NULL CHECK (json_valid(`metadata`)),
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`archived` integer DEFAULT false NOT NULL CHECK (`archived` IN (0, 1)),
	`created_date` text GENERATED ALWAYS AS (date(`created_at`, 'unixepoch')) VIRTUAL,
	`updated_date` text GENERATED ALWAYS AS (date(`updated_at`, 'unixepoch')) VIRTUAL
);
--> statement-breakpoint
CREATE TABLE `relations` (
	`id` text PRIMARY KEY NOT NULL,
	`from_object_id` text NOT NULL,
	`to_object_id` text NOT NULL,
	`relation_type` text NOT NULL CHECK (`relation_type` IN ('parent_of', 'child_of', 'blocks', 'blocked_by', 'relates_to', 'assigned_to', 'member_of', 'references', 'contains', 'attends', 'knows', 'created_on', 'tagged_with')),
	`metadata` text DEFAULT '{}' NOT NULL CHECK (json_valid(`metadata`)),
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CHECK (`from_object_id` != `to_object_id`),
	FOREIGN KEY (`from_object_id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_object_id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `type_idx` ON `objects` (`type`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `objects` (`created_at`);--> statement-breakpoint
CREATE INDEX `updated_at_idx` ON `objects` (`updated_at`);--> statement-breakpoint
CREATE INDEX `archived_idx` ON `objects` (`archived`);--> statement-breakpoint
CREATE INDEX `idx_objects_type_archived` ON `objects` (`type`,`archived`);--> statement-breakpoint
CREATE INDEX `idx_objects_archived_type` ON `objects` (`archived`,`type`);--> statement-breakpoint
CREATE INDEX `idx_objects_type_updated_at` ON `objects` (`type`,`updated_at`);--> statement-breakpoint
CREATE INDEX `from_object_id_idx` ON `relations` (`from_object_id`);--> statement-breakpoint
CREATE INDEX `to_object_id_idx` ON `relations` (`to_object_id`);--> statement-breakpoint
CREATE INDEX `relation_type_idx` ON `relations` (`relation_type`);--> statement-breakpoint
CREATE INDEX `idx_relations_from_type` ON `relations` (`from_object_id`,`relation_type`);--> statement-breakpoint
CREATE INDEX `idx_relations_to_type` ON `relations` (`to_object_id`,`relation_type`);--> statement-breakpoint
CREATE INDEX `idx_relations_from_to` ON `relations` (`from_object_id`,`to_object_id`);