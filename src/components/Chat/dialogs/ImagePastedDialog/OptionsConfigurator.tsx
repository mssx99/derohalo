import React, { useCallback } from 'react';
import Form, { FormElement } from 'components/common/Form';
import NumberTextFieldUpDown from 'components/common/NumberTextFieldUpDown';
import { styled } from '@mui/material/styles';
import NumberTextField from 'components/common/NumberTextField';
import { NumberFormatValues } from 'react-number-format';
import Switch from '@mui/material/Switch';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Slider from '@mui/material/Slider';

interface IOptionsConfigurator {
    value: IImageOptions;
    onChange: (options: IImageOptions) => void;
}

const WidthContainer = styled('div')`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
`;

const OptionsConfigurator: React.FC<IOptionsConfigurator> = ({ value, onChange }) => {
    const handleRetainChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onChange({ ...value, retainExif: event.target.checked });
        },
        [value]
    );

    const handleWidthChange = useCallback(
        (maxWidth: number) => {
            onChange({ ...value, maxWidth });
        },
        [value]
    );

    const handleHeightChange = useCallback(
        (maxHeight: number) => {
            onChange({ ...value, maxHeight });
        },
        [value]
    );

    const handleConvertSizeChange = useCallback(
        ({ value: convertSize }: NumberFormatValues) => {
            onChange({ ...value, convertSize: parseInt(convertSize) });
        },
        [value]
    );

    const handleMimeTypeChange = useCallback(
        (event: SelectChangeEvent<MimeTypeValue>) => {
            onChange({ ...value, mimeType: event?.target.value as MimeTypeValue });
        },
        [value]
    );

    const handleQualityChange = useCallback(
        (event: Event, newValue: number | number[]) => {
            const quality = newValue as number;
            onChange({ ...value, quality });
        },
        [value]
    );

    return (
        <Form>
            <FormElement label="Retain EXIF">
                <Switch checked={value.retainExif} onChange={handleRetainChange} color="primary" />
            </FormElement>
            <FormElement label="Max Dimensions">
                <WidthContainer>
                    <NumberTextFieldUpDown label="Width" value={value.maxWidth ?? 0} onChange={handleWidthChange} />
                    <NumberTextFieldUpDown label="Height" value={value.maxHeight ?? 0} onChange={handleHeightChange} />
                </WidthContainer>
            </FormElement>
            <FormElement label="Target Size">
                <NumberTextField label="bytes" value={value.convertSize} onValueChange={handleConvertSizeChange} />
            </FormElement>
            <FormElement label="Mime Type for Output">
                <FormControl variant="filled">
                    <InputLabel id="mimeTypeSelectLabel">Type</InputLabel>
                    <Select id="mimeType-select" labelId="mimeTypeSelectLabel" value={value.mimeType || ''} label="Type" onChange={handleMimeTypeChange}>
                        <MenuItem value="image/jpeg">image/jpeg</MenuItem>
                        <MenuItem value="image/png">image/png</MenuItem>
                        <MenuItem value="image/webp">image/webp</MenuItem>
                        <MenuItem value="auto">auto</MenuItem>
                    </Select>
                </FormControl>
            </FormElement>
            <FormElement label="Quality (JPEG)">
                <Slider value={value.quality} aria-label="JPEG Quality" valueLabelDisplay="auto" onChange={handleQualityChange} step={0.01} min={0} max={1} />
            </FormElement>
        </Form>
    );
};

export default OptionsConfigurator;
