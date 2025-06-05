-- Create a new login (devuser)
CREATE LOGIN devuser WITH PASSWORD = '!Passw0rd';

-- Create a user mapped to the login
USE master;
CREATE USER devuser FOR LOGIN devuser;

-- Grant permissions (adjust as needed)
ALTER SERVER ROLE sysadmin ADD MEMBER devuser;  -- Full admin (for dev only)
-- OR, for restricted access:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO devuser;