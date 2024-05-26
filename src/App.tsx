import React from 'react';
import Main from 'components/Main';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useAudioContext } from 'helpers/AudioHelper';
import { ProtocolHelper } from 'helpers/ProtocolHelper';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const App: React.FC = () => {
    useAudioContext();
    const onlyTest = ProtocolHelper.checkIfTest();

    if (onlyTest) {
        window.parent.postMessage('derohalo supported', '*');
        return <></>;
    }

    return (
        <ThemeProvider theme={darkTheme}>
            <Main />
        </ThemeProvider>
    );
};

export default App;
