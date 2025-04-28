CREATE TABLE `courses` (
	`id` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `student_profiles` RENAME COLUMN `course` TO `course_id`;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `course_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;