import * as health from '../health.js';
import isReady, { addCheck } from '../services/readiness.js';
import logger from '../services/logger.js';
import express from 'express';

const { Router } = express;
const router = Router();

addCheck(health.isReady);

router.get('/_ah/health', (req, res) => {
    const probe = req.query.probe;
    if (probe === 'liveness') {
        health
            .isLive()
            .then(() => {
                res.sendStatus(200);
            })
            .catch(() => res.sendStatus(503));
    } else if (probe === 'readiness') {
        isReady()
            .then(() => {
                res.sendStatus(200);
            })
            .catch((err) => {
                logger.error(err);
                res.sendStatus(503);
            });
    } else {
        res.status(503).send();
    }
});

export default router;
