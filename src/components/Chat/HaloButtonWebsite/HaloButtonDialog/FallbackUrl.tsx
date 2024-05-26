import React, { useCallback, useEffect, useState } from 'react';
import TextField from 'components/common/TextField';
import { useHaloButtonDialog } from '.';
import LocalStorage from 'browserStorage/localStorage';

const FallbackUrl: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(!isValidUrl(haloButtonConfig.fallbackUrl));
    }, [haloButtonConfig]);

    const handleChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            LocalStorage.setFallbackUrl(value);
            setHaloButtonConfig({ ...haloButtonConfig, fallbackUrl: value });
        },
        [haloButtonConfig, setHaloButtonConfig]
    );

    return <TextField label="Fallback-URL" value={haloButtonConfig.fallbackUrl} onChange={handleChange} error={error} helperText={error ? 'Please enter a valid URL.' : ''} fullWidth />;
};

const isValidUrl = (value: string) => {
    if (/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/.test(value)) {
        return true;
    } else {
        return false;
    }
};

export default FallbackUrl;
