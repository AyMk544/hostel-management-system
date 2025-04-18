CREATE TABLE `fee_structures` (
	`id` varchar(36) NOT NULL,
	`year` int NOT NULL,
	`semester` enum('JAN-MAY','JUL-DEC') NOT NULL,
	`single_room_fees` int NOT NULL,
	`double_room_fees` int NOT NULL,
	`triple_room_fees` int NOT NULL,
	`hostel_fees` int NOT NULL,
	`mess_fees` int NOT NULL,
	`due_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fee_structures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(255) NOT NULL,
	`student_id` varchar(255) NOT NULL,
	`type` enum('hostel','mess') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paid_amount` decimal(10,2) NOT NULL DEFAULT '0',
	`due_date` date NOT NULL,
	`status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rooms` DROP COLUMN `fees`;