import { IS_DEBUG } from 'Constants';

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const retryOperation = <T,>(operation: () => Promise<T>, delay: number, retries: number): Promise<T> => {
    return new Promise((resolve, reject) => {
        const attemptOperation = (currentRetries: number): void => {
            operation()
                .then(resolve)
                .catch((reason: Error) => {
                    if (IS_DEBUG) {
                        console.log('Retries left: ', currentRetries - 1, reason.message);
                    }
                    if (currentRetries > 0) {
                        wait(delay)
                            .then(() => retryOperation(operation, delay, currentRetries - 1))
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(reason);
                    }
                });
        };

        attemptOperation(retries);
    });
};

export const getBrowser = () => {
    let userAgent = navigator.userAgent;
    let browserName;

    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = 'chrome';
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = 'firefox';
    } else if (userAgent.match(/safari/i)) {
        browserName = 'safari';
    } else if (userAgent.match(/opr\//i)) {
        browserName = 'opera';
    } else if (userAgent.match(/edg/i)) {
        browserName = 'edge';
    } else {
        browserName = 'No browser detection';
    }

    return browserName;
};

export const updateOnlyChangedProperties = (oldObject: any, newObject: any) => {
    for (let prop in oldObject) {
        if (!newObject.hasOwnProperty(prop)) {
            delete oldObject[prop];
        }
    }

    for (let prop in newObject) {
        oldObject[prop] = newObject[prop];
    }
};

export const bindArguments = (fn: Function, ...args: any[]) => {
    return function (...moreArgs: any[]) {
        return fn(...args, ...moreArgs);
    };
};

export const replacerWithPath = (replacer: (field: string, value: any, path: string) => any) => {
    const m = new Map();

    return function (this: any, field: string, value: any): any {
        const pathname = m.get(this);
        let path;

        if (pathname) {
            const suffix = Array.isArray(this) ? `[${field}]` : `.${field}`;

            path = pathname + suffix;
        } else {
            path = field;
        }

        if (value === Object(value)) {
            m.set(value, path);
        }

        return replacer.call(this, field, value, path);
    };
};

export const fileOrBlobToBase64 = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = () => {
            reject(new Error('Error converting file or blob to base64'));
        };
        reader.readAsDataURL(fileOrBlob);
    });
};

export const fileToBlob = async (file: File): Promise<Blob> => {
    return new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });
};

export const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

export const goToLink = (url: string, openInNewWindow: boolean = true) => {
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    if (openInNewWindow) {
        link.target = '_blank';
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
