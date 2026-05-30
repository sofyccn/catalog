-- AlterTable: split fullName into editable firstName + lastName.
-- fullName remains as the derived display name so existing UIs keep working.
ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName"  TEXT;
