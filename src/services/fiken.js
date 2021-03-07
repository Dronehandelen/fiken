import axios from 'axios';
import fikenConfig from '../config/fiken.js';
import moment from 'moment';
import Sentry from '@sentry/node';

const request = async (options) =>
    axios({
        ...options,
        url: options.raw
            ? options.url
            : `${fikenConfig.url}/companies/${fikenConfig.companySlug}${options.url}`,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${fikenConfig.key}`,
        },
    });

const createVippsSettlement = async (
    settlementId,
    date,
    amountToBankAccount
) => {
    const fikenDate = (date) => moment(date).format('YYYY-MM-DD');

    try {
        await request({
            method: 'POST',
            url: '/generalJournalEntries',
            data: {
                description: `Vipps oppgjør med id ${settlementId}`,
                journalEntries: [
                    {
                        date: fikenDate(date),
                        description: `Vipps oppgjør med id ${settlementId}`,
                        lines: [
                            {
                                amount: amountToBankAccount * 100,
                                debitAccount: fikenConfig.vippsAccountNumber,
                                debitVatCode: 0,
                                creditAccount:
                                    fikenConfig.vippsCloudAccountNumber,
                                creditVatCode: 0,
                            },
                        ],
                    },
                ],
            },
        });
    } catch (e) {
        console.log(e.response.data);
        Sentry.captureException(e);
        throw e;
    }
};

export default {
    createVippsSettlement,
};
