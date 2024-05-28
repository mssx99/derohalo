import React, { useState, useEffect } from 'react';
import { FormElement } from 'components/common/Form';
import ScidSelector from 'components/common/ScidSelector';
import { useHaloButtonDialog } from '..';

const ContractButtonPanel: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();
    const [scid, setScid] = useState<ISmartContractDirectoryEntry | string | null>(null);

    const data = haloButtonConfig.data as IHaloButtonScidActionParameters;
    let type: SmartContractType = 'WEB';

    switch (haloButtonConfig.action) {
        case 'OPEN_CHAT':
        // fallthrough
        case 'OPEN_MULTISIG':
            type = 'MULTISIGNATURE';
            break;
        case 'OPEN_GUARANTEE':
            type = 'GUARANTEE';
            break;
        case 'OPEN_WEB':
            type = 'WEB';
            break;
    }

    useEffect(() => {
        setScid(null);
        setHaloButtonConfig({ ...haloButtonConfig, data: { scid: '' } });
    }, [type]);

    const handleChange = (newScid: ISmartContractDirectoryEntry | string | null, verified: boolean) => {
        if (verified && newScid) {
            if (typeof newScid === 'object') {
                setScid(newScid);
                setHaloButtonConfig({ ...haloButtonConfig, data: { scid: newScid.scid } });
            } else {
                setScid(newScid);
                setHaloButtonConfig({ ...haloButtonConfig, data: { scid: newScid } });
            }
        }
        if (!newScid) {
            setScid(null);
            setHaloButtonConfig({ ...haloButtonConfig, data: { scid: '' } });
        }
    };

    return (
        <>
            <FormElement label="SmartContract-ID">
                <ScidSelector key={type} value={data.scid} onChange={handleChange} type={type} connectionRequired={false} />
            </FormElement>
        </>
    );
};

export default ContractButtonPanel;
