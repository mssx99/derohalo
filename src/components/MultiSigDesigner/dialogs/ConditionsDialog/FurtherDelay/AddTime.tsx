import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConditionDialog } from '..';
import { styled } from '@mui/material/styles';
import { updateWalletBalance, useWalletAddress } from 'hooks/deroHooks';
import NumberTextField from 'components/common/NumberTextField';
import { NumberFormatValues } from 'react-number-format';
import { ITimeCount, convertBlocksToTimeCount, convertTimeCountToBlocks, isSameAddress } from 'helpers/DeroHelper';
import { useContract } from 'hooks/multiSigHooks';
import Button from '@mui/material/Button';
import { addTimeForWithdrawal, loadContractAndSet } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';

const Container = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const DynamicContainer = styled('div')`
    display: flex;
    flex-direction: row;
`;

const BlocksAndButton = styled('div')`
    display: flex;
    gap: 10px;
`;

const InfoContainer = styled('div')`
    display: flex;
    flex-direction: column;
`;

const AddTime: React.FC = () => {
    const { contract } = useContract();
    const { authorizationGroup } = useConditionDialog();
    const walletAddress = useWalletAddress();

    const [value, setValue] = useState<ITimeCount | null>(null);
    const [blocks, setBlocks] = useState<Uint64>(0);

    useEffect(() => {
        setValue(convertBlocksToTimeCount(0));
        setBlocks(0);
    }, [authorizationGroup]);

    const handleChange = useCallback((timeCount: ITimeCount) => {
        timeCount = {
            years: isNaN(timeCount.years) ? 0 : timeCount.years,
            months: isNaN(timeCount.months) ? 0 : timeCount.months,
            days: isNaN(timeCount.days) ? 0 : timeCount.days,
            hours: isNaN(timeCount.hours) ? 0 : timeCount.hours,
            minutes: isNaN(timeCount.minutes) ? 0 : timeCount.minutes,
            seconds: isNaN(timeCount.seconds) ? 0 : timeCount.seconds,
        };
        setValue(timeCount);
        setBlocks(convertTimeCountToBlocks(timeCount));
    }, []);

    const handleBlocksChange = useCallback((newBlocks: Uint64) => {
        setValue(convertBlocksToTimeCount(newBlocks));
        setBlocks(newBlocks);
    }, []);

    const handleAddTimeClick = useCallback(async () => {
        if (!contract?.scid || !authorizationGroup || blocks == 0) {
            console.error('No contract or authorizationGroup.', contract, authorizationGroup);
            return;
        }

        const authorizationGroupIndex = contract.authorizationGroups.findIndex((ag) => ag.id === authorizationGroup.id);

        if (authorizationGroupIndex < 0) {
            console.error('AuthorizationGroup not found.');
            return;
        }

        setBusyBackdrop(true, 'Adding time to authorization group.');
        try {
            await addTimeForWithdrawal(contract.scid, authorizationGroupIndex, blocks);
            await updateWalletBalance();
            loadContractAndSet(contract.scid, false);
            addSnackbar({ message: 'Successfully added the blocks to the AuthGroup.', severity: MESSAGE_SEVERITY.ERROR });
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error ocurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [contract, authorizationGroup, blocks]);

    if (!value || !authorizationGroup.furtherDelay || authorizationGroup.furtherDelay.every((ag) => !isSameAddress(ag.address, walletAddress))) return <></>;

    return (
        <Container>
            <DynamicContainer>
                <NumberTextField label="Years" value={value.years} onValueChange={(nfv) => handleChange({ ...value, years: parseInt(nfv.value) })} thousandSeparator decimalScale={0} />
                <NumberTextField label="Months" value={value.months} onValueChange={(nfv) => handleChange({ ...value, months: parseInt(nfv.value) })} thousandSeparator decimalScale={0} />
                <NumberTextField label="Days" value={value.days} onValueChange={(nfv) => handleChange({ ...value, days: parseInt(nfv.value) })} thousandSeparator decimalScale={0} />
                <NumberTextField label="Hours" value={value.hours} onValueChange={(nfv) => handleChange({ ...value, hours: parseInt(nfv.value) })} thousandSeparator decimalScale={0} />
                <NumberTextField label="Minutes" value={value.minutes} onValueChange={(nfv) => handleChange({ ...value, minutes: parseInt(nfv.value) })} thousandSeparator decimalScale={0} />
                <NumberTextField label="Seconds" value={value.seconds} onValueChange={(nfv) => handleChange({ ...value, seconds: parseInt(nfv.value) })} thousandSeparator decimalScale={0} />
            </DynamicContainer>
            <BlocksAndButton>
                <NumberTextField
                    label="Blocks"
                    sx={{ minWidth: 0, width: 100, flexGrow: 1 }}
                    value={blocks}
                    onValueChange={(nfv) => handleBlocksChange(parseInt(nfv.value))}
                    thousandSeparator
                    decimalScale={0}
                />
                <Button onClick={handleAddTimeClick} disabled={blocks === 0}>
                    Add time until amount can be withdrawn
                </Button>
            </BlocksAndButton>
        </Container>
    );
};

export default AddTime;
