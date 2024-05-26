import React, { useCallback } from 'react';
import TextField from 'components/common/TextField';
import { useHaloButtonDialog } from '..';

const Alias: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();

    const data = haloButtonConfig.data as IHaloButtonChatActionParameters;

    const handleChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            setHaloButtonConfig({ ...haloButtonConfig, data: { ...data, alias: value } });
        },
        [haloButtonConfig, setHaloButtonConfig]
    );

    return <TextField label="Alias" sx={{ width: 200 }} value={data.alias} onChange={handleChange} />;
};

export default Alias;
