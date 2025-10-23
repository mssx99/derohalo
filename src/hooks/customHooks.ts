import { MESSAGE_SEVERITY } from 'Constants';
import { addSnackbar } from 'components/screen/Snackbars';
import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import _ from 'underscore';

const useAnimation = (delay = 1000) => {
    const [isShow, setIsShow] = useState(true);
    const [isHide, setIsHide] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const setShow = (show: boolean) => {
        if (show) {
            setIsHide(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setTimeout(() => setIsShow(true), delay);
        } else {
            setIsShow(false);
            timeoutRef.current = setTimeout(() => setIsHide(true), delay);
        }
    };

    useEffect(
        () => () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        },
        []
    );

    return { isShow, isHide, setShow };
};

export default useAnimation;

export const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};

export const useDeepCallback = <T extends any[], R extends any[]>(callback: (...args: R) => void, dependencies: T): ((...args: R) => void) => {
    const prevDepsRef = useRef<T>();

    const memoizedCallback = useCallback(
        (...args: R) => {
            if (!_.isEqual(prevDepsRef.current, dependencies)) {
                prevDepsRef.current = dependencies;
                return callback(...args);
            }
        },
        [callback, dependencies]
    );

    return memoizedCallback;
};

export const useCopyToClipboard = () => {
    const copyToClipboard = useCallback((text: string) => {
        return navigator.clipboard
            .writeText(text)
            .then(() => {
                addSnackbar({ message: 'Copied successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
            })
            .catch((err) => {
                addSnackbar({ message: 'Error copying to clipboard...', severity: MESSAGE_SEVERITY.ERROR });
            });
    }, []);

    return copyToClipboard;
};

export const useEventListener = <T,>(eventName: string, handler: (event: CustomEvent<T>) => void, element: Window | Document | HTMLElement | RefObject<HTMLElement> = window) => {
    const savedHandler = useRef<(event: CustomEvent<T>) => void>();

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const isSupported = element && 'addEventListener' in element;
        if (!isSupported) return;

        const eventListener: EventListenerOrEventListenerObject = (event) => {
            savedHandler.current?.(event as CustomEvent<T>);
        };

        element.addEventListener(eventName, eventListener);

        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
};
