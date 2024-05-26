import React, { useId } from 'react';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { DiffMethod } from 'react-string-diff';

interface IMethodSelect {
    value: DiffMethod;
    onChange: (method: DiffMethod) => void;
}

const MethodSelect: React.FC<IMethodSelect> = ({ value, onChange }) => {
    const id_selectMethodLabel = useId();

    const handleChange = (event: SelectChangeEvent) => {
        onChange(event.target.value as DiffMethod);
    };

    return (
        <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id={id_selectMethodLabel}>DiffMethod</InputLabel>
            <Select labelId={id_selectMethodLabel} value={value} onChange={handleChange}>
                <MenuItem value={DiffMethod.Chars}>Chars </MenuItem>
                <MenuItem value={DiffMethod.Words}>Words</MenuItem>
                <MenuItem value={DiffMethod.WordsWithSpace}>WordsWithSpace</MenuItem>
                <MenuItem value={DiffMethod.Lines}>Lines</MenuItem>
                <MenuItem value={DiffMethod.TrimmedLines}>TrimmedLines</MenuItem>
                <MenuItem value={DiffMethod.Sentences}>Sentences</MenuItem>
                <MenuItem value={DiffMethod.CSS}>CSS</MenuItem>
            </Select>
        </FormControl>
    );
};

export default MethodSelect;
