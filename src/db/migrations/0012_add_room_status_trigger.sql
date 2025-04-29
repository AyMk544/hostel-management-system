-- Drop the existing triggers
DROP TRIGGER IF EXISTS update_room_status_before_update;
DROP TRIGGER IF EXISTS update_room_status_before_insert;

-- Now create the new triggers with cleaner logic
DELIMITER //

CREATE TRIGGER update_room_status_before_update
BEFORE UPDATE ON rooms
FOR EACH ROW
BEGIN
    -- If it's NOT an admin manual update (admin updates have occupied_seats unchanged but is_active changed)
    IF NOT (OLD.occupied_seats = NEW.occupied_seats AND OLD.is_active != NEW.is_active) THEN
        -- This is a normal capacity/seats update, apply automatic rule
        IF NEW.capacity = NEW.occupied_seats THEN
            SET NEW.is_active = 0;
        ELSE
            SET NEW.is_active = 1;
        END IF;
    END IF;
    -- When it IS an admin update, we do nothing (let the admin's value pass through)
END//

CREATE TRIGGER update_room_status_before_insert
BEFORE INSERT ON rooms
FOR EACH ROW
BEGIN
    IF NEW.capacity = NEW.occupied_seats THEN
        SET NEW.is_active = 0;
    ELSE
        SET NEW.is_active = 1;
    END IF;
END//

DELIMITER ;
