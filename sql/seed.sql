USE event_booking_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
TRUNCATE TABLE event_images;
TRUNCATE TABLE payments;
TRUNCATE TABLE booked_seats;
TRUNCATE TABLE seats;
TRUNCATE TABLE bookings;
TRUNCATE TABLE events;
TRUNCATE TABLE categories;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert users with proper bcrypt hashes for password 'password123'
-- Note: All users have the same password for testing purposes
INSERT INTO users (name, email, password, role, is_active) VALUES
('Admin User', 'admin@eventbook.com', '$2b$12$/RywEYZAu0etnlhcv58tk.lGAEJmPzHqsYpLfmuuDo/LLt.YnQEQa', 'admin', true),
('Event Organizer 1', 'organizer1@eventbook.com', '$2b$12$/RywEYZAu0etnlhcv58tk.lGAEJmPzHqsYpLfmuuDo/LLt.YnQEQa', 'organizer', true),
('Event Organizer 2', 'organizer2@eventbook.com', '$2b$12$/RywEYZAu0etnlhcv58tk.lGAEJmPzHqsYpLfmuuDo/LLt.YnQEQa', 'organizer', true),
('Regular User 1', 'user1@eventbook.com', '$2b$12$/RywEYZAu0etnlhcv58tk.lGAEJmPzHqsYpLfmuuDo/LLt.YnQEQa', 'user', true),
('Regular User 2', 'user2@eventbook.com', '$2b$12$/RywEYZAu0etnlhcv58tk.lGAEJmPzHqsYpLfmuuDo/LLt.YnQEQa', 'user', true);

-- Insert event categories
INSERT INTO categories (name, description, image_url, is_active) VALUES
('Music Concerts', 'Live music performances of all genres', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=500', TRUE),
('Sports Events', 'Professional and amateur sports competitions', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500', TRUE),
('Theater & Arts', 'Plays, musicals, and art exhibitions', 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=500', TRUE),
('Conferences', 'Business and technology conferences', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500', TRUE),
('Workshops', 'Educational and skill-building workshops', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500', TRUE);

-- Insert events
INSERT INTO events (
    title, description, short_description, date, time, 
    end_date, end_time, location, venue_details,
    capacity, total_seats, available_seats, price, 
    category_id, organizer_id, image_url
) VALUES
('Summer Music Festival 2024', 
 'A 3-day music festival featuring top artists from around the world. Experience the best in pop, rock, and electronic music.',
 'Weekend music extravaganza with top artists',
 '2024-06-15', '16:00:00', '2024-06-17', '23:00:00',
 'Mumbai Grounds', 'Gate 3, Near Western Express Highway, Mumbai',
 5000, 5000, 5000, 2500.00, 
 1, 2, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500'),

('IPL Finals 2024',
 'Experience the grand finale of Indian Premier League 2024. Watch the top teams battle for the championship.',
 'T20 Championship final match',
 '2024-05-20', '19:30:00', '2024-05-20', '23:30:00',
 'Wankhede Stadium', 'North Stand, Marine Drive, Mumbai',
 35000, 35000, 35000, 3500.00,
 2, 2, 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500'),

('The Lion King Musical',
 'Award-winning Broadway musical with stunning visuals, amazing costumes, and unforgettable music.',
 'World-famous Broadway musical',
 '2024-04-05', '19:00:00', '2024-04-05', '22:30:00',
 'Delhi Auditorium', 'Central Delhi Theater District',
 500, 500, 500, 4500.00,
 3, 3, 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=500');

-- Insert seats for events
-- Music Festival VIP Seats (event_id 1)
INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier)
SELECT 1, CONCAT('VIP-', LPAD(num, 3, '0')), 'vip', 2.00
FROM (SELECT 1 + tens.num + hundreds.num * 10 as num
      FROM (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
           (SELECT 0 as num UNION SELECT 10 UNION SELECT 20 UNION SELECT 30 UNION SELECT 40 UNION SELECT 50 UNION SELECT 60 UNION SELECT 70 UNION SELECT 80 UNION SELECT 90) hundreds
      WHERE 1 + tens.num + hundreds.num * 10 <= 100) numbers;

-- IPL Finals Premium Seats (event_id 2)
INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier)
SELECT 2, CONCAT('P-', LPAD(num, 3, '0')), 'premium', 1.50
FROM (SELECT 1 + tens.num + hundreds.num * 10 as num
      FROM (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
           (SELECT 0 as num UNION SELECT 10 UNION SELECT 20 UNION SELECT 30 UNION SELECT 40 UNION SELECT 50 UNION SELECT 60 UNION SELECT 70 UNION SELECT 80 UNION SELECT 90) hundreds
      WHERE 1 + tens.num + hundreds.num * 10 <= 100) numbers;

-- Theater Premium Seats (event_id 3)
INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier)
SELECT 3, CONCAT('A-', LPAD(num, 2, '0')), 'premium', 1.50
FROM (SELECT 1 + tens.num + hundreds.num * 10 as num
      FROM (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
           (SELECT 0 as num UNION SELECT 10 UNION SELECT 20 UNION SELECT 30 UNION SELECT 40 UNION SELECT 50) hundreds
      WHERE 1 + tens.num + hundreds.num * 10 <= 50) numbers;


-- Insert event images
INSERT INTO event_images (event_id, image_url, is_primary, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500', TRUE, 1),
(1, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500', FALSE, 2),
(2, 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500', TRUE, 1),
(2, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500', FALSE, 2),
(3, 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=500', TRUE, 1),
(3, 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=500', FALSE, 2);




-- Insert sample bookings
-- INSERT INTO bookings (event_id, user_id, status, total_amount) VALUES
-- (1, 4, 'confirmed', 10000.00),
-- (2, 5, 'confirmed', 7000.00);

-- Insert booked seats (using first few seats from each event)
-- INSERT INTO booked_seats (booking_id, seat_id, price_paid) 
-- SELECT b.booking_id, s.seat_id, e.price * s.price_multiplier as price_paid
-- FROM bookings b
-- JOIN events e ON b.event_id = e.event_id
-- JOIN seats s ON e.event_id = s.event_id
-- WHERE (b.booking_id = 1 AND s.seat_number IN ('VIP-001', 'VIP-002'))
--    OR (b.booking_id = 2 AND s.seat_number IN ('P-001', 'P-002'));

-- Insert payments
-- INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id) VALUES
-- (1, 10000.00, 'razorpay', 'captured', 'pay_test123'),
-- (2, 7000.00, 'stripe', 'captured', 'ch_test456');

