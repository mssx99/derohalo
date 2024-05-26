import React from 'react';
import { styled } from '@mui/material/styles';
import { HeaderTitle, SubTitle } from 'components/common/TextElements';
import { useContract, usePreview } from 'hooks/guaranteeHooks';

import Fieldset from 'components/common/Fieldset';
import Toolbar from './Toolbar';
import CodeDisplay from 'components/common/CodeDisplay';
import StageConfigTitle from './StageConfigTitle';
import StageConfig from './StageConfig';
import InfoPanel from './InfoPanel';
import BlockOptions from './BlockOptions';
import { ArrowProvider } from 'contexts/GuaranteeArrowContext';

const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
});

const GuaranteeMainScreen: React.FC = () => {
    const { contract } = useContract();
    const { preview } = usePreview();

    return (
        <Container id="MainScreenGuarantee">
            <HeaderTitle>Create your Guarantee Contract</HeaderTitle>

            <div className="previewContainer">
                <div className="configurator">
                    <Toolbar />

                    <Fieldset title="Parties">
                        <InfoPanel />
                    </Fieldset>

                    <Fieldset title={<StageConfigTitle />}>
                        <BlockOptions />
                        <ArrowProvider>
                            <StageConfig />
                        </ArrowProvider>
                    </Fieldset>
                </div>
                <CodeDisplay className="contract" show={preview} title="Generated SmartContract Code" code={contract.code} />
            </div>
        </Container>
    );
};

export default GuaranteeMainScreen;
