-- Drop database if exists and create new one
DROP DATABASE IF EXISTS event_booking_db;
CREATE DATABASE event_booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_booking_db;

-- Users table with enhanced security
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'organizer', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0 CHECK (failed_login_attempts >= 0),
    lockout_time DATETIME,
    reset_token VARCHAR(100),
    reset_token_expiry DATETIME,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (reset_token_expiry > created_at)
) ENGINE=InnoDB;

-- Categories table
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Events table with enhanced validation
CREATE TABLE events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    short_description VARCHAR(255),
    date DATE NOT NULL,
    time TIME NOT NULL,
    end_date DATE,
    end_time TIME,
    location VARCHAR(200) NOT NULL,
    venue_details TEXT,
    capacity INT NOT NULL CHECK (capacity > 0),
    total_seats INT NOT NULL CHECK (total_seats > 0),
    available_seats INT NOT NULL CHECK (available_seats >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category_id INT,
    organizer_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CHECK (end_date >= date),
    CHECK (available_seats <= total_seats)
) ENGINE=InnoDB;

-- Seats table with validation
CREATE TABLE seats (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    seat_type ENUM('regular', 'premium', 'vip') DEFAULT 'regular',
    price_multiplier DECIMAL(3,2) DEFAULT 1.00 CHECK (price_multiplier >= 1.00),
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat_event (event_id, seat_number)
) ENGINE=InnoDB;

-- Bookings table with validation
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Booked seats table with validation
CREATE TABLE booked_seats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL CHECK (price_paid >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_booking_seat (booking_id, seat_id)
) ENGINE=InnoDB;

-- Payments table with enhanced tracking
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method ENUM('stripe', 'razorpay', 'paypal', 'bank_transfer') NOT NULL,
    payment_status ENUM('created', 'authorized', 'captured', 'failed', 'refunded') DEFAULT 'created',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_transaction (transaction_id)
) ENGINE=InnoDB;

-- Event images table
CREATE TABLE event_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Refresh tokens table with enhanced security
CREATE TABLE refresh_tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    is_blacklisted BOOLEAN DEFAULT FALSE,
    expiry DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (expiry > created_at)
) ENGINE=InnoDB;

-- Create indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_event_date ON events(date);
CREATE INDEX idx_event_category ON events(category_id);
CREATE INDEX idx_event_organizer ON events(organizer_id);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_booking_event ON bookings(event_id);
CREATE INDEX idx_seat_event ON seats(event_id);
CREATE INDEX idx_payment_status ON payments(payment_status);
CREATE INDEX idx_payment_booking ON payments(booking_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(refresh_token);
CREATE INDEX idx_token_user ON refresh_tokens(user_id);

-- Create trigger to update available seats
DELIMITER //
CREATE TRIGGER after_booking_status_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        IF NEW.status = 'confirmed' THEN
            UPDATE events e
            SET e.available_seats = e.available_seats - (
                SELECT COUNT(*) FROM booked_seats bs
                WHERE bs.booking_id = NEW.booking_id
            )
            WHERE e.event_id = NEW.event_id;
        ELSEIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
            UPDATE events e
            SET e.available_seats = e.available_seats + (
                SELECT COUNT(*) FROM booked_seats bs
                WHERE bs.booking_id = NEW.booking_id
            )
            WHERE e.event_id = NEW.event_id;
        END IF;
    END IF;
END//
DELIMITER ;
