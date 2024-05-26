import React, { useCallback } from 'react';
import DepositIcon from '@mui/icons-material/Login';
import WithdrawIcon from '@mui/icons-material/ExitToApp';
import LoadingIconButton from 'components/common/LoadingIconButton';
import { useWalletAddress } from 'hooks/deroHooks';
import { useContract, useContractStats } from 'hooks/guaranteeHooks';
import { isSameAddress, scInvoke, waitForTransaction } from 'helpers/DeroHelper';
import AnimatedColorIconButton from 'components/common/AnimatedColorIconButton';
import { useDepositDialog } from 'components/common/dialogs/DepositDialog';
import { loadContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { MESSAGE_SEVERITY } from 'Constants';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { addSnackbar } from 'components/screen/Snackbars';

interface IDepositButton {
    party: 'A' | 'B';
}

const DepositButton: React.FC<IDepositButton> = ({ party }) => {
    const { contract } = useContract();
    const stats = useContractStats();
    const { setDepositTransaction } = useDepositDialog();
    const address = useWalletAddress();

    const partyAddress = party === 'A' ? contract.firstPartyWallet?.address : contract.secondPartyWallet?.address;
    const partyFunded = party === 'A' ? contract.firstPartyAmountFunded : contract.secondPartyAmountFunded;

    const handleClickDeposit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();

            if (!contract.scid) return;

            const amount = stats[`${party.toLowerCase()}_RequiredDeposit`] ?? 0;

            setDepositTransaction({
                scid: contract.scid,
                scidReadOnly: true,
                label: `Guarantee-SmartContract for party ${party}.`,
                message: undefined,

                sc_rpc: [{ name: 'entrypoint', datatype: 'S', value: 'Deposit' }],
                amount,
                amountReadOnly: true,
                specialFunction: 'Guarantee',
            });
        },
        [contract, stats, address, party]
    );

    const handleClickWithdraw = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();

            if (!contract.scid) {
                addSnackbar({ message: `No contract Scid selected`, severity: MESSAGE_SEVERITY.ERROR });
                return;
            }

            try {
                setBusyBackdrop(true, 'Withdrawing from contract...');
                const txid = await scInvoke({ scid: contract.scid, sc_rpc: [{ name: 'entrypoint', datatype: 'S', value: 'Withdraw' }], waitFor: true });
                await loadContractAndSet(contract.scid, false);
                addSnackbar({ message: `Withdrawn successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
            } catch (e) {
                addSnackbar({ message: `An error occurred. ${e}`, severity: MESSAGE_SEVERITY.ERROR });
            } finally {
                setBusyBackdrop(false);
            }
        },
        [contract, address]
    );

    if (contract.state === 'PENDING_DEPOSITS' && ((partyAddress && isSameAddress(address, partyAddress)) || (!partyAddress && address !== contract.firstPartyWallet?.address))) {
        if (!partyFunded) {
            return (
                <AnimatedColorIconButton color1="#e44a02" color2="#00000000" duration={1} onClick={handleClickDeposit}>
                    <DepositIcon />
                </AnimatedColorIconButton>
            );
        } else if (partyAddress && isSameAddress(address, partyAddress)) {
            return (
                <AnimatedColorIconButton color1="#0237e4" color2="#00000000" duration={1} onClick={handleClickWithdraw}>
                    <WithdrawIcon />
                </AnimatedColorIconButton>
            );
        }
    }
    return <></>;
};

export default DepositButton;
