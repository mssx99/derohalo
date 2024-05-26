import { loadContract } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { updateListing } from 'hooks/webHooks';

export class CachedLoader {
    private static alreadyProcessed = new Map<string, IListing>();
    private static queue = new Map<string, IListing>();
    private static isProcessing: boolean = false;

    public static addListingToQueue(listing: IListing) {
        if (!this.hasListingInQueue(listing.listingKey) && !this.alreadyProcessed.has(listing.listingKey)) {
            this.queue.set(listing.listingKey, listing);
            this.processQueue();
        }
    }

    public static removeListingFromAlreadyProcessed(listingKey: string) {
        this.alreadyProcessed.delete(listingKey);
    }

    public static applyCache(listings: { [key: string]: IListing }) {
        const keys = Object.keys(listings);
        for (const key of keys) {
            if (listings.hasOwnProperty(key)) {
                const listing = listings[key];

                if (this.alreadyProcessed.has(key)) {
                    listings[key] = this.alreadyProcessed.get(key)!;
                }
            }
        }

        return listings;
    }

    public static hasListingInQueue(listingKey: string): boolean {
        return this.queue.has(listingKey);
    }

    private static async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        for (const [key, value] of this.queue) {
            if (this.queue.has(key)) {
                const listing = this.queue.get(key)!;
                if (listing.loadingState === 'PENDING') {
                    const processedListing = await this.processItem(listing);
                    this.alreadyProcessed.set(listing.listingKey, processedListing);
                }
                this.queue.delete(listing.listingKey);
            }
        }

        this.isProcessing = false;

        if (Object.keys(this.queue).length > 0) {
            setTimeout(() => this.processQueue(), 0);
        }
    }

    private static async processItem(listing: IListing) {
        listing = { ...listing };
        listing.loadingState = 'LOADING';
        updateListing(listing);

        const result = await loadContract(listing.scid);
        const contract = result.contract as IGuaranteeContract;

        if (contract) {
            listing.contract = contract;
            listing.verified = contract.compareCode === contract.code;
            listing.partyA = contract.firstPartyWallet?.address ?? 'N/A';
            listing.partyA_requiredGuaranteeTotal = contract.stages.reduce((acc, stage) => acc + stage.a_Guarantee, 0);
            listing.partyA_requiredPaymentsTotal = contract.stages.reduce((acc, stage) => acc + stage.a_Transfer, 0);
            listing.partyB_requiredGuaranteeTotal = contract.stages.reduce((acc, stage) => acc + stage.b_Guarantee, 0);
            listing.partyB_requiredPaymentsTotal = contract.stages.reduce((acc, stage) => acc + stage.b_Transfer, 0);
            listing.loadingState = 'LOADED';
        } else {
            listing.loadingState = 'ERROR';
        }

        updateListing(listing);

        return listing;
    }
}
