import pino from 'pino';
import config from '../config';

const logger = pino({
  level: config.logLevel,
  // TEMP: pino-pretty's worker-thread transport hangs silently in this
  // sandbox (no error, no output, no listen). Disabled for local
  // verification only — revert before committing.
  transport: undefined,
});

export default logger;
