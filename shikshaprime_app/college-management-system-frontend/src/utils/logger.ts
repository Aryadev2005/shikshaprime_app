import pino from "pino";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

const logger = { 
  info(...args: Parameters<typeof baseLogger.info>) { 
    baseLogger.info(...args); 
  }, 
  warn(...args: Parameters<typeof baseLogger.warn>) { 
    baseLogger.warn(...args); 
  }, 
  error(...args: Parameters<typeof baseLogger.error>) {
    baseLogger.error(...args); 
  }, 
};

export default logger;
