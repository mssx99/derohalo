import dayjs from 'dayjs';

export const VERSION = '0.1.0 ALPHA';

export const APP_NAME = 'Derohalo';
export const IS_DEBUG = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

export const DERO_STATE = { CONNECTED: 'CONNECTED', DISCONNECTED: 'DISCONNECTED' };
export const MESSAGE_SEVERITY = { INFO: 'info', SUCCESS: 'success', ERROR: 'error', WARNING: 'warning' };
export const SNACKBAR_AUTOHIDE_DURATION = 6000;
export const WALLET_BALANCE_UPDATE_INTERVAL = 2000;
export const SMART_CONTRACT_UPDATE_INTERVAL = 5000;
export const MAX_RETRIES = 50;
export const RETRY_DELAY = 2000;

export const XSWD_DEFAULTPORT = 44326;

export const TYPING_DELAY = 500;
export const TYPING_ADDRESS_DELAY = 500;

export const DEFAULT_BLOCKTIME = 18;

export const SCID_DERO = '0000000000000000000000000000000000000000000000000000000000000000';

export const WALLET_BACKGROUND_COLOR = '#bcc88c';

export const CODE_DISPLAY_ANIMATION_DURATION = 1000;
export const CONTRACT_BYTE_LIMIT = 20000;

export const BASE_BLOCKHEIGHT = IS_DEBUG ? { timestamp: dayjs('2024-05-13T04:08:48Z'), block: 649 } : { timestamp: dayjs('2024-02-24T18:39:00Z'), block: 3344776 };

export const SHOW_COMPARISON_ALWAYS = false;
export const SAVE_REMAINING_BLOCKS = 2000;

export const MAX_TRANSFERS = 50;

export const MAX_AUDIO_SECONDS = 24;
export const AUDIO_GREEN_UNTIL = 15;
export const AUDIO_AMBER_UNTIL = 24;
export const AUDIO_CHAT_QUALITY = 8000;

export const CHATMESSAGE_COLOR_LOW = { r: 255, g: 255, b: 255 };
export const CHATMESSAGE_COLOR_HIGH = { r: 235, g: 10, b: 10 };

export const MAX_CHAT_PERCENTAGE = 10000000000;
export const MAX_GUARANTEE_PERCENTAGE = 10000000000;

export const CHAT_MINIMUM_CHARLIMIT_ALIAS = 20;
export const CHAT_MINIMUM_CHARLIMIT_DESCRIPTION = 100;
export const GUARANTEE_CHARLIMIT_MARKET = 30;
export const SCID_CHARLIMIT = 70;

export const DUMMY_MULTISIG = {
    contractType: 'MULTISIGNATURE',
    creator: '',
    involvedParties: [] as IWallet[],
    authorizationGroups: [] as IAuthorizationGroup[],
    proposedTransactions: [] as IAtomicTransaction[],
    maxTransactionsInAtomic: 4,
} as IMultiSigContract;

export const DUMMY_GUARANTEE = {
    contractType: 'GUARANTEE',
    market: null,
    firstPartyWallet: null,
    firstPartyAmountFunded: false,
    secondPartyWallet: null,
    secondPartyAmountFunded: false,
    state: 'NEW',
    stages: [],
    images: {},
} as IGuaranteeContract;

export const DUMMY_GUARANTEE_STATS = {
    calculatedAtBlockheight: 0,
    a_RequiredDeposit: 0,
    a_TotalGuarantee: 0,
    a_TotalTransfer: 0,
    a_TotalLoss: 0,
    a_TotalPendingGuarantee: 0,
    a_TotalPendingTransfer: 0,
    b_RequiredDeposit: 0,
    b_TotalGuarantee: 0,
    b_TotalTransfer: 0,
    b_TotalLoss: 0,
    b_TotalPendingGuarantee: 0,
    b_TotalPendingTransfer: 0,
};

export const DEFAULT_IMAGE_OPTIONS = { retainExif: false, mimeType: 'auto', convertSize: 5000, quality: 0.5 } as IImageOptions;
export const DEFAULT_THUMB_OPTIONS = { retainExif: false, mimeType: 'auto', convertSize: 5000, quality: 0.9, width: 64, height: 64, resize: 'cover' } as IImageOptions;

export const DEROHALO_PROTOCOL = 'derohalo';
export const FALLBACK_DELAY = 1500;
