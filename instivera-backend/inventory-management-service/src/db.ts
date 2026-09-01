import mysql from "mysql2/promise";
import { config } from "./config";

export const pool = mysql.createPool({
          port: Number(config.db.port),
          host: config.db.host,
          user: config.db.user,
          password: config.db.pass,
          database: config.db.name,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
});