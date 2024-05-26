import React, { useMemo, useState, useEffect, useCallback, useId } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { updateStage, useContract } from 'hooks/guaranteeHooks';
import { calcStageDependencies } from 'helpers/Guarantee/DependencyGraphCalc';
import { styled } from '@mui/material/styles';
import TextField from 'components/common/TextField';
import NumberTextField from 'components/common/NumberTextField';
import { NumberFormatValues } from 'react-number-format';
import { ITimeCount, calculateEstimatedDate, convertBlocksToTimeCount, convertTimeCountToBlocks } from 'helpers/DeroHelper';
import { useCurrentBlockheight, useCurrentBlockheightOrEstimate } from 'hooks/deroHooks';
import { formatNumber, formatTime } from 'helpers/FormatHelper';

interface IDependency {
    stage: IStage;
}

const DependencyContainer = styled('div')`
    display: flex;
    flex-direction: column;
`;

const OPTIONS = {
    DYNAMIC_AFTER_CONTRACT_INSTALL: 'DYNAMIC_AFTER_CONTRACT_INSTALL',
    DYNAMIC_AFTER_CONTRACT_START: 'DYNAMIC_AFTER_CONTRACT_START',
    DYNAMIC_STAGE: 'DYNAMIC_STAGE',
    FIXED: 'FIXED',
    NO_LIMIT: 'NO_LIMIT',
};

const Dependency: React.FC<IDependency> = ({ stage }) => {
    const { isLoaded, contract } = useContract();
    const [selection, setSelection] = useState<string>(OPTIONS.NO_LIMIT);
    const [blocks, setBlocks] = useState<number>(0);

    const id_selectLabel = useId();

    useEffect(() => {
        if (stage.offsetTo === undefined && stage.blocks > 0) {
            setSelection(OPTIONS.FIXED);
            setBlocks(stage.blocks);
        } else if (stage.offsetTo === -1) {
            setSelection(OPTIONS.DYNAMIC_AFTER_CONTRACT_START);
            setBlocks(stage.blocks);
        } else if (stage.offsetTo === -2) {
            setSelection(OPTIONS.DYNAMIC_AFTER_CONTRACT_INSTALL);
            setBlocks(stage.blocks);
        } else if (stage.offsetTo && stage.offsetTo > 0) {
            setSelection(OPTIONS.DYNAMIC_STAGE + stage.offsetTo);
            setBlocks(stage.blocks);
        } else {
            setSelection(OPTIONS.NO_LIMIT);
            setBlocks(0);
        }
    }, [stage]);

    const handleChange = useCallback(
        (event: SelectChangeEvent) => {
            const selected = event.target.value;
            if (selected === OPTIONS.FIXED) {
                updateStage({ ...stage, offsetTo: undefined, blocks: 1 });
            } else if (selected === OPTIONS.DYNAMIC_AFTER_CONTRACT_START) {
                updateStage({ ...stage, offsetTo: -1, blocks: 1000 });
            } else if (selected === OPTIONS.DYNAMIC_AFTER_CONTRACT_INSTALL) {
                updateStage({ ...stage, offsetTo: -2, blocks: 1000 });
            } else if (selected.startsWith(OPTIONS.DYNAMIC_STAGE) && parseInt(selected.substring(OPTIONS.DYNAMIC_STAGE.length)) > 0) {
                // Stages
                updateStage({ ...stage, offsetTo: parseInt(selected.substring(OPTIONS.DYNAMIC_STAGE.length)), blocks: 1000 });
            } else {
                // NoLimit
                updateStage({ ...stage, offsetTo: undefined, blocks: 0 });
            }
        },
        [stage]
    );

    const handleBlockUpdate = useCallback(
        (blocks: Uint64) => {
            updateStage({ ...stage, blocks });
        },
        [stage]
    );

    const stageOptions = useMemo(() => {
        const removeOptions = calcStageDependencies(contract).get(stage.id) ?? [];
        removeOptions.push(stage.id);
        return contract.stages.filter((s) => !removeOptions.includes(s.id)).map((s) => s.id);
    }, [contract, stage]);

    return (
        <DependencyContainer>
            <FormControl variant="filled" sx={{ minWidth: 120 }}>
                <InputLabel id={id_selectLabel}>Type</InputLabel>
                <Select labelId={id_selectLabel} value={selection} onChange={handleChange} inputProps={{ readOnly: isLoaded }}>
                    <MenuItem value={OPTIONS.NO_LIMIT}>No Limit</MenuItem>
                    <MenuItem value={OPTIONS.FIXED}>Maximum Blockheight</MenuItem>
                    <MenuItem value={OPTIONS.DYNAMIC_AFTER_CONTRACT_START}>Dynamic / After Contract Start</MenuItem>
                    <MenuItem value={OPTIONS.DYNAMIC_AFTER_CONTRACT_INSTALL}>Dynamic / After Contract Install</MenuItem>
                    {stageOptions.map((option) => (
                        <MenuItem key={option} value={OPTIONS.DYNAMIC_STAGE + option}>
                            Dynamic / After Stage {option} finishes
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {selection.startsWith('DYNAMIC') && <Dynamic stage={stage} readOnly={isLoaded} />}
            {selection.startsWith('FIXED') && <Fixed stage={stage} readOnly={isLoaded} />}
        </DependencyContainer>
    );
};

interface IBlockEditor {
    stage: IStage;
    readOnly: boolean;
}

const DynamicContainer = styled('div')`
    display: flex;
    flex-direction: row;
`;

const Dynamic: React.FC<IBlockEditor> = ({ stage, readOnly }) => {
    const [value, setValue] = useState<ITimeCount | null>(null);
    const [blocks, setBlocks] = useState<Uint64>(0);

    useEffect(() => {
        setValue(convertBlocksToTimeCount(stage.blocks));
        setBlocks(stage.blocks);
    }, [stage.id, stage.offsetTo]);

    useEffect(() => {
        setBlocks(stage.blocks);
    }, [stage.blocks]);

    const handleChange = useCallback(
        (timeCount: ITimeCount) => {
            timeCount = {
                years: isNaN(timeCount.years) ? 0 : timeCount.years,
                months: isNaN(timeCount.months) ? 0 : timeCount.months,
                days: isNaN(timeCount.days) ? 0 : timeCount.days,
                hours: isNaN(timeCount.hours) ? 0 : timeCount.hours,
                minutes: isNaN(timeCount.minutes) ? 0 : timeCount.minutes,
                seconds: isNaN(timeCount.seconds) ? 0 : timeCount.seconds,
            };
            updateStage({ ...stage, blocks: convertTimeCountToBlocks(timeCount) });
        },
        [stage]
    );

    const handleBlocksChange = useCallback(
        (newBlocks: Uint64) => {
            setValue(convertBlocksToTimeCount(newBlocks));
            updateStage({ ...stage, blocks: newBlocks });
        },
        [stage]
    );

    if (!value) return <></>;

    return (
        <>
            <DynamicContainer>
                <NumberTextField
                    label="Years"
                    value={value.years}
                    onValueChange={(nfv) => handleChange({ ...value, years: parseInt(nfv.value) })}
                    thousandSeparator
                    decimalScale={0}
                    readOnly={readOnly}
                />
                <NumberTextField
                    label="Months"
                    value={value.months}
                    onValueChange={(nfv) => handleChange({ ...value, months: parseInt(nfv.value) })}
                    thousandSeparator
                    decimalScale={0}
                    readOnly={readOnly}
                />
                <NumberTextField
                    label="Days"
                    value={value.days}
                    onValueChange={(nfv) => handleChange({ ...value, days: parseInt(nfv.value) })}
                    thousandSeparator
                    decimalScale={0}
                    readOnly={readOnly}
                />
                <NumberTextField
                    label="Hours"
                    value={value.hours}
                    onValueChange={(nfv) => handleChange({ ...value, hours: parseInt(nfv.value) })}
                    thousandSeparator
                    decimalScale={0}
                    readOnly={readOnly}
                />
                <NumberTextField
                    label="Minutes"
                    value={value.minutes}
                    onValueChange={(nfv) => handleChange({ ...value, minutes: parseInt(nfv.value) })}
                    thousandSeparator
                    decimalScale={0}
                    readOnly={readOnly}
                />
                <NumberTextField
                    label="Seconds"
                    value={value.seconds}
                    onValueChange={(nfv) => handleChange({ ...value, seconds: parseInt(nfv.value) })}
                    thousandSeparator
                    decimalScale={0}
                    readOnly={readOnly}
                />
            </DynamicContainer>
            <NumberTextField label="Blocks" value={blocks} onValueChange={(nfv) => handleBlocksChange(parseInt(nfv.value))} thousandSeparator decimalScale={0} readOnly={readOnly} />
        </>
    );
};

const Fixed: React.FC<IBlockEditor> = ({ stage, readOnly }) => {
    const currentBlockheight = useCurrentBlockheightOrEstimate();

    const handleChange = useCallback(
        (blocks: number) => {
            updateStage({ ...stage, blocks });
        },
        [stage]
    );

    const helperText = useMemo(() => {
        if (stage.blocks <= currentBlockheight.blockheight) {
            return currentBlockheight.estimate
                ? `This is before the current estimated blockheight: ${formatNumber(currentBlockheight.blockheight)}.`
                : `This is before the current blockheight: ${formatNumber(currentBlockheight.blockheight)}.`;
        } else if (stage.blocks <= currentBlockheight.blockheight + 1000) {
            return currentBlockheight.estimate
                ? `This blockheight seems to be very close (estimated blockheight: ${formatNumber(currentBlockheight.blockheight)}).`
                : `This blockheight is very close (current blockheight: ${formatNumber(currentBlockheight.blockheight)}).`;
        } else {
            return currentBlockheight.estimate
                ? `Estimated date for this blockheight: ${formatTime(calculateEstimatedDate(stage.blocks, currentBlockheight.blockheight))}.`
                : `Estimated date for this blockheight: ${formatTime(calculateEstimatedDate(stage.blocks, currentBlockheight.blockheight))}.`;
        }
    }, [stage.blocks, currentBlockheight]);

    return (
        <div>
            <NumberTextField
                label="Maximum Blockheight in absolute terms (use carefully!)"
                value={stage.blocks}
                onIntegerChange={handleChange}
                decimalScale={0}
                fullWidth
                thousandSeparator
                helperText={helperText}
                error={stage.blocks <= currentBlockheight.blockheight + 1000}
                readOnly={readOnly}
            />
        </div>
    );
};

export default Dependency;
