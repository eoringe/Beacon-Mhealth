-- Beacon mHealth Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  photo_url TEXT,
  phone_number VARCHAR(20),
  date_of_birth DATE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  fcm_token TEXT
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  blood_type VARCHAR(10),
  allergies TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_children_parent_id ON children(parent_id);

-- Milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  age_months INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_milestones_category_age ON milestones(category, age_months);

-- Child milestones tracking
CREATE TABLE child_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(child_id, milestone_id)
);

CREATE INDEX idx_child_milestones_child_id ON child_milestones(child_id);

-- Vaccines table
CREATE TABLE vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  recommended_age_months INTEGER NOT NULL,
  category VARCHAR(100),
  doses INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Child vaccinations
CREATE TABLE child_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE CASCADE,
  dose_number INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_date DATE,
  administered_date DATE,
  administered_by VARCHAR(255),
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_child_vaccinations_child_id ON child_vaccinations(child_id);
CREATE INDEX idx_child_vaccinations_status ON child_vaccinations(status);

-- Growth measurements
CREATE TABLE growth_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  age_months DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  head_circumference_cm DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_growth_measurements_child_id ON growth_measurements(child_id);
CREATE INDEX idx_growth_measurements_date ON growth_measurements(child_id, measurement_date DESC);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255),
  specialty VARCHAR(100),
  appointment_type VARCHAR(50),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
