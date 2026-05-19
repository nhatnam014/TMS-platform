import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TMS database...");

  // Seed Locations
  const locations = [
    { code: "DEPOT_5A", name: "Depot 5A", locationType: "DEPOT" as const },
    { code: "GREEN_LT", name: "Green Logistics", locationType: "DEPOT" as const },
    { code: "SOTRANS", name: "Sotrans Depot", locationType: "DEPOT" as const },
    { code: "CAT_LAI", name: "Cảng Cát Lái", locationType: "PORT" as const },
    { code: "HBCX_TCTT", name: "HBCX Tân Cảng Tổng Tuyến", locationType: "PORT" as const },
    { code: "HBCX_SSIT", name: "HBCX SSIT", locationType: "PORT" as const },
    { code: "HBCX_TCIT", name: "HBCX TCIT", locationType: "PORT" as const },
    { code: "ICD_SONG_THAN", name: "ICD Sóng Thần", locationType: "ICD" as const },
    { code: "KCN_QILU", name: "KCN Qilu (Bình Dương)", locationType: "INDUSTRIAL_ZONE" as const },
    { code: "CVT", name: "CVT", locationType: "INDUSTRIAL_ZONE" as const },
    { code: "CHAN_THAT_ST", name: "Chân Thật Sóng Thần", locationType: "WAREHOUSE" as const },
    { code: "BINH_DUONG", name: "Bình Dương (general)", locationType: "OTHER" as const },
    { code: "PHUC_LONG", name: "Phúc Long", locationType: "DEPOT" as const },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }
  console.log(`  ✅ ${locations.length} locations seeded`);

  // Seed Customers
  const customers = [
    { code: "SAILUN_TAL", name: "SAILUN TAL" },
    { code: "FUTIAN_MB", name: "FUTIAN MB" },
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { code: cust.code },
      update: {},
      create: cust,
    });
  }
  console.log(`  ✅ ${customers.length} customers seeded`);

  // Seed Carriers (Đơn vị vận chuyển)
  const carriers = [
    { code: "NHA_PHUONG", name: "NHA PHUONG" },
    { code: "LUCKY", name: "LUCKY" },
    { code: "ANH_KHOI", name: "ANH KHÔI" },
    { code: "NHA_ANH", name: "NHA ANH" },
    { code: "DTP", name: "DTP" },
  ];

  for (const carrier of carriers) {
    await prisma.carrier.upsert({
      where: { code: carrier.code },
      update: {},
      create: carrier,
    });
  }
  console.log(`  ✅ ${carriers.length} carriers seeded`);

  // Seed Admin User
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD environment variable is required");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash, role: "ADMIN" },
  });
  console.log("  ✅ Admin user seeded");

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
