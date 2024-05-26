interface ISnackbar {
    id?: string;
    message: string;
    severity: string;
    autoHideDuration?: number;
    action?: ISnackbarAction;
}

interface ISnackbarAction {
    type: string;
    payload: any;
}

interface IDialogState {
    isOpen: boolean;
    value?: any;
}

interface IEditableTransaction {
    id: string;
    address: string | null;
    amount: Uint64;
}

interface IBusyBackdrop {
    open: boolean;
    message?: string;
}

interface IVerificationResult {
    valid: boolean;
    errors: IVerificationDetails[];
    warnings: IVerificationDetails[];
}

interface IVerificationDetails {
    message: string;
    details?: string;
}

interface IEventChatScrollToBottom {
    address?: string;
    txid?: string;
}

interface IDialogPortal {
    contentId: string;
    actionsId: string;
}
