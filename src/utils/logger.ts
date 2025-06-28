import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

const transports = [
  new winston.transports.Console({
    stderrLevels: [], // 🔁 Prevents using stderr for any log levels
    debugStdout: true, // ✅ Ensures debug-level logs use stdout
    forceConsole: true, // ✅ Forces logs to console, even in some edge cases
  }),
];
const Logger = winston.createLogger({
  levels,
  format,
  transports,
});

export const enableLogger = () => {
  const logger = winston.createLogger({
    levels,
    format,
    transports,
  });
  return logger;
};

export default Logger;
