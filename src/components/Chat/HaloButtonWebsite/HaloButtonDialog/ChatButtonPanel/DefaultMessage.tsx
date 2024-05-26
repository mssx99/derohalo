import React, { useCallback } from 'react';
import TextField from 'components/common/TextField';
import { useHaloButtonDialog } from '..';

const DefaultMessage: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();

    const data = haloButtonConfig.data as IHaloButtonChatActionParameters;

    const handleChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            setHaloButtonConfig({ ...haloButtonConfig, data: { ...data, defaultMessage: value } });
        },
        [haloButtonConfig, setHaloButtonConfig]
    );

    return <TextField label="Default Message" value={data.defaultMessage ?? ''} onChange={handleChange} fullWidth />;
};

export default DefaultMessage;
