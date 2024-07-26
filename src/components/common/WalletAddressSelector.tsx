import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';

import Autocomplete, { AutocompleteChangeReason, AutocompleteChangeDetails } from '@mui/material/Autocomplete';

import TextField from 'components/common/TextField';
import { useDebounce } from 'hooks/mainHooks';
import { getDeroAddress, getWalletAddress, isDeroAddress } from 'helpers/DeroHelper';
import { TYPING_ADDRESS_DELAY } from 'Constants';
import { EntryNotFoundError } from 'customErrors';

import Grid from '@mui/material/Grid';
import FavoritedIcon, { TextFieldFavoritedIcon } from './FavoritedIcon';
import _ from 'underscore';
import { useDirectoryWallets } from 'hooks/directoryHooks';

import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import { getAllWalletEntries, isWalletDirectoryEntry, updateWallets } from 'helpers/DirectoryHelper';
import { useIsConnected } from 'hooks/deroHooks';

interface IWalletAddressSelector {
    value: IWalletDirectoryEntry | string | null;
    error?: boolean;
    helperText?: ReactNode;
    disabled?: boolean;
    readOnly?: boolean;
    noOptions?: boolean;
    noFavoriteIndicator?: boolean;
    onChange: (address: IWalletDirectoryEntry | string | null, verified: boolean) => void;
    onEnter?: (scid: IWalletDirectoryEntry | string | null) => void;
}

const CustomPaper = styled(Paper)({
    width: 900,
});

const getOrCreateWalletDirectoryEntry = (directory: IWalletDirectoryEntry[], address: string | null, alias: string | null) => {
    let createdWalletEntry: IWalletDirectoryEntry | null = null;
    if (address) {
        const foundEntry = directory.find((entry) => entry.address === address);
        createdWalletEntry = foundEntry ? (foundEntry as IWalletDirectoryEntry) : ({ address, alias, flags: ['INVOLVED_MULTISIGNATURE'], isSaved: false } as IWalletDirectoryEntry);
    }
    return createdWalletEntry;
};

const WalletAddressSelector: React.FC<IWalletAddressSelector> = ({
    value: receivedAddress,
    error: forcedError,
    helperText: forcedHelperText,
    disabled,
    readOnly = false,
    onChange,
    onEnter,
    noOptions = false,
    noFavoriteIndicator = false,
}) => {
    const [value, setValue] = useState<IWalletDirectoryEntry | string | null>(null);
    const [helperText, setHelperText] = useState<ReactNode | null>(null);
    const [error, setError] = useState(false);
    const debouncedValue = useDebounce(value, TYPING_ADDRESS_DELAY);
    const isConnected = useIsConnected();
    const textRef = useRef<IWalletDirectoryEntry | string | null>(value);
    const viaSource = useRef<'USER' | 'DIRECTORY' | null>(null);

    const loadedDirectoryWallets = useDirectoryWallets();
    const loadedDirectoryWalletsRef = useRef<IWalletDirectoryEntry[]>([]);

    const setDisplayValue = (val: IWalletDirectoryEntry | string | null) => {
        textRef.current = val;
        setValue(val);
    };

    useEffect(() => {
        loadedDirectoryWalletsRef.current = loadedDirectoryWallets;

        const currentValue = textRef.current;

        const foundEntry = loadedDirectoryWallets.find((entry) => {
            if (isWalletDirectoryEntry(currentValue)) {
                return entry.address === currentValue.address;
            } else {
                return entry.address === currentValue;
            }
        });

        if (foundEntry) {
            if (isWalletDirectoryEntry(currentValue)) {
                if (!_.isEqual(foundEntry, currentValue)) {
                    setDisplayValue(foundEntry);
                }
            } else {
                setDisplayValue(foundEntry);
            }
        } else {
            if (isWalletDirectoryEntry(currentValue)) {
                setDisplayValue({ ...currentValue, flags: [], isSaved: false });
            }
        }
    }, [loadedDirectoryWallets]);

    // debounced handling
    useEffect(() => {
        let active = true;

        const currentObject = textRef.current;
        const currentText = getWalletAddress(currentObject);

        if (isWalletDirectoryEntry(currentObject)) {
            setError(false);
            setHelperText(null);
            return;
        }

        if (debouncedValue === currentText) {
            if (isDeroAddress(debouncedValue)) {
                setError(false);
                if (viaSource.current !== 'DIRECTORY') setHelperText('This seems to be a valid Dero Address.');
                const createdWalletEntry = getOrCreateWalletDirectoryEntry(loadedDirectoryWalletsRef.current, currentText, null);
                onChange(createdWalletEntry, true);
            } else if (debouncedValue) {
                if (isConnected) {
                    getDeroAddress(debouncedValue)
                        .then((address) => {
                            if (!active) return;
                            if (isDeroAddress(address)) {
                                setError(false);
                                viaSource.current = 'DIRECTORY';
                                setHelperText(`Translated via dero-directory using '${currentText}'.`);
                                const createdWalletEntry = getOrCreateWalletDirectoryEntry(loadedDirectoryWalletsRef.current, address, currentText);
                                onChange(createdWalletEntry, true);
                            } else {
                                setError(true);
                                setHelperText('This does not look like a registered name or address.');
                            }
                        })
                        .catch((e) => {
                            if (!active) return;
                            setError(true);
                            if (e instanceof EntryNotFoundError) {
                                setHelperText(e.message);
                            } else {
                                setHelperText('An error occurred querying the directory.');
                                console.error(e);
                            }
                        });
                }
            }
        }
        return () => {
            active = false;
        };
    }, [debouncedValue, isConnected, viaSource, onChange]);

    useEffect(() => {
        if (viaSource.current === 'DIRECTORY' || (getWalletAddress(value) === getWalletAddress(receivedAddress) && isWalletDirectoryEntry(receivedAddress) && !isWalletDirectoryEntry(value))) {
            if (isWalletDirectoryEntry(receivedAddress)) {
                setDisplayValue(receivedAddress);
            } else {
                const alias = isWalletDirectoryEntry(value) ? value.alias ?? null : value;
                const createdWalletEntry = getOrCreateWalletDirectoryEntry(loadedDirectoryWalletsRef.current, receivedAddress, alias);
                setDisplayValue(createdWalletEntry);
            }
            return;
        }

        if (getWalletAddress(value) !== getWalletAddress(receivedAddress) && !viaSource.current) {
            if (isWalletDirectoryEntry(receivedAddress)) {
                setDisplayValue(receivedAddress);
            } else {
                const createdWalletEntry = getOrCreateWalletDirectoryEntry(loadedDirectoryWalletsRef.current, receivedAddress, null);
                setDisplayValue(createdWalletEntry);
            }
        }
    }, [receivedAddress, value, viaSource]);

    const textUpdate = useCallback(
        (value: IWalletDirectoryEntry | string | null) => {
            const newValue = getWalletAddress(value)?.trim() ?? null;
            viaSource.current = null;
            if (isWalletDirectoryEntry(value)) {
                setError(false);
                setHelperText(null);
                textRef.current = value;
                onChange(value, true);
                return;
            }

            setDisplayValue(newValue);
            viaSource.current = 'USER';

            const isValidFormat = isDeroAddress(newValue);
            if (isValidFormat) {
                setError(false);
                setHelperText('This seems to be a valid Dero Address.');
                const createdWalletEntry = getOrCreateWalletDirectoryEntry(loadedDirectoryWalletsRef.current, newValue, null);
                onChange(createdWalletEntry, true);
                queueMicrotask(updateWallets);
                return;
            } else if (!newValue) {
                setError(false);
                setHelperText('');
                onChange(null, true);
                queueMicrotask(updateWallets);
                return;
            }

            if (isConnected || (!isConnected && !isValidFormat)) {
                setError(true);
                setHelperText('This seems to be NOT a valid Dero Address.');
            }
        },
        [error, helperText, isConnected, onChange]
    );

    const handleTextFieldChange = useCallback(
        ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            textUpdate(value);
        },
        [textUpdate]
    );

    const handleAutocompleteChange = useCallback(
        (
            event: React.SyntheticEvent<Element, Event>,
            value: IWalletDirectoryEntry | string | null,
            reason: AutocompleteChangeReason,
            details?: AutocompleteChangeDetails<IWalletDirectoryEntry> | undefined
        ) => {
            if (reason === 'clear') {
                textUpdate(null);
            } else {
                textUpdate(value);
            }
        },
        [textUpdate]
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
        <Autocomplete
            id="walletAddressSelector"
            fullWidth
            options={noOptions ? [] : loadedDirectoryWallets}
            getOptionLabel={(option) => {
                if (isWalletDirectoryEntry(option)) return option.address;
                return option;
            }}
            isOptionEqualToValue={(option, value) => option?.address === value?.address}
            renderOption={(props, option) => (
                <li {...props} key={option.address}>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid xs={0.6} item>
                            <FavoritedIcon value={option} disableRipple readOnly />
                        </Grid>
                        <Grid xs={3.4} item>
                            {option.alias}
                        </Grid>
                        <Grid xs={8} item style={{ textAlign: 'end' }}>
                            {option.address}
                        </Grid>
                        <Grid container justifyContent="flex-end" style={{ marginTop: '-5px' }}>
                            <Grid xs={12} item style={{ paddingTop: '0px', display: 'flex', gap: 10 }}>
                                <Flags value={option} />
                            </Grid>
                        </Grid>
                    </Grid>
                </li>
            )}
            freeSolo
            autoHighlight
            value={value}
            inputValue={getWalletAddress(textRef.current) ?? ''}
            disabled={disabled}
            readOnly={readOnly}
            PaperComponent={CustomPaper}
            onChange={handleAutocompleteChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={forcedError === undefined ? error : forcedError}
                    helperText={forcedHelperText ?? helperText}
                    label="Wallet Address or registered Name"
                    variant="filled"
                    InputProps={{
                        ...params.InputProps,
                        readOnly,
                        startAdornment: value && !noFavoriteIndicator && (
                            <InputAdornment position="start" sx={{ display: typeof value !== 'object' ? 'none' : undefined }}>
                                {typeof value === 'object' && <TextFieldFavoritedIcon value={value} />}
                            </InputAdornment>
                        ),
                    }}
                    onChange={handleTextFieldChange}
                    onKeyDown={handleKeyDown}
                />
            )}
        />
    );
};

const Type = styled('div')({
    color: '#7e7d7d',
    textAlign: 'center',
    fontSize: '12px',
    border: '1px solid #7e7d7d',
    borderRadius: '5px',
    display: 'inline',
    padding: '4px',
});

interface IFlags {
    value: IWalletDirectoryEntry;
}

const Flags: React.FC<IFlags> = ({ value }) => {
    return (
        <>
            {value &&
                value.flags.map((flag, index) => {
                    return <Type key={index}>{flag}</Type>;
                })}
        </>
    );
};

export default WalletAddressSelector;
