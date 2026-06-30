-- The AiChat table may have been created at runtime (ensureAiChatTable) without
-- the User foreign key. Add it only if it is missing so this is safe to run
-- against databases where the previous migration already created the FK.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AiChat_userId_fkey'
  ) THEN
    ALTER TABLE "AiChat"
      ADD CONSTRAINT "AiChat_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
