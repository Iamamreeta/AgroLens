require('dotenv').config();
const { Sequelize } = require('sequelize');

const REPAIR_SQL = `
BEGIN;
 
DO $$ BEGIN
  CREATE TYPE "public"."enum_disease_info_severity"
    AS ENUM ('None', 'Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
 
ALTER TABLE "disease_info" ALTER COLUMN "severity" DROP DEFAULT;
 
UPDATE "disease_info" SET "severity" = 'Medium'
WHERE "severity" IS NULL
   OR "severity"::text NOT IN ('None', 'Low', 'Medium', 'High', 'Critical');
 
ALTER TABLE "disease_info"
  ALTER COLUMN "severity" TYPE "public"."enum_disease_info_severity"
  USING "severity"::text::"public"."enum_disease_info_severity";
 
ALTER TABLE "disease_info"
  ALTER COLUMN "severity" SET DEFAULT 'Medium'::"public"."enum_disease_info_severity";
 
COMMIT;
`;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected. Repairing disease_info.severity ...');
 
    await sequelize.query(REPAIR_SQL);
    console.log('✅ Column repaired.');
 
    const [rows] = await sequelize.query(`
      SELECT column_name, data_type, udt_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'disease_info' AND column_name = 'severity';
    `);
    console.table(rows);
 
    process.exit(0);
  } catch (err) {
    console.error('❌ Repair failed:', err.message);
    process.exit(1);
  }
})();