import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

import { styled, css } from '@mui/material/styles';
import WalletTable from './WalletTable';
import ScTable from './ScTable';

const a11yProps = (index: number) => {
    return {
        id: `editor-tabs-${index}`,
        'aria-controls': `editor-tabpanel-${index}`,
    };
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const EditorContent = styled('div')(
    css`
        /* display: flex;
        flex-direction: column;

        & > div:nth-of-type(1) {
            padding: 24px;
        }

        & > div:nth-of-type(2) {
        } */
    `
);

const CustomTabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <EditorContent role="tabpanel" hidden={value !== index} id={`editor-tabpanel-${index}`} aria-labelledby={`editor-tabs-${index}`} {...other}>
            {value === index && children}
        </EditorContent>
    );
};

const EditorTabs: React.FC = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div>
            <div>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Wallets (Chat)" {...a11yProps(0)} />
                    <Tab label="SmartContracts" {...a11yProps(1)} />
                </Tabs>
            </div>

            <CustomTabPanel value={value} index={0}>
                <WalletTable width="100%" />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <ScTable width="100%" />
            </CustomTabPanel>
        </div>
    );
};

export default EditorTabs;
