const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (msg: any) => {
    if (isDev) console.log(`[DEBUG] ${msg}`);
  },
  info: (msg: any) => console.log(`[INFO] ${msg}`),
  warn: (msg: any) => console.warn(`[WARN] ${msg}`),
  error: (msg: any, err?: any) => {
    console.error(`[ERROR] ${msg}`);
    if (err) console.error(err);
  },
};

export default logger;