-- Add dueDate column to fee_structures table
ALTER TABLE `fee_structures` ADD COLUMN `due_date` date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL 10 DAY); 