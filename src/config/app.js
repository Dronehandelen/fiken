export default {
    isProd: process.env.NODE_ENV === 'production',
    googleProjectId: 'norfpv',
    port: parseInt(process.env.CONFIG_APP_PORT || 80),
    sentryUrl: process.env.SENTRY_URL,
    keyFilename:
        process.env.NODE_ENV === 'production'
            ? '/secrets/google/credentials.json'
            : undefined,
};
