CREATE TABLE `queries` (
	`id` varchar(255) NOT NULL,
	`student_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
	`admin_response` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` varchar(255) NOT NULL,
	`room_number` varchar(20) NOT NULL,
	`capacity` int NOT NULL,
	`occupied_seats` int NOT NULL DEFAULT 0,
	`fees` int NOT NULL,
	`floor` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rooms_room_number_unique` UNIQUE(`room_number`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`roll_no` varchar(20) NOT NULL,
	`course` varchar(100) NOT NULL,
	`contact_no` varchar(20) NOT NULL,
	`date_of_birth` timestamp NOT NULL,
	`address` text NOT NULL,
	`room_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_roll_no_unique` UNIQUE(`roll_no`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('admin','student') NOT NULL DEFAULT 'student',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `queries` ADD CONSTRAINT `queries_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;