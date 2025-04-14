import logger from '../utils/logger.js';

const requestLogger = (req, res, next) => {
  if (req.originalUrl.startsWith('/docs')) {
    return next();
  }

  const startTime = Date.now();
  const { method, originalUrl } = req;
  const userId = req.userId || 'unauthenticated';
  const userRole = req.role || 'unknown';

  const originalEnd = res.end;

  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.info(
      `API ${method} ${originalUrl} | Status: ${statusCode} | Time: ${responseTime}ms | User: ${userId} (${userRole})`
    );

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

export default requestLogger;
