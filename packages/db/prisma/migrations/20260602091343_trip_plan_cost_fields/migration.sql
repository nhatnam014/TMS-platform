-- DropForeignKey
ALTER TABLE "trip_plan_costs" DROP CONSTRAINT "trip_plan_costs_trip_cost_id_fkey";

-- AlterTable
ALTER TABLE "trip_costs" ADD COLUMN     "amount" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "trip_plan_costs" ADD COLUMN     "cost_name" TEXT,
ALTER COLUMN "trip_cost_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trip_plans" ADD COLUMN     "cau_duong_amount" DECIMAL(15,2),
ADD COLUMN     "cau_duong_name" TEXT,
ADD COLUMN     "chi_phi_khac_amount" DECIMAL(15,2),
ADD COLUMN     "chi_phi_khac_name" TEXT,
ADD COLUMN     "chi_phi_phat_sinh_amount" DECIMAL(15,2),
ADD COLUMN     "chi_phi_phat_sinh_name" TEXT,
ADD COLUMN     "chi_phi_trai_tuyen_amount" DECIMAL(15,2),
ADD COLUMN     "chi_phi_trai_tuyen_name" TEXT,
ADD COLUMN     "phi_cuoc_amount" DECIMAL(15,2),
ADD COLUMN     "phi_cuoc_name" TEXT,
ADD COLUMN     "phi_ha_amount" DECIMAL(15,2),
ADD COLUMN     "phi_ha_name" TEXT,
ADD COLUMN     "phi_nang_amount" DECIMAL(15,2),
ADD COLUMN     "phi_nang_name" TEXT,
ADD COLUMN     "phi_ve_sinh_amount" DECIMAL(15,2),
ADD COLUMN     "phi_ve_sinh_name" TEXT,
ADD COLUMN     "shd_ha" TEXT,
ADD COLUMN     "shd_nang" TEXT,
ADD COLUMN     "shd_ve_cong" TEXT,
ADD COLUMN     "shd_ve_sinh" TEXT,
ADD COLUMN     "ve_cong_amount" DECIMAL(15,2),
ADD COLUMN     "ve_cong_name" TEXT;

-- AddForeignKey
ALTER TABLE "trip_plan_costs" ADD CONSTRAINT "trip_plan_costs_trip_cost_id_fkey" FOREIGN KEY ("trip_cost_id") REFERENCES "trip_costs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
