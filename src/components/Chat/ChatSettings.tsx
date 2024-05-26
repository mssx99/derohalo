import React, { useState, useCallback, useEffect, useRef } from 'react';
import { styled } from '@mui/material/styles';
import DeroAmountField from 'components/common/DeroAmountField';
import Slider from '@mui/material/Slider';
import { setCurrentChatMinimum, useCurrentChat, useCurrentChatMinimum } from 'hooks/chatHooks';
import DeroAmount from 'components/common/DeroAmount';
import { formatDeroAmount } from 'helpers/FormatHelper';
import LocalStorage from 'browserStorage/localStorage';
import { useDebounce } from 'hooks/mainHooks';
import { usePublicDirectoryEntryForChat } from 'hooks/webHooks';
import { convertToFormatIndependentDeroAddress } from 'helpers/DeroHelper';

const Container = styled('div')`
    margin-bottom: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;

    & > span {
        margin: 0 10px;
    }
`;

const DELAY_CHAT_MINIMUM_UPDATE = 200;

const ChatSettings: React.FC = () => {
    const currentChat = useCurrentChat();
    const currentChatRef = useRef<IChat | null>(null);
    const currentChatMinimum = useCurrentChatMinimum();

    const { here } = usePublicDirectoryEntryForChat(currentChat);

    const handleAppliedMinChangeRef = useRef<(newAppliedMin: Uint64) => void>();

    const [sliderMin, setSliderMin] = useState(1);
    const [sliderMax, setSliderMax] = useState(1000000);

    const [appliedMin, setAppliedMin] = useState(1);

    const debouncedAppliedMin = useDebounce(appliedMin, DELAY_CHAT_MINIMUM_UPDATE);
    const userInteractionRef = useRef<boolean>();

    const handleAppliedMinChange = useCallback(
        (newAppliedMin: Uint64) => {
            if (newAppliedMin > sliderMax) {
                setSliderMax(newAppliedMin);
            } else if (newAppliedMin < sliderMin) {
                setSliderMin(newAppliedMin);
            }
            setAppliedMin(newAppliedMin);
        },
        [sliderMin, sliderMax]
    );

    useEffect(() => {
        currentChatRef.current = currentChat;
        handleAppliedMinChangeRef.current = handleAppliedMinChange;
    }, [currentChat, handleAppliedMinChange]);

    useEffect(() => {
        userInteractionRef.current = false;
        const localMinimum = LocalStorage.getChatMinimumForAddress(here.otherParty);
        const newAppliedMin = localMinimum ?? here.minimum;
        handleAppliedMinChangeRef.current?.(newAppliedMin);
        setCurrentChatMinimum(newAppliedMin);
    }, [here]);

    useEffect(() => {
        if (userInteractionRef.current) {
            setCurrentChatMinimum(debouncedAppliedMin);
            LocalStorage.setChatMinimumForAddress(convertToFormatIndependentDeroAddress(currentChatRef.current?.otherParty?.address ?? null), debouncedAppliedMin);
        }
    }, [debouncedAppliedMin]);

    const handleSliderChange = useCallback((event: Event, newValue: number | number[]) => {
        const sliderValue = newValue as number;
        userInteractionRef.current = true;
        setAppliedMin(sliderValue);
    }, []);

    const handleSliderMinChange = useCallback(
        (newSliderMin: Uint64) => {
            if (newSliderMin <= sliderMax) {
                setSliderMin(newSliderMin);
            } else {
                const oldSliderMax = sliderMax;
                setSliderMax(newSliderMin);
                setSliderMin(sliderMax);
                newSliderMin = sliderMax;
            }
            if (appliedMin < newSliderMin) {
                userInteractionRef.current = true;
                setAppliedMin(newSliderMin);
            }
        },
        [sliderMin, sliderMax, appliedMin]
    );

    const handleSliderMaxChange = useCallback(
        (newSliderMax: Uint64) => {
            if (newSliderMax >= sliderMin) {
                setSliderMax(newSliderMax);
            } else {
                const oldSliderMin = sliderMin;
                setSliderMin(newSliderMax);
                setSliderMax(sliderMin);
                newSliderMax = sliderMin;
            }
            if (appliedMin > newSliderMax) {
                userInteractionRef.current = true;
                setAppliedMin(newSliderMax);
            }
        },
        [sliderMin, sliderMax, appliedMin]
    );

    return (
        <Container>
            <DeroAmountField label="Slider Min" value={sliderMin} onValueChange={handleSliderMinChange} />
            <Slider
                aria-label="Minimum Slider"
                valueLabelDisplay="auto"
                onChange={handleSliderChange}
                min={sliderMin}
                max={sliderMax}
                value={appliedMin}
                valueLabelFormat={(value: number) => formatDeroAmount(value)}
            />
            <DeroAmountField label="Slider Max" value={sliderMax} onValueChange={handleSliderMaxChange} />
            <DeroAmountField label="Applied Minimum" value={appliedMin} onValueChange={handleAppliedMinChange} />
        </Container>
    );
};

export default ChatSettings;
