import React, { useState, useRef, useEffect, useCallback } from 'react';

import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { DeroDB_deleteSmartContract, DeroDB_insertOrUpdateSmartContract } from 'browserStorage/indexedDb';
import {
    insertOrUpdateSmartContractToFavorites,
    deleteSmartContractFromFavorites,
    isSmartContractDirectoryEntry,
    insertOrUpdateWalletToFavorites,
    isWalletDirectoryEntry,
    deleteWalletFromFavorites,
} from 'helpers/DirectoryHelper';
import { styled } from '@mui/material/styles';

interface IFavoritedIcon<T> extends Omit<CheckboxProps, 'onChange'> {
    value: T;
    smartContractType?: SmartContractType;
    onChange?: (value: T) => void;
    readOnly?: boolean;
}

const FavoritedIcon = <T extends ISmartContractDirectoryEntry | IWalletDirectoryEntry>({ value, onChange, readOnly = false, smartContractType, ...otherProps }: IFavoritedIcon<T>) => {
    const handleChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>, value: T) => {
            const checked = event.target.checked;
            if (readOnly) return;
            if (isWalletDirectoryEntry(value)) {
                if (checked) {
                    await insertOrUpdateWalletToFavorites(value);
                } else {
                    await deleteWalletFromFavorites(value?.address);
                }
            } else if (isSmartContractDirectoryEntry(value)) {
                if (checked) {
                    if (smartContractType) {
                        await insertOrUpdateSmartContractToFavorites(value, smartContractType);
                    } else {
                        throw new Error('No SmartContractType defined.');
                    }
                } else {
                    await deleteSmartContractFromFavorites(value?.scid);
                }
            }
            if (onChange) onChange({ ...value, isSaved: checked });
        },
        [value, readOnly]
    );

    return (
        <Checkbox
            size="small"
            icon={<BookmarkBorderIcon />}
            checkedIcon={<BookmarkIcon />}
            {...otherProps}
            checked={value.isSaved}
            onChange={(event) => handleChange(event, value)}
            readOnly={readOnly}
        />
    );
};

export const TextFieldFavoritedIcon = styled(FavoritedIcon)`
    margin: 0 !important;
    margin-top: -18px !important;
    margin-right: -14px !important;
    margin-left: -8px !important;
`;

export default FavoritedIcon;
