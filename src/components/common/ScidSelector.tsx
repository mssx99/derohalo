import React, { useState, useRef, useEffect, useCallback } from 'react';

import Autocomplete, { AutocompleteChangeReason, AutocompleteChangeDetails } from '@mui/material/Autocomplete';

import TextField from 'components/common/TextField';
import { SxProps } from '@mui/system';
import { useDebounce } from 'hooks/mainHooks';
import { IS_DEBUG, TYPING_ADDRESS_DELAY } from 'Constants';
import { checkScidExists, isSmartContractId } from 'helpers/DeroHelper';
import { getAllSmartContractEntries } from 'helpers/DirectoryHelper';
import { useDirectorySmartContracts } from 'hooks/directoryHooks';

import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import Grid from '@mui/material/Grid';
import FavoritedIcon, { TextFieldFavoritedIcon } from './FavoritedIcon';
import _ from 'underscore';
import { useIsConnected } from 'hooks/deroHooks';

interface IScidSelector {
    label?: string;
    value: ISmartContractDirectoryEntry | string | null;
    onChange: (scid: ISmartContractDirectoryEntry | string | null, verified: boolean) => void;
    onEnter?: (scid: ISmartContractDirectoryEntry | string | null) => void;
    type?: SmartContractType;
    sx?: SxProps;
    fullWidth?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
    noOptions?: boolean;
    noFavoriteIndicator?: boolean;
    connectionRequired?: boolean;
}

const TEXT_SEEMS_TO_BE_A_VALID_SCID = 'This seems to be a valid Scid.';
const TEXT_SEEMS_TO_BE_NOT_A_VALID_SCID = 'This seems to be NOT a valid Scid.';

const getTextFromSmartContractEntryOrString = (value: ISmartContractDirectoryEntry | string | null): string => {
    if (typeof value === 'object') {
        if (value?.scid) {
            return value?.scid;
        }
        return '';
    }
    return value?.trim() ?? '';
};

const CustomPaper = styled(Paper)({
    width: 800,
});

const Type = styled('div')({
    color: '#7e7d7d',
    textAlign: 'center',
    fontSize: '12px',
    border: '1px solid #7e7d7d',
    borderRadius: '5px',
    display: 'inline',
    padding: '4px',
});

const ScidSelector: React.FC<IScidSelector> = ({
    label,
    value: scid,
    onChange,
    onEnter,
    type,
    fullWidth = true,
    sx,
    readOnly = false,
    disabled = false,
    noOptions = false,
    noFavoriteIndicator = false,
    connectionRequired = true,
}) => {
    const [value, setValue] = useState<ISmartContractDirectoryEntry | string | null>(null);
    const [helperText, setHelperText] = useState<string | null>(null);
    const [error, setError] = useState(false);

    const debouncedValue = useDebounce(value, TYPING_ADDRESS_DELAY);
    const isConnected = useIsConnected();
    const textRef = useRef<string>(typeof value === 'string' ? value : value?.scid ?? '');
    const onChangeRef = useRef<{ value: ISmartContractDirectoryEntry | string | null; verified: boolean } | null>(null);

    const loadedDirectorySmartContracts = useDirectorySmartContracts(type);

    const sendOnChange = useCallback(
        (value: ISmartContractDirectoryEntry | string | null, verified: boolean) => {
            if (!_.isEqual({ value, verified }, onChangeRef.current)) {
                onChange(value, verified);
            }
            onChangeRef.current = { value, verified };
        },
        [onChange]
    );

    useEffect(() => {
        let active = true;

        let debouncedValueText = getTextFromSmartContractEntryOrString(debouncedValue);

        if (debouncedValueText === textRef.current) {
            const isValidFormat = isSmartContractId(debouncedValueText);
            if (debouncedValueText && isValidFormat) {
                if (isConnected) {
                    checkScidExists(debouncedValueText)
                        .then((exists) => {
                            if (!active) return;
                            if (exists) {
                                setError(false);
                                setHelperText('');
                                sendOnChange(debouncedValue, true);
                            } else {
                                setError(true);
                                setHelperText('This Scid does not exist on the blockchain.');
                            }
                        })
                        .catch((e) => {
                            if (!active) return;
                            setError(true);
                            setHelperText('A problem occurred when checking the existence of this scid.');
                        });
                }
            }
        }
        return () => {
            active = false;
        };
    }, [debouncedValue, isConnected, sendOnChange]);

    useEffect(() => {
        setValue(scid);
    }, [scid]);

    useEffect(() => {
        const found = loadedDirectorySmartContracts.find((l) => {
            if (typeof value === 'object' && value) {
                return l.scid === value.scid;
            } else {
                return l.scid === value;
            }
        });

        if (found) {
            if (!_.isEqual(found, value)) {
                setValue(found);
                sendOnChange(found, true);
            }
        } else {
            if (typeof value === 'object' && value) {
                setValue(value.scid);
            }
        }
    }, [loadedDirectorySmartContracts, value, sendOnChange]);

    const scidValueUpdate = useCallback(
        (value: ISmartContractDirectoryEntry | string | null) => {
            textRef.current = getTextFromSmartContractEntryOrString(value);

            if (typeof value === 'object') {
                setValue(value);
                setError(false);
                setHelperText(null);
                sendOnChange(value, true);
                return;
            }

            const newValue = value?.trim();
            setValue(newValue);

            const isValidFormat = isSmartContractId(newValue);
            if (isValidFormat) {
                setError(false);
                setHelperText(TEXT_SEEMS_TO_BE_A_VALID_SCID);
                sendOnChange(newValue, true);
                return;
            } else if (newValue.length == 0) {
                setError(false);
                setHelperText(null);
                sendOnChange(null, false);
                return;
            }

            if (isConnected || (!isConnected && !isValidFormat)) {
                setError(true);
                setHelperText(TEXT_SEEMS_TO_BE_NOT_A_VALID_SCID);
            }
        },
        [error, helperText, isConnected, sendOnChange]
    );

    const handleTextFieldChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            scidValueUpdate(value);
        },
        [scidValueUpdate]
    );

    const handleAutocompleteChange = useCallback(
        (
            event: React.SyntheticEvent<Element, Event>,
            value: ISmartContractDirectoryEntry | string | null,
            reason: AutocompleteChangeReason,
            details?: AutocompleteChangeDetails<ISmartContractDirectoryEntry> | undefined
        ) => {
            if (reason === 'clear') {
                scidValueUpdate(null);
            } else {
                if (typeof value === 'object') {
                    setHelperText(null);
                    //Perhaps checkScidExists??
                    scidValueUpdate(value);
                } else {
                    scidValueUpdate(value);
                }
            }
        },
        [scidValueUpdate]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter') {
                onEnter && onEnter(value);
            }
        },
        [value, onEnter]
    );

    return (
        <>
            <Autocomplete
                id="scidSelector"
                fullWidth
                sx={{ maxWidth: '42rem', ...sx }}
                value={value}
                options={noOptions ? [] : loadedDirectorySmartContracts}
                getOptionLabel={(option) => {
                    if (typeof option === 'object') return option.scid;
                    return option;
                }}
                isOptionEqualToValue={(option, value) => option?.scid === value?.scid}
                renderOption={(props, option) => (
                    <li {...props}>
                        <Grid key={option.scid} container alignItems="center" spacing={1}>
                            <Grid xs={0.6} item>
                                <FavoritedIcon value={option} disableRipple readOnly />
                            </Grid>
                            <Grid xs={9.4} item>
                                {option.scid}
                            </Grid>
                            <Grid xs={2} item>
                                <Type>{option.type}</Type>
                            </Grid>
                        </Grid>
                    </li>
                )}
                freeSolo
                autoHighlight
                onChange={handleAutocompleteChange}
                disabled={(connectionRequired && !isConnected) || disabled}
                readOnly={readOnly}
                PaperComponent={CustomPaper}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        error={error}
                        helperText={helperText}
                        label={label ? label : 'Please enter the ID of the existing SmartContract'}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: value && !noFavoriteIndicator && (
                                <InputAdornment position="start" sx={{ display: typeof value !== 'object' ? 'none' : undefined }}>
                                    {typeof value === 'object' && <TextFieldFavoritedIcon value={value} smartContractType={type} />}
                                </InputAdornment>
                            ),
                        }}
                        onChange={handleTextFieldChange}
                        onKeyDown={handleKeyDown}
                    />
                )}
            />
        </>
    );
};

export default ScidSelector;
