import { DEROHALO_PROTOCOL, XSWD_DEFAULTPORT } from 'Constants';
import { useEffect, useState, useRef, useReducer, useCallback } from 'react';
import type { RefObject } from 'react';
import { useSelector } from 'react-redux';
import store, { RootState } from 'store';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { doConnect, useBusy, useIsConnected } from './deroHooks';
import { setDeroPrice, updateQuote } from 'helpers/ExchangeHelper';
import { useIndexedDb } from 'browserStorage/indexedDb';
import { setDefaultContracts } from 'helpers/ContractHelper';
import { prepareChats } from 'helpers/ChatHelper';
import { ProtocolHelper } from 'helpers/ProtocolHelper';
import { openWelcomeScreen } from 'components/Main/WelcomeDialog';

export const setCurrentTab = (newTab: string) => {
    store.dispatch(mainStateActions.setCurrentTab(newTab));
};

export const useCurrentTab = () => {
    const currentTab: string = useSelector((state: RootState) => state.mainState.currentTab);

    return currentTab;
};

export const useBusyBackdrop = () => {
    const busyBackdrop: IBusyBackdrop = useSelector((state: RootState) => state.mainState.busyBackdrop);

    return busyBackdrop;
};

export const setBusyBackdrop = (open: boolean, message?: string) => {
    store.dispatch(mainStateActions.setBusyBackdrop({ open, message }));
};

export const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            if (handler) {
                clearTimeout(handler);
            }
        };
    }, [value, delay]);

    return debouncedValue;
};

const updateCurrentTime = () => {
    store.dispatch(mainStateActions.updateCurrentTime());
};

export const useCurrentTime = (isNeeded: boolean = true) => {
    const currentTime: number = useSelector((state: RootState) => (isNeeded ? state.mainState.currentTime : 0));
    return currentTime;
};

export const useInterval = (callback: () => void, delay: number, isNeeded: boolean) => {
    useEffect(() => {
        if (isNeeded) {
            const intervalId = window.setInterval(callback, delay);
            return () => window.clearInterval(intervalId);
        }
    }, [callback, delay, isNeeded]);
};

export const useForceUpdate = () => {
    const [_, forceUpdate] = useReducer((x: number) => x + 1, 0);

    return forceUpdate;
};

export const useStartup = (): void => {
    const isConnected = useIsConnected();
    const isBusy = useBusy();
    const hasRun = useRef(false);

    useEffect(() => {
        if (!hasRun.current) {
            console.log('Application started');
            ProtocolHelper.init();
            setDefaultContracts();
            prepareChats();
            window.setInterval(updateCurrentTime, 1000);
            doConnect();
            openWelcomeScreen(true);
            hasRun.current = true;
        }
        return () => {};
    }, []);

    useIndexedDb();

    const { displayInUsd, updateFrequencyUsd } = usePreferences();

    useEffect(() => {
        let interval: number = 0;
        if (displayInUsd) {
            updateQuote();
            interval = window.setInterval(updateQuote, updateFrequencyUsd * 1000);
        } else {
            setDeroPrice(-1);
        }

        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [displayInUsd, updateFrequencyUsd, isConnected]);
};

export const getXswdPort = () => {
    const searchParams = new URLSearchParams(window.location.search);

    const xswdportString = searchParams.get('xswdport');
    const url = searchParams.get('url');

    let xswdport = XSWD_DEFAULTPORT;

    if (url) {
        const params: Record<string, string> = {};

        let regex = new RegExp(`^web\\+${DEROHALO_PROTOCOL}:`);
        const givenUrl = decodeURIComponent(url).replace(regex, '');

        const pairs = givenUrl.split('&');

        pairs.forEach((pair) => {
            const [key, value] = pair.split('=');
            params[key] = decodeURIComponent(value || '');
        });

        if (params['xswdport']) {
            xswdport = parseInt(params['xswdport']);
            if (isNaN(xswdport)) xswdport = XSWD_DEFAULTPORT;
            else return xswdport;
        }
    }

    if (xswdportString) {
        xswdport = parseInt(xswdportString);
        if (isNaN(xswdport)) xswdport = XSWD_DEFAULTPORT;
    }

    return xswdport;
};

export const getConnectionType = () => {
    const connectionType = store.getState().mainState.connectionType;
    return connectionType;
};

export const usePreferences = () => {
    const xswdport = getXswdPort();

    const connectionType = useSelector((state: RootState) => state.mainState.connectionType);

    const setConnectionType = (connectionType: ConnectionType) => {
        store.dispatch(mainStateActions.setConnectionType(connectionType));
    };

    const displayInUsd = useSelector((state: RootState) => state.mainState.displayInUsd);

    const setDisplayInUsd = (displayInUsd: boolean) => {
        store.dispatch(mainStateActions.setDisplayInUsd(displayInUsd));
    };

    const updateFrequencyUsd = useSelector((state: RootState) => state.mainState.updateFrequencyUsd);

    const setUpdateFrequencyUsd = (updateFrequencyUsd: number) => {
        store.dispatch(mainStateActions.setUpdateFrequencyUsd(updateFrequencyUsd));
    };

    const showContractVerificationAlways = useSelector((state: RootState) => state.mainState.showContractVerificationAlways);

    const setShowContractVerificationAlways = (showContractVerificationAlways: boolean) => {
        store.dispatch(mainStateActions.setShowContractVerificationAlways(showContractVerificationAlways));
    };

    return { xswdport, connectionType, setConnectionType, displayInUsd, setDisplayInUsd, updateFrequencyUsd, setUpdateFrequencyUsd, showContractVerificationAlways, setShowContractVerificationAlways };
};

export const isShowContractVerificationAlways = () => {
    return store.getState().mainState.showContractVerificationAlways;
};

export const useRunIfVisible = (divRef: RefObject<HTMLDivElement>, callback: () => void, updateInterval: number) => {
    useEffect(() => {
        let interval: number;
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.intersectionRatio > 0) {
                    if (callback) callback();
                    if (updateInterval) {
                        interval = window.setInterval(() => {
                            if (callback) callback();
                        }, updateInterval);
                    }
                } else {
                    if (interval) window.clearInterval(interval);
                }
            });
        });

        if (divRef.current) observer.observe(divRef.current);
        return () => {
            observer.disconnect();
            if (interval) window.clearInterval(interval);
        };
    }, [callback, divRef]);
};

export const useHorizontalWheelScroll = ({
    pixel = 50,
    disabled = false,
    preventDefaultAlways = false,
}: {
    pixel?: number;
    disabled?: boolean;
    preventDefaultAlways?: boolean;
} = {}) => {
    const [element, setElement] = useState<HTMLElement | null>(null);

    const ref = useCallback((node: HTMLElement | null) => {
        if (node !== null) {
            setElement(node);
        }
    }, []);

    useEffect(() => {
        if (element && !disabled) {
            const onWheel = (e: WheelEvent) => {
                if (e.deltaY === 0) return;

                const maxScrollLeft = element.scrollWidth - element.clientWidth;
                const isAtLeftEdge = element.scrollLeft === 0;
                const isAtRightEdge = element.scrollLeft === maxScrollLeft;

                if ((e.deltaY < 0 && !isAtLeftEdge) || (e.deltaY > 0 && !isAtRightEdge)) {
                    e.preventDefault();
                    element.scrollBy({
                        left: e.deltaY < 0 ? -pixel : pixel,
                    });
                } else if (preventDefaultAlways) {
                    e.preventDefault();
                }
            };

            element.addEventListener('wheel', onWheel, { passive: false });
            return () => element.removeEventListener('wheel', onWheel);
        }
    }, [element, pixel, disabled]);

    return ref;
};

export const getPendingAction = () => {
    return store.getState().mainState.pendingAction as IHaloButtonUrlInvoke | null;
};

export const setPendingAction = (pendingAction: IHaloButtonUrlInvoke | null) => {
    store.dispatch(mainStateActions.setPendingAction(pendingAction));
};
