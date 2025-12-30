-- Migration: Change profile_image_url to LONGBLOB and rename to profile_image
-- Run this SQL in your MySQL database

USE banking;

-- Step 1: Modify column type to LONGBLOB
ALTER TABLE users 
MODIFY COLUMN profile_image_url LONGBLOB;

-- Step 2: Rename column
ALTER TABLE users 
CHANGE COLUMN profile_image_url profile_image LONGBLOB;

-- Verify the change
DESCRIBE users;
