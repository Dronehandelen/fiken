import moment from 'moment';

let lastDbSuccess = moment();

export const isLive = async () => {
    return true;
};

export const isReady = async () => {
    return true;
};
