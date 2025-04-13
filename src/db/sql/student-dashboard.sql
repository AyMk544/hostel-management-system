-- Function to get student profile with room information
CREATE FUNCTION get_student_profile(student_id VARCHAR(255))
RETURNS TABLE (
    name VARCHAR(255),
    email VARCHAR(255),
    roll_no VARCHAR(20),
    course VARCHAR(100),
    contact_no VARCHAR(20),
    room_number VARCHAR(20),
    room_capacity INT,
    room_occupied_seats INT,
    room_floor INT
) DETERMINISTIC
BEGIN
    RETURN (
        SELECT 
            u.name,
            u.email,
            sp.roll_no,
            sp.course,
            sp.contact_no,
            r.room_number,
            r.capacity as room_capacity,
            r.occupied_seats as room_occupied_seats,
            r.floor as room_floor
        FROM users u
        JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN rooms r ON sp.room_id = r.id
        WHERE u.id = student_id
    );
END;

-- Function to get pending queries count
CREATE FUNCTION get_pending_queries_count(student_id VARCHAR(255))
RETURNS INT DETERMINISTIC
BEGIN
    DECLARE count INT;
    SELECT COUNT(*) INTO count
    FROM queries
    WHERE student_id = student_id AND status = 'pending';
    RETURN count;
END;

-- Function to get current month's hostel payment
CREATE FUNCTION get_current_hostel_payment(student_id VARCHAR(255))
RETURNS TABLE (
    amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    due_date DATE,
    status VARCHAR(20)
) DETERMINISTIC
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    SET start_date = DATE_FORMAT(NOW(), '%Y-%m-01');
    SET end_date = LAST_DAY(NOW());
    
    RETURN (
        SELECT 
            amount,
            paid_amount,
            due_date,
            status
        FROM payments
        WHERE student_id = student_id 
        AND type = 'hostel'
        AND due_date BETWEEN start_date AND end_date
        LIMIT 1
    );
END;

-- Function to get current month's mess payment
CREATE FUNCTION get_current_mess_payment(student_id VARCHAR(255))
RETURNS TABLE (
    amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    due_date DATE,
    status VARCHAR(20)
) DETERMINISTIC
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    SET start_date = DATE_FORMAT(NOW(), '%Y-%m-01');
    SET end_date = LAST_DAY(NOW());
    
    RETURN (
        SELECT 
            amount,
            paid_amount,
            due_date,
            status
        FROM payments
        WHERE student_id = student_id 
        AND type = 'mess'
        AND due_date BETWEEN start_date AND end_date
        LIMIT 1
    );
END;

-- Function to get latest fee structure
CREATE FUNCTION get_latest_fee_structure()
RETURNS TABLE (
    id VARCHAR(36),
    year INT,
    semester VARCHAR(20),
    single_room_fees INT,
    double_room_fees INT,
    triple_room_fees INT,
    hostel_fees INT,
    mess_fees INT,
    due_date DATE
) DETERMINISTIC
BEGIN
    RETURN (
        SELECT *
        FROM fee_structures
        ORDER BY year DESC, created_at DESC
        LIMIT 1
    );
END;

-- Function to get complete dashboard data
CREATE FUNCTION get_student_dashboard_data(student_id VARCHAR(255))
RETURNS JSON DETERMINISTIC
BEGIN
    DECLARE profile JSON;
    DECLARE pending_queries INT;
    DECLARE hostel_payment JSON;
    DECLARE mess_payment JSON;
    DECLARE fee_structure JSON;
    DECLARE result JSON;
    
    -- Get student profile
    SELECT JSON_OBJECT(
        'name', name,
        'email', email,
        'rollNo', roll_no,
        'course', course,
        'contactNo', contact_no,
        'roomNumber', room_number,
        'roomType', CASE 
            WHEN room_capacity = 1 THEN 'Single'
            WHEN room_capacity = 2 THEN 'Double'
            WHEN room_capacity = 3 THEN 'Triple'
            ELSE 'Not Assigned'
        END
    ) INTO profile
    FROM get_student_profile(student_id);
    
    -- Get pending queries count
    SET pending_queries = get_pending_queries_count(student_id);
    
    -- Get current payments
    SELECT JSON_OBJECT(
        'amount', amount,
        'paidAmount', paid_amount,
        'dueDate', due_date,
        'status', status
    ) INTO hostel_payment
    FROM get_current_hostel_payment(student_id);
    
    SELECT JSON_OBJECT(
        'amount', amount,
        'paidAmount', paid_amount,
        'dueDate', due_date,
        'status', status
    ) INTO mess_payment
    FROM get_current_mess_payment(student_id);
    
    -- Get latest fee structure
    SELECT JSON_OBJECT(
        'id', id,
        'year', year,
        'semester', semester,
        'singleRoomFees', single_room_fees,
        'doubleRoomFees', double_room_fees,
        'tripleRoomFees', triple_room_fees,
        'hostelFees', hostel_fees,
        'messFees', mess_fees,
        'dueDate', due_date
    ) INTO fee_structure
    FROM get_latest_fee_structure();
    
    -- Combine all data
    SET result = JSON_OBJECT(
        'profile', profile,
        'pendingQueries', pending_queries,
        'hostelPayment', hostel_payment,
        'messPayment', mess_payment,
        'feeStructure', fee_structure
    );
    
    RETURN result;
END; 