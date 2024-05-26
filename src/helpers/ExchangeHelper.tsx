import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';

const TRADEOGRE_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://tradeogre.com/api/v1/ticker/DERO-USDT');
const KUCOIN_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://api.kucoin.com/api/v1/market/stats?symbol=DERO-USDT');
const COINEX_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://api.coinex.com/v1/market/ticker?market=derousdt');

export const getQuoteTradeOgre = async () => {
    return await fetch(TRADEOGRE_URL)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
                throw new Error('Bad response from server');
            }
            return response;
        })
        .then((response) => response.json())
        .then((data) => {
            const price = parseFloat(data.price);
            const volume = parseFloat(data.volume);
            if (isNaN(price) || isNaN(volume)) throw new Error(`Error: Price ${price} / Volume ${volume}`);
            return { price, volume };
        });
};

export const getQuoteKuCoin = async () => {
    return await fetch(KUCOIN_URL)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
                throw new Error('Bad response from server');
            }
            return response;
        })
        .then((response) => response.json())
        .then((data) => {
            const price = parseFloat(data.data.last);
            const volume = parseFloat(data.data.volValue);
            if (isNaN(price) || isNaN(volume)) throw new Error(`Error: Price ${price} / Volume ${volume}`);
            return { price, volume };
        });
};

export const getQuoteCoinEx = async () => {
    return await fetch(COINEX_URL)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
                throw new Error('Bad response from server');
            }
            return response;
        })
        .then((response) => response.json())
        .then((data) => {
            const price = parseFloat(data.data.ticker.last);
            const volume = parseFloat(data.data.ticker.vol);
            if (isNaN(price) || isNaN(volume)) throw new Error(`Error: Price ${price} / Volume ${volume}`);
            return { price, volume };
        });
};

export const getQuote = async () => {
    let quotes = [];

    try {
        quotes.push(await getQuoteTradeOgre());
    } catch (e) {
        console.error(e);
    }
    /*try {
        quotes.push(await getQuoteKuCoin());
    } catch (e) {
        console.error(e);
    }*/
    try {
        quotes.push(await getQuoteCoinEx());
    } catch (e) {
        console.error(e);
    }

    let totalVolume = quotes.reduce((acc, quote) => {
        return acc + quote.volume;
    }, 0);

    let lastPrice = -1;
    if (totalVolume > 0) {
        lastPrice = quotes.reduce((acc, quote) => {
            return acc + (quote.price * quote.volume) / totalVolume;
        }, 0);
    }

    return lastPrice;
};

export const updateQuote = async () => {
    const lastPrice = await getQuote();
    if (lastPrice > -1) {
        setDeroPrice(lastPrice);
    }
};

export const setDeroPrice = (price: number) => {
    store.dispatch(mainStateActions.setDeroPrice(price));
};

export const useDeroPrice = () => {
    const deroPrice = useSelector((state: RootState) => state.mainState.deroPrice);
    return deroPrice;
};
