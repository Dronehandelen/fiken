import PubSub from '@google-cloud/pubsub';
import appConfig from '../../config/app.js';
import logger from '../logger.js';
import topics from './topics.js';
import subscriptions from './subscriptions.js';

export { topics, subscriptions };

const pubsub = new PubSub.PubSub({
    projectId: appConfig.googleProjectId,
    keyFilename: appConfig.keyFilename,
});

const setup = async () => {
    const topics = Object.keys(subscriptions);
    for (let x = 0; x < topics.length; x++) {
        try {
            await pubsub.createTopic(topics[x]);
        } catch (e) {}

        const topicSubscriptions = Object.values(subscriptions[topics[x]]);

        for (let y = 0; y < topicSubscriptions.length; y++) {
            try {
                await pubsub
                    .topic(topics[x])
                    .createSubscription(topicSubscriptions[y]);
            } catch (e) {}
        }
    }
};

setup();

const dataToMessage = (data) => {
    const message = {
        payload: data,
    };

    return Buffer.from(JSON.stringify(message));
};

export const publishMessage = async (topic, data) => {
    let pubsubTopic;

    if (topic instanceof PubSub.Topic) {
        pubsubTopic = topic;
    } else {
        pubsubTopic = pubsub.topic(topic, {
            batching: {
                maxBytes: Math.pow(1024, 2) * 100,
                maxMilliseconds: 50,
                maxMessages: 10,
            },
        });
    }

    if (Array.isArray(data)) {
        const messageIds = await Promise.all(
            data.map((singleMessage) =>
                pubsubTopic.publish(dataToMessage(singleMessage))
            )
        );

        logger.debug(
            `${pubsubTopic.name}: Message ${messageIds.join(', ')} published.`
        );
    } else {
        const messageId = await pubsubTopic.publish(dataToMessage(data));

        logger.debug(`${pubsubTopic.name}: Message ${messageId} published.`);
    }
};

const subscribeDefaultOptions = {
    maxMessages: 1,
};

export const subscribe = async (
    subscriptionName,
    messageHandler,
    options = subscribeDefaultOptions
) => {
    options = {
        ...subscribeDefaultOptions,
        ...options,
    };

    const subscription = pubsub.subscription(subscriptionName, {
        flowControl: {
            allowExcessMessages: false,
            maxMessages: options.maxMessages,
        },
    });

    const onMessage = (message) => {
        const messageData = JSON.parse(message.data);

        logger.debug(`Received message ${message.id}`);

        messageHandler(messageData, () => message.ack());
    };

    subscription.on(`message`, onMessage);
    subscription.on(`error`, (error) => {
        logger.error(error);
        logger.error(error && error.message);
        logger.error(JSON.stringify(error));
    });
};

export default pubsub;
