import React, { useEffect, useState, useCallback } from 'react';
import ScidSelector from 'components/common/ScidSelector';
import { loadContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { getSmartContractId } from 'helpers/DeroHelper';
import { useContract } from 'hooks/guaranteeHooks';

const GuaranteeScidSelector: React.FC = () => {
    const { contract } = useContract();
    const [scid, setScid] = useState<ISmartContractDirectoryEntry | string | null>(null);
    const [loadedScid, setLoadedScid] = useState<string | null>(null);

    useEffect(() => {
        if (contract?.scid) {
            setScid(contract.scid);
            setLoadedScid(contract.scid);
        }
    }, [contract?.scid]);

    const handleChange = useCallback(
        (newScid: ISmartContractDirectoryEntry | string | null, verified: boolean) => {
            if (verified && newScid) {
                if (typeof newScid === 'object') {
                    setScid(newScid);
                    if (newScid.scid !== loadedScid) {
                        setLoadedScid(newScid.scid);
                        loadContractAndSet(newScid.scid);
                    }
                } else {
                    setScid(newScid);
                    if (newScid !== loadedScid) {
                        setLoadedScid(newScid);
                        loadContractAndSet(newScid);
                    }
                }
            }
            if (!newScid) {
                setScid(null);
            }
        },
        [loadedScid]
    );

    const handleEnter = (scid: ISmartContractDirectoryEntry | string | null) => {
        scid = getSmartContractId(scid);
        if (scid != null) {
            loadContractAndSet(scid);
        }
    };

    return <ScidSelector value={scid} onChange={handleChange} onEnter={handleEnter} type={'GUARANTEE'} />;
};

export default GuaranteeScidSelector;
