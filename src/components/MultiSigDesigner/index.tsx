import React from 'react';

import MultiSigMainScreen from './MultiSigMainScreen';
import { ArrowProvider } from 'contexts/MultiSigArrowContext';

const MultiSigDesigner: React.FC = () => {
    return (
        <ArrowProvider>
            <MultiSigMainScreen />
        </ArrowProvider>
    );
};

export default MultiSigDesigner;
