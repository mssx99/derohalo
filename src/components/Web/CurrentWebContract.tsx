import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useContract, useIsWebOwner } from 'hooks/webHooks';
import { isSmartContractDirectoryEntry } from 'helpers/DirectoryHelper';
import ScidSelector from 'components/common/ScidSelector';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { installWebContract, loadContractAndSet } from 'helpers/Web/WebContractHelper';
import SmartContractBalance from 'components/MultiSigDesigner/Toolbar/SmartContractBalance';
import { useIsConnected } from 'hooks/deroHooks';

const Container = styled('div')`
    display: flex;
    flex-direction: row;
    margin-bottom: 40px;
    padding-left: 10px;
    align-items: center;
    gap: 10px;
`;

const InstallButton = styled(Button)`
    margin-left: auto;
    white-space: nowrap;
    min-width: fit-content;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const CurrentWebContract: React.FC = () => {
    const [value, setValue] = useState<string | null>(process.env.REACT_APP_WEB_SC!);
    const webContract = useContract();
    const isWebOwner = useIsWebOwner();
    const isConnected = useIsConnected();

    useEffect(() => {
        setValue(webContract?.scid ?? null);
    }, [webContract]);

    const installButtonText = useMemo(() => (isWebOwner ? 'Install a new WebContract' : 'Install your own WebContract'), [isWebOwner]);

    const handleWebContractChange = useCallback(
        (value: ISmartContractDirectoryEntry | string | null, verified: boolean) => {
            if (!value) return;
            if (isSmartContractDirectoryEntry(value)) {
                if (value.scid != webContract?.scid) loadContractAndSet(value.scid);
            } else {
                if (value != webContract?.scid) loadContractAndSet(value);
            }
        },
        [webContract]
    );

    const handleWebContractEnter = (value: ISmartContractDirectoryEntry | string | null) => {
        if (!value) return;
        if (isSmartContractDirectoryEntry(value)) {
            loadContractAndSet(value.scid);
        } else {
            loadContractAndSet(value);
        }
    };

    const handleClick = () => {
        installWebContract();
    };

    return (
        <Container>
            <ScidSelector label="Web-Contract" value={value} type="WEB" onChange={handleWebContractChange} onEnter={handleWebContractEnter} />
            {isWebOwner && <SmartContractBalance type="WEB" />}

            <InstallButton onClick={handleClick} disabled={!isConnected}>
                {installButtonText}
            </InstallButton>
        </Container>
    );
};

export default CurrentWebContract;
