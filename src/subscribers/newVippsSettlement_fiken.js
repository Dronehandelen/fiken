import { subscribe, topics, subscriptions } from '../services/pubsub/index.js';
import fikenService from '../services/fiken.js';

export const sendToFiken = async (vippsSettlement) => {
    await fikenService.createVippsSettlement(
        vippsSettlement.id,
        vippsSettlement.estimatedDateOnBankAccount,
        vippsSettlement.amountToBankAccount
    );
};

export default async (onSubscriptionError) => {
    await subscribe(
        subscriptions[topics.NEW_VIPPS_SETTLEMENT].SEND_TO_FIKEN,
        (message, ack) => {
            sendToFiken(message.payload.vippsSettlement)
                .then(() => ack())
                .catch((error) => {
                    onSubscriptionError(error);
                });
        }
    );
};
