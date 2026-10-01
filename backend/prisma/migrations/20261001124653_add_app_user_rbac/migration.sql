-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'SALES_MANAGER', 'PROJECT_MANAGER', 'DEPARTMENT_MANAGER', 'WAREHOUSE_MANAGER', 'TECHNICIAN', 'WAREHOUSE_EMPLOYEE', 'SALES_EMPLOYEE', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_clerkUserId_key" ON "AppUser"("clerkUserId");

-- CreateIndex
CREATE INDEX "AppUser_role_idx" ON "AppUser"("role");

-- CreateIndex
CREATE INDEX "AppUser_isActive_idx" ON "AppUser"("isActive");
