type HaloButtonActionType = 'OPEN_CHAT' | 'OPEN_MULTISIG' | 'OPEN_GUARANTEE' | 'OPEN_WEB';

interface IHaloButtonConfig {
    tooltip: string;
    fallbackUrl: string;
    size: number;
    action: HaloButtonActionType;
    data: IHaloButtonChatActionParameters | IHaloButtonScidActionParameters;
}

interface IHaloButtonChatActionParameters {
    alias: string;
    address: string;
    defaultMessage?: string;
}

interface IHaloButtonScidActionParameters {
    scid: string;
}

interface IHaloButtonUrlInvoke {
    action: HaloButtonActionType;
    data: IHaloButtonChatActionParameters | IHaloButtonScidActionParameters;
    xswdport?: number;
}
