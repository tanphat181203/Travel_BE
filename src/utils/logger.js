import dotenv from 'dotenv';
dotenv.config();

import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.uncolorize(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'http',
  levels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
});

export default logger;
