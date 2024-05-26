import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import AudioPlayer from 'components/common/AudioPlayer';
import { VisualizerBackground } from 'components/Chat/dialogs/AudioConfiguratorDialog';

interface IAudioMessage {
    value: IChatMessage;
}

const AudioMessage: React.FC<IAudioMessage> = ({ value: message }) => {
    return (
        <VisualizerBackground>
            <AudioPlayer base64={message.content} />
        </VisualizerBackground>
    );
};

export default AudioMessage;
