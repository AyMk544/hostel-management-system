CREATE TABLE IF NOT EXISTS `payments` (
  `id` varchar(255) PRIMARY KEY,
  `student_id` varchar(255) NOT NULL,
  `type` enum('hostel', 'mess') NOT NULL,
  `amount` int NOT NULL,
  `due_date` timestamp NOT NULL,
  `paid_amount` int NOT NULL DEFAULT 0,
  `status` enum('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
); 