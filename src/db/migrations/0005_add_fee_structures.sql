CREATE TABLE IF NOT EXISTS `fee_structures` (
  `id` varchar(255) PRIMARY KEY,
  `year` int NOT NULL,
  `semester` enum('JUL-DEC', 'JAN-MAY') NOT NULL,
  `hostel_fees` decimal(10, 2) NOT NULL,
  `mess_fees` decimal(10, 2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 