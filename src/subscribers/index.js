import '../setupDotenv.js';
import logger from '../services/logger.js';
import express from 'express';
import health from '../routes/health.js';
import appConfig from '../config/app.js';
import * as Readiness from '../services/readiness.js';
import Sentry from '@sentry/node';

if (appConfig.isProd) {
    Sentry.init({
        dsn: appConfig.sentryUrl,
        environment: process.env.NODE_ENV || 'development',
    });
}

const done = (error) => {
    if (error) {
        logger.error(error);
    }

    process.exit();
};

const onSubscriptionError = (error) => {
    logger.error(error.stack);
    Sentry.captureException(error);
};

setTimeout(() => {
    import(`./${process.argv[2]}.js`).then((jobDefinition) =>
        jobDefinition.default(onSubscriptionError).catch((error) => done(error))
    );
}, 2000);

const app = express();

app.use(health);

const server = app.listen(appConfig.port, () =>
    logger.info(`Subscriber health check listening on ${appConfig.port}`)
);

Readiness.addCleanup(async () => {
    server.close();
    logger.debug('Closed express.js gracefully');
});

export {};
