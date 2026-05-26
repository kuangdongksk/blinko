-- Enable user registration in Blinko
-- This SQL script enables user registration by setting the isAllowRegister config

INSERT INTO "config" ("key", "config", "userId", "createdAt", "updatedAt")
VALUES ('isAllowRegister', '{"type": "boolean", "value": true}', NULL, NOW(), NOW())
ON CONFLICT ("key") DO UPDATE SET
  "config" = '{"type": "boolean", "value": true}',
  "updatedAt" = NOW;

SELECT 'Registration enabled successfully!' as message;
