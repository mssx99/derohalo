import React, { useEffect, useRef, useCallback, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { styled } from '@mui/material/styles';
import GuaranteeDesigner from 'components/GuaranteeDesigner';
import Listings from 'components/Listings';
import MultiSigDesigner from 'components/MultiSigDesigner';
import { a11yProps } from 'helpers/UIHelpers';
import TabPanel from 'components/common/TabPanel';
import Chat from 'components/Chat';
import Dialogs from './Dialogs';
import Snackbars from 'components/screen/Snackbars';
import SettingsPanel from './SettingsPanel';
import { setCurrentTab, useCurrentTab, useStartup } from 'hooks/mainHooks';
import Backdrops from './Backdrops';
import Web from 'components/Web';
import { openWelcomeScreen } from './WelcomeDialog';

const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
});

const TabsSplitter = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    zIndex: 1299,
    backgroundColor: 'black',
    '& div:nth-of-type(1)': {
        flexGrow: 1,
        flexShrink: 1,
    },
});

const PanelContent = styled('div')({
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexGrow: 1,
    background:
        'linear-gradient(217deg, rgba(255, 0, 0, 0.8), rgba(255, 0, 0, 0) 70.71%), linear-gradient(127deg, rgba(0, 255, 0, 0.8), rgba(0, 255, 0, 0) 70.71%), linear-gradient(336deg, rgba(0, 0, 255, 0.8), rgba(0, 0, 255, 0) 70.71%)',
});

const ImageLogo = styled('img')`
    cursor: pointer;
    height: 26px;
    margin: 5px;
    margin-right: 15px;
    margin-top: 0;
    align-self: center;
`;

const tabs = [
    { label: 'MultiSignature', component: <MultiSigDesigner /> },
    { label: 'Guarantee', component: <GuaranteeDesigner /> },
    { label: 'Listings', component: <Listings /> },
    { label: 'Chat', component: <Chat /> },
    { label: 'Web', component: <Web /> },
];

interface ITabValueHolder {}

const Main: React.FC = () => {
    const [touchStartX, setTouchStartX] = useState<number>(0);
    const [scrollStartX, setScrollStartX] = useState<number>(0);
    const tabsRef = React.useRef<HTMLDivElement>(null);
    const panelContainerRef = React.useRef<HTMLDivElement>(null);

    const [value, setValue] = React.useState(0);
    const oldValue = React.useRef<number>(0);
    const noAnimation = React.useRef(false);

    useStartup();

    const currentTab = useCurrentTab();

    const checkCurrentTab = useCallback(() => {
        const newValue = tabs.findIndex((t) => t.label === currentTab);
        if (newValue > -1 && newValue !== value) {
            oldValue.current = value;
            setValue(newValue);
        }
    }, [currentTab, value]);

    useEffect(() => {
        checkCurrentTab();
    }, [currentTab]);

    if (oldValue.current == null) {
        oldValue.current = value;
    }

    let valueX = value;
    let oldValueX = oldValue.current;

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        const tab = tabs[newValue].label;
        setCurrentTab(tab);
    };

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!tabsRef.current) return;
        const tabScroller = tabsRef.current.querySelector('.MuiTabs-scroller');
        setTouchStartX(e.touches[0].clientX);
        setScrollStartX(tabScroller!.scrollLeft);
        e.preventDefault();
    }, []);

    const handleTouchMove = useCallback(
        (e: React.TouchEvent<HTMLDivElement>) => {
            if (!tabsRef.current) return;
            const tabScroller = tabsRef.current.querySelector('.MuiTabs-scroller');
            const touchCurrentX = e.touches[0].clientX;
            const moveX = touchStartX - touchCurrentX;
            const newScrollX = scrollStartX + moveX;
            tabScroller!.scrollLeft = newScrollX;
            e.preventDefault();
        },
        [touchStartX, scrollStartX]
    );

    const handleLogoClick = () => {
        openWelcomeScreen();
    };

    const wheelTurned = (event: React.WheelEvent<HTMLDivElement>) => {
        if (!tabsRef.current) return;
        const tabScroller = tabsRef.current.querySelector('.MuiTabs-scroller');

        if (!tabScroller) return;

        if (event.deltaY < 0) {
            tabScroller.scrollBy(-50, 0);
        } else {
            tabScroller.scrollBy(50, 0);
        }
        event.stopPropagation();
    };

    return (
        <>
            <Container>
                <TabsSplitter onWheel={wheelTurned} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
                    <ImageLogo id="derohaloLogo_Title" src="./derohaloLogo.png" onClick={handleLogoClick} />

                    <Tabs ref={tabsRef} className="displayTabs preventSelect" value={valueX} onChange={handleChange} aria-label="Application Options">
                        {tabs.map((t, index) => (
                            <Tab key={`tab${index}`} label={t.label} {...a11yProps(index)} />
                        ))}
                    </Tabs>

                    <SettingsPanel />
                </TabsSplitter>
                <PanelContent ref={panelContainerRef}>
                    {tabs.map((t, index) => (
                        <TabPanel key={`tabPanel${index}`} value={valueX} oldValue={oldValueX} index={index} noAnimation={noAnimation.current} container={panelContainerRef.current as HTMLElement}>
                            {t.component}
                        </TabPanel>
                    ))}
                </PanelContent>
                <Snackbars />
            </Container>
            <Dialogs />
            <Backdrops />
        </>
    );
};

export default Main;
