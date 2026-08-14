-- CreateEnum
CREATE TYPE "PropertyImageSection" AS ENUM ('HALL', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'BALCONY', 'DINING', 'LIVING_ROOM', 'EXTERIOR', 'PARKING', 'OTHER');

-- AlterTable
ALTER TABLE "PropertyImage" ADD COLUMN     "section" "PropertyImageSection" NOT NULL DEFAULT 'OTHER';
