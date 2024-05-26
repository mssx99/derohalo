import React, { useCallback } from 'react';
import TextField from 'components/common/TextField';
import { useHaloButtonDialog } from '..';

const Address: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();

    const data = haloButtonConfig.data as IHaloButtonChatActionParameters;

    const handleChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            setHaloButtonConfig({ ...haloButtonConfig, data: { ...data, address: value } });
        },
        [haloButtonConfig, setHaloButtonConfig]
    );

    return <TextField label="Address" value={data.address} onChange={handleChange} fullWidth />;
};

export default Address;
