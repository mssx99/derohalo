import React, { useEffect, useRef, useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { useArrowContext } from 'contexts/MultiSigArrowContext';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TurnSlightRightIcon from '@mui/icons-material/TurnSlightRight';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import SourceIcon from '@mui/icons-material/Source';
import { setContract, setMultiSigSmartContractBalances, useColorize, useContract, usePreview, useReorder } from 'hooks/multiSigHooks';
import NewOrExistingRadio from './NewOrExistingRadio';
import { createNewMultiSigContract } from 'helpers/ContractHelper';
import { installMultiSigContract, verifyContract } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import MultiSigScidSelector from './MultiSigScidSelector';
import NumberTextFieldUpDown from 'components/common/NumberTextFieldUpDown';
import SmartContractBalance from './SmartContractBalance';
import { useSmartContractVerificationDialog } from 'components/common/dialogs/SmartContractVerificationDialog';

interface IApproverContainerProps {
    value: IApprover;
    index: number;
}

const Container = styled('div')({
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    height: 60,
    marginBottom: 20,
    paddingLeft: 10,
});

const ContainerNewOrExisting = styled('div')({
    flexGrow: 1,
    alignSelf: 'center',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
});

const Toolbar = () => {
    const { isNew, contract } = useContract();
    const { isOpen, setInfos } = useSmartContractVerificationDialog();
    const { reorder } = useReorder();
    const { showArrows, setShowArrows, updateArrows } = useArrowContext();
    const { colorize, setColorize } = useColorize();
    const { preview, setPreview } = usePreview();

    const [config, setConfig] = useState<string[]>([]);

    const handleArrowClick = (event: React.MouseEvent<HTMLElement>) => {
        setShowArrows(!showArrows);
    };

    const handleColorizeClick = (event: React.MouseEvent<HTMLElement>) => {
        setColorize(!colorize);
    };

    const handlePreviewClick = (event: React.MouseEvent<HTMLElement>) => {
        setPreview(!preview);
    };

    useEffect(() => {
        const newConfig = [];
        showArrows && newConfig.push('arrows');
        colorize && newConfig.push('colorize');
        preview && newConfig.push('preview');
        setConfig(newConfig);
    }, [showArrows, colorize, preview]);

    useEffect(() => {
        if (showArrows && reorder) setShowArrows(false);
    }, [reorder]);

    const handleConfigChange = (event: React.MouseEvent<HTMLElement>, newConfig: string[]) => {};

    const clear = () => {
        const contract = createNewMultiSigContract();
        setContract(contract);
        setMultiSigSmartContractBalances({});
    };

    const install = useCallback(() => {
        const verificationResult = verifyContract(contract);
        if (verificationResult.valid && verificationResult.warnings.length === 0) {
            installMultiSigContract(contract);
        } else {
            setInfos({ observations: verificationResult, contract, title: 'MultiSig-SmartContract Validation' });
        }
    }, [contract]);

    return (
        <Container>
            <NewOrExistingRadio />
            <ContainerNewOrExisting>
                {isNew ? (
                    <>
                        <Button onClick={clear}>Clear</Button>
                        <Button onClick={install} variant="contained">
                            Install SmartContract
                        </Button>
                        {/* <NumberTextFieldUpDown label="Maximum Transactions" value={3} onChange={(e) => {}} /> */}
                    </>
                ) : (
                    <>
                        <MultiSigScidSelector />
                        <SmartContractBalance type="MULTISIGNATURE" />
                    </>
                )}
            </ContainerNewOrExisting>

            <ToggleButtonGroup value={config} onChange={handleConfigChange} aria-label="configuration of ">
                {isNew && (
                    <ToggleButton value="arrows" aria-label="arrows" onClick={handleArrowClick} disabled={reorder}>
                        <TurnSlightRightIcon />
                    </ToggleButton>
                )}
                <ToggleButton value="colorize" aria-label="colorize" onClick={handleColorizeClick}>
                    <FormatColorFillIcon />
                </ToggleButton>
                <ToggleButton value="preview" aria-label="preview" onClick={handlePreviewClick}>
                    <SourceIcon />
                </ToggleButton>
            </ToggleButtonGroup>
        </Container>
    );
};

export default Toolbar;
