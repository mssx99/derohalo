import React, { useEffect, useRef, useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TurnSlightRightIcon from '@mui/icons-material/TurnSlightRight';
import SourceIcon from '@mui/icons-material/Source';
import { setContract, setGuaranteeSmartContractBalances, useContract, usePreview, useShowArrows } from 'hooks/guaranteeHooks';
import NewOrExistingRadio from './NewOrExistingRadio';
import { createNewGuaranteeContract } from 'helpers/ContractHelper';
import GuaranteeScidSelector from './GuaranteeScidSelector';
import SmartContractBalance from 'components/MultiSigDesigner/Toolbar/SmartContractBalance';
import { installGuaranteeContract, verifyContract } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { useSmartContractVerificationDialog } from 'components/common/dialogs/SmartContractVerificationDialog';
import { useRegisterGuaranteeDialog } from 'components/Web/dialogs/RegisterGuaranteeDialog';

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
    const { setOpen } = useRegisterGuaranteeDialog();
    const { showArrows, setShowArrows } = useShowArrows();
    const { preview, setPreview } = usePreview();

    const [config, setConfig] = useState<string[]>([]);

    const handleArrowClick = (event: React.MouseEvent<HTMLElement>) => {
        setShowArrows(!showArrows);
    };

    const handlePreviewClick = (event: React.MouseEvent<HTMLElement>) => {
        setPreview(!preview);
    };

    useEffect(() => {
        const newConfig = [];
        showArrows && newConfig.push('arrows');
        preview && newConfig.push('preview');
        setConfig(newConfig);
    }, [showArrows, preview]);

    const handleConfigChange = (event: React.MouseEvent<HTMLElement>, newConfig: string[]) => {};

    const clear = () => {
        const contract = createNewGuaranteeContract();
        setContract(contract);
        setGuaranteeSmartContractBalances({});
    };

    const handleInstall = useCallback(() => {
        const verificationResult = verifyContract(contract);
        if (verificationResult.valid && verificationResult.warnings.length === 0) {
            installGuaranteeContract(contract);
        } else {
            setInfos({ observations: verificationResult, contract, title: 'Guarantee-SmartContract Validation' });
        }
    }, [contract]);

    const handlePublishAsListing = () => {
        setOpen(true);
    };

    return (
        <Container>
            <NewOrExistingRadio />
            <ContainerNewOrExisting>
                {isNew ? (
                    <>
                        <Button onClick={clear}>Clear</Button>
                        <Button onClick={handleInstall} variant="contained">
                            Install SmartContract
                        </Button>
                    </>
                ) : (
                    <>
                        <GuaranteeScidSelector />
                        <SmartContractBalance type="GUARANTEE" />
                        <Button style={{ marginLeft: 'auto' }} onClick={handlePublishAsListing} variant="contained">
                            Publish as Listing
                        </Button>
                    </>
                )}
            </ContainerNewOrExisting>

            <ToggleButtonGroup value={config} onChange={handleConfigChange} aria-label="configuration of guarantees">
                <ToggleButton value="arrows" aria-label="arrows" onClick={handleArrowClick}>
                    <TurnSlightRightIcon />
                </ToggleButton>
                <ToggleButton value="preview" aria-label="preview" onClick={handlePreviewClick}>
                    <SourceIcon />
                </ToggleButton>
            </ToggleButtonGroup>
        </Container>
    );
};

export default Toolbar;
