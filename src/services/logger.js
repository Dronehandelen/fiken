import Winston from 'winston';
import LoggingWinston from '@google-cloud/logging-winston';

const logger = Winston.createLogger({
    level: 'debug',
    transports: [
        process.env.NODE_ENV === 'production'
            ? new LoggingWinston.LoggingWinston({
                  logName: process.env.CONTAINER_NAME,
              })
            : new Winston.transports.Console({
                  format: Winston.format.simple(),
              }),
    ],
});

export default logger;
