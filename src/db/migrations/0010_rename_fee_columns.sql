-- Rename fee columns to match the schema
ALTER TABLE `fee_structures` 
  CHANGE COLUMN `hostel_fees` `base_hostel_fees` int NOT NULL,
  CHANGE COLUMN `mess_fees` `base_mess_fees` int NOT NULL; 