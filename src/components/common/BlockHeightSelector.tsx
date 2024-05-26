import React, { useState, useRef, useEffect, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import NumberTextField from 'components/common/NumberTextField';
import { styled } from '@mui/material/styles';
import FormHelperText from '@mui/material/FormHelperText';
import { nanoid } from 'nanoid';
import { useBlockchainInfo } from 'hooks/deroHooks';
import { NumberFormatValues } from 'react-number-format';
import { useRunIfVisible } from 'hooks/mainHooks';

interface IBlockHeightSelector {
    id?: string;
    label?: string;
    helperText?: string;
    minBlocks?: number;
    value?: number;
    readOnly?: boolean;
    onChange?: (result: IBlockHeightSelectorReturnValue) => void;
}

export interface IBlockHeightSelectorReturnValue {
    blocks: number;
    date: Dayjs;
}

interface IContainer {
    direction?: 'row' | 'column';
}

const Container = styled('div')<IContainer>(({ direction = 'row' }) => ({
    display: 'flex',
    gap: '10px',
    flexDirection: direction,
    '& > div:first-of-type': {
        flexGrow: 1,
    },
}));

const calcBlock = (date: Dayjs, blocktime: number) => {
    if (date == null) return null;
    let blocks = Math.round((date.valueOf() - dayjs().valueOf()) / (blocktime * 1000));
    if (blocks < 0) blocks = 0;
    return blocks;
};

const calcDate = (blocks: number, blocktime: number) => {
    if (blocks == null) return null;
    const newDate = dayjs().add(blocks * blocktime, 'second');
    return newDate;
};

const BlockheightSelector: React.FC<IBlockHeightSelector> = ({ id, label, helperText, minBlocks = 0, value, readOnly = false, onChange }) => {
    if (!id) id = nanoid();

    const { blockheight: currentBlockheight, blocktime } = useBlockchainInfo();

    const divRef = useRef<HTMLDivElement>(null);

    const [blocks, setBlocks] = useState(0);
    const [date, setDate] = useState<Dayjs | null>(calcDate(blocks, blocktime));
    const [dateFocussed, setDateFocussed] = useState(false);

    const refBlocks = useRef(blocks);
    const refDate = useRef(date);
    const refMinBlocks = useRef(minBlocks);
    const refDateFocussed = useRef(dateFocussed);
    const refCurrentBlockheight = useRef(currentBlockheight);

    refBlocks.current = blocks;
    refMinBlocks.current = minBlocks;
    refDate.current = date;
    refDateFocussed.current = dateFocussed;
    refCurrentBlockheight.current = currentBlockheight;

    const sendChange = useCallback(
        (blocks: number) => {
            if (!onChange) return;
            if (!blocks) blocks = refMinBlocks.current;
            const date = calcDate(blocks, blocktime);
            onChange({ blocks, date: date as Dayjs });
        },
        [onChange]
    );

    const handleDateChanged = useCallback(
        (newDate: Dayjs | null) => {
            let calculatedBlocks = calcBlock(newDate ?? dayjs(), blocktime);
            if (!calculatedBlocks || calculatedBlocks < refMinBlocks.current) {
                calculatedBlocks = refMinBlocks.current;
                newDate = calcDate(refMinBlocks.current, blocktime);
            }
            setDate(newDate);
            if (refBlocks.current != calculatedBlocks) setBlocks(calculatedBlocks);
            sendChange(calculatedBlocks);
        },
        [blocktime, sendChange]
    );

    const handleBlocksChanged = useCallback(
        ({ floatValue: newBlocks }: NumberFormatValues) => {
            newBlocks = newBlocks ?? 0;

            if (newBlocks < refMinBlocks.current) newBlocks = refMinBlocks.current;

            if (newBlocks != refBlocks.current) {
                setBlocks(newBlocks);
                sendChange(newBlocks);
            }
        },
        [sendChange]
    );

    const update = useCallback(() => {
        if (refDateFocussed.current) {
            handleDateChanged(refDate.current);
        } else {
            const calculatedDate = calcDate(refBlocks.current, blocktime);
            setDate(calculatedDate);
            sendChange(refBlocks.current);
        }
    }, [blocktime, sendChange]);

    useRunIfVisible(divRef, update, 1000);

    useEffect(() => {
        setBlocks(value ?? 0);
    }, [value]);

    return (
        <>
            <Container ref={divRef} direction="row">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                        label="Approximate Date"
                        slotProps={{
                            textField: {
                                variant: 'filled',
                                inputProps: {
                                    onFocus: () => setDateFocussed(true),
                                    onBlur: () => setDateFocussed(false),
                                },
                            },
                        }}
                        value={date}
                        disabled={readOnly}
                        onChange={handleDateChanged}
                    />
                </LocalizationProvider>
                <NumberTextField label={label} suffix="blocks" thousandSeparator decimalScale={0} value={blocks} onValueChange={handleBlocksChanged} readOnly={readOnly} />
            </Container>
            <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>
        </>
    );
};

export default BlockheightSelector;
