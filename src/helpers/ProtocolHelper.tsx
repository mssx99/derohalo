import React, { useState, useEffect } from 'react';
import { DEROHALO_PROTOCOL, FALLBACK_DELAY } from 'Constants';
import { getPendingAction, setPendingAction } from 'hooks/mainHooks';
import { goToChat } from './ChatHelper';
import { isConnected } from 'hooks/deroHooks';

export class ProtocolHelper {
    public static init() {
        const fullDomain = this.getFullUrlPath();

        const searchParams = new URLSearchParams(window.location.search);
        const xswdportString = searchParams.get('xswdport');
        const xswdport = !xswdportString ? '' : `xswdport=${xswdportString}&`;

        navigator.registerProtocolHandler(`web+${DEROHALO_PROTOCOL}`, fullDomain + `/?${xswdport}url=%s`);

        this.processButtonAction();
    }

    public static processButtonAction() {
        const params: Record<string, string> = {};
        const searchParams = new URLSearchParams(window.location.search);
        let url = searchParams.get('url');
        if (url && url !== `web+${DEROHALO_PROTOCOL}:test`) {
            let regex = new RegExp(`^web\\+${DEROHALO_PROTOCOL}:`);
            url = url.replace(regex, '');

            const pairs = url.split('&');

            pairs.forEach((pair) => {
                const [key, value] = pair.split('=');
                params[key] = decodeURIComponent(value || '');
            });

            const pendingAction: IHaloButtonUrlInvoke = {
                action: params['action'] as HaloButtonActionType,
                data: JSON.parse(params['data']) as IHaloButtonChatActionParameters | IHaloButtonScidActionParameters,
            };

            console.log('pendingAction', pendingAction);
            setPendingAction(pendingAction);
        }
    }

    public static checkIfTest() {
        const searchParams = new URLSearchParams(window.location.search);
        let url = searchParams.get('url');

        return url === `web+${DEROHALO_PROTOCOL}:test`;
    }

    public static getFullUrlPath() {
        const currentDomain = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        const pathname = window.location.pathname.replace(/\/$/, '');

        return `${protocol}//${currentDomain}${port ? ':' + port : ''}${pathname}`;
    }

    public static call(action: string, data: any) {
        var customUrl = `${DEROHALO_PROTOCOL}://?action=` + encodeURIComponent(action) + '&data=' + encodeURIComponent(JSON.stringify(data));

        var link = document.createElement('a');
        link.href = customUrl;
        link.style.display = 'none';
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    public static doPendingAction() {
        const pendingAction = getPendingAction();
        if (!pendingAction) return;

        if (pendingAction.action === 'OPEN_CHAT') {
            const data = pendingAction.data as IHaloButtonChatActionParameters;

            const walletDirectoryEntry = {
                flags: ['CHAT'] as WalletDirectoryEntryType[],
                isSaved: false,
                address: data.address,
                alias: data.alias,
                description: data.defaultMessage,
            };

            goToChat(walletDirectoryEntry);
        } else {
            if (isConnected()) {
            }
        }
    }
}

export const useCheckProtocolHandler = (iFrame: HTMLIFrameElement | null) => {
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

    useEffect(() => {
        if (!iFrame) return;

        const timeoutId = setTimeout(() => {
            window.removeEventListener('message', messageListener);

            setIsRegistered(false);
        }, FALLBACK_DELAY);

        const messageListener = (event: MessageEvent) => {
            if (event.data !== 'derohalo supported') return;
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageListener);
            setIsRegistered(true);
        };

        window.addEventListener('message', messageListener);

        iFrame.src = `web+${DEROHALO_PROTOCOL}:test`;

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageListener);
        };
    }, [iFrame]);

    return isRegistered;
};
