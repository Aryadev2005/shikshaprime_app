import { Sequelize } from "sequelize";

const sequelize = new Sequelize("shikshaprime_collegea", "shikshaprime_collegea", "jezMf2wrWBihTdXj", {
  host: "69.62.84.110",
  port: 3306,
  dialect: "mysql",
});

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB successfully.");
    const [logs] = await sequelize.query(`
      SELECT 
        cl.*,
        s.student_name AS student_name,
        s.student_id AS student_public_id
      FROM library_clearance_logs cl
      LEFT JOIN students s ON cl.student_id = s.id
      WHERE cl.is_deleted = 0
      ORDER BY cl.id DESC
      LIMIT 10;
    `);
    console.log("Joint Library Clearance Logs:", JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    await sequelize.close();
  }
}

main();
