import { pool } from "../db";

const dbBreaker = {
          fire: async (): Promise<boolean> => {
                    try {
                              await pool.query("SELECT 1");
                              return true;
                    } catch (error) {
                              console.error("DB health check failed:", error);
                              return false;
                    }
          },
};

export default dbBreaker;
