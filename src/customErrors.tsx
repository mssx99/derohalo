export class AuthorizationError extends Error {
    constructor(message?: string) {
        super(message ?? 'Authorizaton was not granted');
        this.name = 'AuthorizationError';
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}

export class UnsupportedOperationError extends Error {
    constructor(message?: string) {
        super(message ?? 'UnsupportedOperationError');
        this.name = 'UnsupportedOperationError';
        Object.setPrototypeOf(this, UnsupportedOperationError.prototype);
    }
}

export class NotImplementedOperationError extends Error {
    constructor(message?: string) {
        super(message ?? 'Operation has not been implemented.');
        this.name = 'NotImplementedOperationError';
        Object.setPrototypeOf(this, NotImplementedOperationError.prototype);
    }
}

export class EmptyResponseError extends Error {
    constructor(message?: string) {
        super(message ?? 'Response was empty.');
        this.name = 'EmptyResponseError';
        Object.setPrototypeOf(this, EmptyResponseError.prototype);
    }
}

export class EntryNotFoundError extends Error {
    constructor(message?: string) {
        super(message ?? 'This entry could not be found.');
        this.name = 'EntryNotFoundError';
        Object.setPrototypeOf(this, EntryNotFoundError.prototype);
    }
}

export class NotIncludedInBlockchainError extends Error {
    constructor(message?: string) {
        super(message ?? 'This transaction has not been included yet.');
        this.name = 'NotIncludedInBlockchainError';
        Object.setPrototypeOf(this, NotIncludedInBlockchainError.prototype);
    }
}

export class MultiSigContractLoadError extends Error {
    constructor(message?: string) {
        super(message ?? 'There was an error loading this MultiSigContract.');
        this.name = 'MultiSigContractLoadError';
        Object.setPrototypeOf(this, MultiSigContractLoadError.prototype);
    }
}

export class GuaranteeContractLoadError extends Error {
    constructor(message?: string) {
        super(message ?? 'There was an error loading this GuaranteeContract.');
        this.name = 'GuaranteeContractLoadError';
        Object.setPrototypeOf(this, GuaranteeContractLoadError.prototype);
    }
}

export class WebContractLoadError extends Error {
    constructor(message?: string) {
        super(message ?? 'There was an error loading this GuaranteeContract.');
        this.name = 'WebContractLoadError';
        Object.setPrototypeOf(this, WebContractLoadError.prototype);
    }
}

export class DatabaseNotPreparedError extends Error {
    constructor(message?: string) {
        super(message ?? 'This transaction has not been included yet.');
        this.name = 'NotIncludedInBlockchainError';
        Object.setPrototypeOf(this, DatabaseNotPreparedError.prototype);
    }
}

export class ContractLoadError extends Error {
    constructor(message?: string) {
        super(message ?? 'There was a problem loading the contract.');
        this.name = 'ContractLoadError';
        Object.setPrototypeOf(this, ContractLoadError.prototype);
    }
}

export class AudioOutOfBoundsError extends Error {
    newPosition: number;

    constructor(newPosition: number, message?: string) {
        super(message ?? 'The given position is not within the bounds.');
        this.name = 'AudioOutOfBoundsError';
        this.newPosition = newPosition;
        Object.setPrototypeOf(this, AudioOutOfBoundsError.prototype);
    }
}

export class AudioContextNotAvailableError extends Error {
    constructor() {
        super('AudioContext is not available.');
        this.name = 'AudioContextNotAvailableError';
        Object.setPrototypeOf(this, AudioContextNotAvailableError.prototype);
    }
}
