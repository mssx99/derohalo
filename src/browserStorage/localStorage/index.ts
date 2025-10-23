import { ProtocolHelper } from 'helpers/ProtocolHelper';
import { getPendingAction, setCurrentTab, setPendingAction } from 'hooks/mainHooks';

const SHOW_WELCOMESCREEN_ON_STARTUP = 'SHOW_WELCOMESCREEN_ON_STARTUP';
const CHAT_MINIMUM = 'CHAT_MINIMUM';
const LAST_OPENED_MULTISIG_CONTRACT = 'LAST_OPENED_MULTISIG_CONTRACT';
const LAST_OPENED_GUARANTEE_CONTRACT = 'LAST_OPENED_GUARANTEE_CONTRACT';
const LAST_OPENED_WEB_CONTRACT = 'LAST_OPENED_WEB_CONTRACT';
const CONNECTION_TYPE = 'CONNECTION_TYPE';
const DISPLAY_IN_USD = 'DISPLAY_IN_USD';
const USD_UPDATE_FREQUENCY = 'USD_UPDATE_FREQUENCY';
const SHOW_VERIFICATION_DIALOG = 'SHOW_VERIFICATION_DIALOG';
const FALLBACKURL = 'FALLBACKURL';

class LocalStorage {
    public static getShowWelcomeScreenOnStartup() {
        const show = localStorage.getItem(SHOW_WELCOMESCREEN_ON_STARTUP) ?? 'true';
        return show === 'true';
    }

    public static setShowWelcomeScreenOnStartup(showWelcomeScreenOnStartup: boolean) {
        return localStorage.setItem(SHOW_WELCOMESCREEN_ON_STARTUP, showWelcomeScreenOnStartup.toString());
    }

    public static getChatMinimumForAddress(addressIndependent: string | null): number | null {
        const value = addressIndependent ? localStorage.getItem(`${CHAT_MINIMUM}_${addressIndependent}`) : localStorage.getItem(`${CHAT_MINIMUM}`);
        if (value) return parseInt(value);
        return null;
    }

    public static setChatMinimumForAddress(addressIndependent: string | null, chatMinimum: Uint64 | null): void {
        if (!chatMinimum) {
            if (addressIndependent) {
                localStorage.removeItem(`${CHAT_MINIMUM}_${addressIndependent}`);
            } else {
                localStorage.removeItem(`${CHAT_MINIMUM}`);
            }
            return;
        }
        if (addressIndependent) {
            localStorage.setItem(`${CHAT_MINIMUM}_${addressIndependent}`, chatMinimum.toString());
        } else {
            localStorage.setItem(`${CHAT_MINIMUM}`, chatMinimum.toString());
        }
    }

    public static getLastOpenedMultiSigContract = () => {
        const pendingAction = getPendingAction();
        if (pendingAction?.action === 'OPEN_MULTISIG') {
            const data = pendingAction.data as IHaloButtonScidActionParameters;
            setCurrentTab('MultiSignature');
            setPendingAction(null);
            return data.scid;
        }

        return localStorage.getItem(LAST_OPENED_MULTISIG_CONTRACT);
    };

    public static setLastOpenedMultiSigContract = (scid: string) => {
        localStorage.setItem(LAST_OPENED_MULTISIG_CONTRACT, scid);
    };

    public static clearLastOpenedMultiSigContract = () => {
        localStorage.removeItem(LAST_OPENED_MULTISIG_CONTRACT);
    };

    public static getLastOpenedGuaranteeContract = () => {
        const pendingAction = getPendingAction();
        if (pendingAction?.action === 'OPEN_GUARANTEE') {
            const data = pendingAction.data as IHaloButtonScidActionParameters;
            setCurrentTab('Guarantee');
            setPendingAction(null);
            return data.scid;
        }

        return localStorage.getItem(LAST_OPENED_GUARANTEE_CONTRACT);
    };

    public static setLastOpenedGuaranteeContract = (scid: string) => {
        localStorage.setItem(LAST_OPENED_GUARANTEE_CONTRACT, scid);
    };

    public static clearLastOpenedGuaranteeContract = () => {
        localStorage.removeItem(LAST_OPENED_GUARANTEE_CONTRACT);
    };

    public static getLastOpenedWebContract = () => {
        const pendingAction = getPendingAction();
        if (pendingAction?.action === 'OPEN_WEB') {
            const data = pendingAction.data as IHaloButtonScidActionParameters;
            setCurrentTab('Web');
            setPendingAction(null);
            return data.scid;
        }

        return localStorage.getItem(LAST_OPENED_WEB_CONTRACT);
    };

    public static setLastOpenedWebContract = (scid: string) => {
        localStorage.setItem(LAST_OPENED_WEB_CONTRACT, scid);
    };

    public static getConnectionType = () => {
        return (localStorage.getItem(CONNECTION_TYPE) ?? 'xswd') as ConnectionType;
    };

    public static setConnectionType = (connectionType: ConnectionType) => {
        localStorage.setItem(CONNECTION_TYPE, connectionType);
    };

    public static getDisplayInUsd = () => {
        return localStorage.getItem(DISPLAY_IN_USD) === 'true';
    };

    public static setDisplayInUsd = (displayInUsd: boolean) => {
        localStorage.setItem(DISPLAY_IN_USD, displayInUsd.toString());
    };

    public static getUsdUpdateFrequency = (): number => {
        const value = localStorage.getItem(USD_UPDATE_FREQUENCY);
        return value ? parseInt(value) : 10;
    };

    public static setUsdUpdateFrequency = (usdUpdateFrequency: number): void => {
        localStorage.setItem(USD_UPDATE_FREQUENCY, usdUpdateFrequency.toString());
    };

    public static getShowVerificationDialogAlways = () => {
        return localStorage.getItem(SHOW_VERIFICATION_DIALOG) === 'true';
    };

    public static setShowVerificationDialogAlways = (showVerificationDialogAlways: boolean) => {
        localStorage.setItem(SHOW_VERIFICATION_DIALOG, showVerificationDialogAlways.toString());
    };

    public static getFallbackUrl = () => {
        return localStorage.getItem(FALLBACKURL) ?? ProtocolHelper.getFullUrlPath();
    };

    public static setFallbackUrl = (fallbackUrl: string) => {
        localStorage.setItem(FALLBACKURL, fallbackUrl);
    };
}

export default LocalStorage;
