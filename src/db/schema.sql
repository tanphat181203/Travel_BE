-- 1. Users
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255),
    google_id VARCHAR(255),
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    refresh_token VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    avatar_url VARCHAR(255),
    phone_number VARCHAR(20) UNIQUE,
    address VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending_verification'
);

-- 2. SubscriptionPackage
CREATE TABLE IF NOT EXISTS SubscriptionPackage (
    package_id SERIAL PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    status VARCHAR(50)
);

-- 3. Tour
CREATE TABLE IF NOT EXISTS Tour (
    tour_id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES Users(id),
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(255) NOT NULL,
    departure_location VARCHAR(255) NOT NULL,
    description TEXT,
    destination TEXT[],
    region INTEGER NOT NULL,
    itinerary JSONB,
    max_participants INTEGER NOT NULL,
    availability BOOLEAN DEFAULT true,
    embedding vector(768)
);

-- 4. Departure
CREATE TABLE IF NOT EXISTS Departure (
    departure_id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES Tour(tour_id),
    start_date DATE NOT NULL,
    price_adult DECIMAL(10,2) NOT NULL,
    price_child_120_140 DECIMAL(10,2) NOT NULL,
    price_child_100_120 DECIMAL(10,2) NOT NULL,
    availability BOOLEAN DEFAULT true,
    description TEXT
);

-- 5. SellerSubscription
CREATE TABLE IF NOT EXISTS SellerSubscription (
    subscription_id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES Users(id),
    package_id INTEGER NOT NULL REFERENCES SubscriptionPackage(package_id),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(50),
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255)
);

-- 6. History
CREATE TABLE IF NOT EXISTS History (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    tour_id INTEGER NOT NULL REFERENCES Tour(tour_id),
    action_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. ChatbotHistory
CREATE TABLE IF NOT EXISTS ChatbotHistory (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    interaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT NOT NULL,
    response TEXT
);

-- 8. Review
CREATE TABLE IF NOT EXISTS Review (
    review_id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES Tour(tour_id),
    user_id INTEGER NOT NULL REFERENCES Users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Booking
CREATE TABLE IF NOT EXISTS Booking (
    booking_id SERIAL PRIMARY KEY,
    departure_id INTEGER NOT NULL REFERENCES Departure(departure_id),
    user_id INTEGER NOT NULL REFERENCES Users(id),
    num_adults INTEGER NOT NULL,
    num_children_120_140 INTEGER NOT NULL,
    num_children_100_120 INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(50) NOT NULL,
    special_requests TEXT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Images
CREATE TABLE IF NOT EXISTS Images (
    image_id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES Tour(tour_id),
    image_url VARCHAR(255) NOT NULL,
    description TEXT,
    is_cover BOOLEAN DEFAULT false,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Invoice
CREATE TABLE IF NOT EXISTS Invoice (
    invoice_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES Booking(booking_id),
    amount_due DECIMAL(10,2) NOT NULL,
    date_issued TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- 12. Checkout
CREATE TABLE IF NOT EXISTS Checkout (
    checkout_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES Booking(booking_id),
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255)
);

-- 13. Promotion
CREATE TABLE IF NOT EXISTS Promotion (
    promotion_id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'percent',
    discount DECIMAL(5,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 14. Tour_Promotion
CREATE TABLE IF NOT EXISTS Tour_Promotion (
    tour_id INTEGER NOT NULL REFERENCES Tour(tour_id),
    promotion_id INTEGER NOT NULL REFERENCES Promotion(promotion_id),
    PRIMARY KEY (tour_id, promotion_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON Users(status);
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON Users(refresh_token);

CREATE INDEX IF NOT EXISTS idx_tour_seller_id ON Tour(seller_id);
CREATE INDEX IF NOT EXISTS idx_tour_region ON Tour(region);
CREATE INDEX IF NOT EXISTS idx_tour_availability ON Tour(availability);

CREATE INDEX IF NOT EXISTS idx_departure_tour_id ON Departure(tour_id);
CREATE INDEX IF NOT EXISTS idx_departure_start_date ON Departure(start_date);
CREATE INDEX IF NOT EXISTS idx_departure_availability ON Departure(availability);

CREATE INDEX IF NOT EXISTS idx_subscriptionpackage_status ON SubscriptionPackage(status);

CREATE INDEX IF NOT EXISTS idx_sellersubscription_seller_id ON SellerSubscription(seller_id);
CREATE INDEX IF NOT EXISTS idx_sellersubscription_package_id ON SellerSubscription(package_id);
CREATE INDEX IF NOT EXISTS idx_sellersubscription_status ON SellerSubscription(status);

CREATE INDEX IF NOT EXISTS idx_history_user_id ON History(user_id);
CREATE INDEX IF NOT EXISTS idx_history_tour_id ON History(tour_id);
CREATE INDEX IF NOT EXISTS idx_history_action_type ON History(action_type);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON History(timestamp);

CREATE INDEX IF NOT EXISTS idx_chatbothistory_user_id ON ChatbotHistory(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbothistory_interaction_time ON ChatbotHistory(interaction_time);

CREATE INDEX IF NOT EXISTS idx_review_tour_id ON Review(tour_id);
CREATE INDEX IF NOT EXISTS idx_review_user_id ON Review(user_id);
CREATE INDEX IF NOT EXISTS idx_review_rating ON Review(rating);
CREATE INDEX IF NOT EXISTS idx_review_timestamp ON Review(timestamp);

CREATE INDEX IF NOT EXISTS idx_booking_departure_id ON Booking(departure_id);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON Booking(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON Booking(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_date ON Booking(booking_date);

CREATE INDEX IF NOT EXISTS idx_images_tour_id ON Images(tour_id);
CREATE INDEX IF NOT EXISTS idx_images_upload_date ON Images(upload_date);

CREATE INDEX IF NOT EXISTS idx_invoice_booking_id ON Invoice(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoice_date_issued ON Invoice(date_issued);

CREATE INDEX IF NOT EXISTS idx_checkout_booking_id ON Checkout(booking_id);
CREATE INDEX IF NOT EXISTS idx_checkout_payment_status ON Checkout(payment_status);
CREATE INDEX IF NOT EXISTS idx_checkout_payment_date ON Checkout(payment_date);

CREATE INDEX IF NOT EXISTS idx_promotion_status ON Promotion(status);
CREATE INDEX IF NOT EXISTS idx_promotion_start_date ON Promotion(start_date);
CREATE INDEX IF NOT EXISTS idx_promotion_end_date ON Promotion(end_date);

CREATE INDEX IF NOT EXISTS idx_tour_promotion_tour_id ON Tour_Promotion(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_promotion_promotion_id ON Tour_Promotion(promotion_id);