import { Sequelize } from "sequelize";
import { config } from "./config";

async function main() {
  const sequelize = new Sequelize("shikshaprime_demo", "shikshaprime_main", config.db.pass, {
    host: config.db.host,
    port: Number(config.db.port),
    dialect: "mysql",
    logging: false
  });
  try {
    const [tables] = await sequelize.query("SHOW TABLES;");
    console.log("Tables in demo DB:", tables);

    const [users] = await sequelize.query("SELECT * FROM users;");
    console.log("Users in demo DB:", users);

    const [academicHistory] = await sequelize.query("SELECT * FROM student_academic_history;");
    console.log("Academic history rows:", academicHistory);

  } catch (error) {
    console.error("Error in main:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();
