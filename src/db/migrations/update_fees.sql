-- Update existing fee records with room type fees
UPDATE fee_structures 
SET single_room_fees = hostel_fees * 1.5,
    double_room_fees = hostel_fees * 1.2,
    triple_room_fees = hostel_fees
WHERE single_room_fees IS NULL; 