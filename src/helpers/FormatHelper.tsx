import store from 'store';
import { DEFAULT_BLOCKTIME } from 'Constants';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export const formatDero = (value: Uint64, exact: boolean = true) => {
    const options = {
        minimumFractionDigits: 0,
        maximumFractionDigits: exact ? 5 : value > 10000000 ? 0 : value > 100000 ? 3 : 5,
    };

    const deros = value / 100000;

    return Number(deros).toLocaleString('en', options) + ' Deros';
};

export const formatUsd = (value: Uint64, deroPrice: number) => {
    const options = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };

    const formatted = Number((value * deroPrice) / 100000).toLocaleString('en', options) + ' USD';
    return formatted;
};

export const formatDeroAmount = (value: Uint64, onlyUsd: boolean = false, deroPrice: number = -1, preferUsd: boolean = false, displayInUsd?: boolean) => {
    if (displayInUsd === undefined) displayInUsd = store.getState().mainState.displayInUsd;
    if (deroPrice === -1 && !onlyUsd) deroPrice = store.getState().mainState.deroPrice;

    if (deroPrice === -1) displayInUsd = false;

    if (onlyUsd && !displayInUsd) return;

    const usdValue = formatUsd(value, deroPrice);

    if (onlyUsd) {
        return usdValue;
    }

    if (preferUsd && deroPrice > -1) {
        return usdValue;
    }

    const deroFormatted = formatDero(value);
    if (displayInUsd && deroPrice > -1) {
        return `${deroFormatted} ≈ ${usdValue}`;
    }
    return deroFormatted;
};

export const convertBlocksToYearsMonthsDaysHours = (blocks?: number, showSeconds: boolean = false) => {
    return convertSecondsToYearsMonthsDaysHours(blocks ? blocks * DEFAULT_BLOCKTIME : 0);
};

export const convertSecondsToYearsMonthsDaysHours = (totalSeconds: number, showSeconds: boolean = false) => {
    let remainingSeconds = totalSeconds;

    const years = Math.floor(remainingSeconds / (365 * 24 * 60 * 60));
    remainingSeconds -= years * 365 * 24 * 60 * 60;

    const months = Math.floor(remainingSeconds / (30 * 24 * 60 * 60));
    remainingSeconds -= months * 30 * 24 * 60 * 60;

    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    remainingSeconds -= days * 24 * 60 * 60;

    const hours = Math.floor(remainingSeconds / (60 * 60));
    remainingSeconds -= hours * 60 * 60;

    const minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds -= minutes * 60;

    const seconds = remainingSeconds;

    const array = new Array<string>();

    years && array.push(`${years} Year${years > 1 ? 's' : ''}`);
    months && array.push(`${months} Month${months > 1 ? 's' : ''}`);
    days && array.push(`${days} Day${days > 1 ? 's' : ''}`);
    hours && array.push(`${hours} Hour${hours > 1 ? 's' : ''}`);
    minutes && array.push(`${minutes} Minute${minutes > 1 ? 's' : ''}`);

    if (showSeconds && seconds) {
        array.push(`${seconds} Second${seconds > 1 ? 's' : ''}`);
    }

    if (!array.length) {
        return 'immediately';
    }
    return array.reduce((acc, s, index) => {
        if (array.length === 1) {
            return s;
        } else if (index === array.length - 1) {
            return acc + s;
        }

        if (index < array.length - 2) {
            acc += `${s}, `;
        } else {
            acc += `${s} and `;
        }
        return acc;
    }, '');
};

export const convertBlocksToFormattedTime = (blocks?: number) => {
    return convertSecondsToFormattedTime(blocks ? blocks * DEFAULT_BLOCKTIME : 0);
};

export const convertSecondsToFormattedTime = (seconds: number) => {
    const now = dayjs();
    const nowPlusSeconds = now.add(seconds, 'second');

    return nowPlusSeconds.format('YYYY-MM-DD HH:mm:ss');
};

export const formatKilobytes = (bytes: number = 0) => {
    return (bytes / 1024).toFixed(1);
};

export const formatTime = (time?: Dayjs | null) => {
    if (!time) return null;
    return time.format('YYYY-MM-DD HH:mm:ss');
};

export const formatNumber = (value: Uint64, minFractionDigits: number = 0, maxFractionDigits: number = 0) => {
    const options = {
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    };

    return Number(value).toLocaleString('en', options);
};

export const formatTimer = (milliseconds: number) => {
    milliseconds = Math.round(milliseconds);

    return dayjs.duration(milliseconds).format('m:ss.SSS');
};
