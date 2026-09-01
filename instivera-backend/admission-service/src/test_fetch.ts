import { Sequelize } from "sequelize";
import { config } from "./config";
import { defineStudentAcademicHistory } from "./models/tenant/studentAcademicHistory";

async function main() {
  const sequelize = new Sequelize("shikshaprime_demo", "shikshaprime_demo", config.db.pass, {
    host: config.db.host,
    port: Number(config.db.port),
    dialect: "mysql",
    logging: false
  });

  try {
    const StudentAcademicHistory = defineStudentAcademicHistory(sequelize);
    
    console.log("Querying 10TH...");
    const tenthRows = await StudentAcademicHistory.findAll({
      where: { user_id: 1, exam_name: "10TH" }
    });
    console.log("10TH Rows from model query:", JSON.stringify(tenthRows, null, 2));

    console.log("Querying 12TH...");
    const twelfthRows = await StudentAcademicHistory.findAll({
      where: { user_id: 1, exam_name: "12TH" }
    });
    console.log("12TH Rows from model query:", JSON.stringify(twelfthRows, null, 2));

  } catch (error) {
    console.error("Error in query test:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();
