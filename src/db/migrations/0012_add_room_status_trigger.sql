DELIMITER //

CREATE TRIGGER update_room_status_before_update
BEFORE UPDATE ON rooms
FOR EACH ROW
BEGIN
    IF NEW.capacity = NEW.occupied_seats THEN
        SET NEW.is_active = 0;
    ELSE
        SET NEW.is_active = 1;
    END IF;
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