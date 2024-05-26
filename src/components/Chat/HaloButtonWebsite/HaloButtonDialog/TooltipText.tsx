import React, { useCallback } from 'react';
import TextField from 'components/common/TextField';
import { useHaloButtonDialog } from '.';

const TooltipText: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();

    const handleChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            setHaloButtonConfig({ ...haloButtonConfig, tooltip: value });
        },
        [haloButtonConfig, setHaloButtonConfig]
    );

    return <TextField label="Tooltip-Text" value={haloButtonConfig.tooltip} onChange={handleChange} fullWidth />;
};

export default TooltipText;
