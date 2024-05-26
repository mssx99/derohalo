import React, { useEffect, useRef, useCallback } from 'react';
import TextField from 'components/common/TextField';
import { updateAuthGroup } from 'hooks/multiSigHooks';

interface IDescriptionAuthGroup {
    value: string;
    readOnly?: boolean;
    onChange: (description: string) => void;
}

const Description: React.FC<IDescriptionAuthGroup> = ({ value, onChange, readOnly }) => {
    return (
        <TextField
            id="authgroup_description"
            label="Description"
            value={value ?? ''}
            readOnly={readOnly}
            onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
                onChange(value);
            }}
            fullWidth
        />
    );
};

export default Description;
