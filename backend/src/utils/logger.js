const path = require('path');
const winston = require('winston');

const transports = [
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error'
  })
];

if (process.env.NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({ level: 'debug' }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports
});

logger.audit = (entry) => logger.info({ type: 'audit', ...entry });

module.exports = logger;
