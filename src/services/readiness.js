import logger from './logger.js';

let _isShutdown = false;
let _checks = [];
let _cleanups = [];

process.on('SIGTERM', () => {
    logger.debug('Received SIGTERM');
    _isShutdown = true;
    Promise.all(_cleanups.map(cleanup => cleanup()))
        .then(() => process.exit())
        .catch(() => process.exit());
});

export const isShutdown = () => _isShutdown;
export const addCheck = check => _checks.push(check);
export const addCleanup = cleanup => _cleanups.push(cleanup);

export default async () => {
    if (isShutdown()) {
        throw Error('Shutting down');
    }

    await Promise.all(_checks.map(check => check()));
};
