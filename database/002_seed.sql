INSERT INTO users (email, password_hash, full_name, role, is_verified)
VALUES
  ('admin@bimplatform.com', '$2a$12$oZOENGIuCwfpMUsfvV0YEurSJOU1eiA9SbKCASMiV7LywwNAhFSXK', 'Admin BIM', 'admin', true),
  ('arquitecto@bimplatform.com', '$2a$12$a07NUL9HU.mxX/US47YgjuaOui3u7olYReXbdUwjn5wkOQggecUHy', 'Carlos Arquitecto', 'user', true),
  ('ingeniero@bimplatform.com', '$2a$12$y5HsuYQMVRviWVfoE8spseyx7X/vvZI5FOVJBnux0unPLG2FwmOtq', 'María Ingeniera', 'user', true),
  ('cliente@bimplatform.com', '$2a$12$Pp5jMsWvfSAShNnPzspF2e.avtQnzna2j9tct.imxVjUw6ESHRfkG', 'Pedro Cliente', 'viewer', true)
ON CONFLICT (email) DO NOTHING;
