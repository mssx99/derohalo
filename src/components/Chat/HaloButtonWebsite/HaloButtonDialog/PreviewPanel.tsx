import React, { useState, useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import HaloButtonPreview from '../HaloButtonPreview';
import Popper from '@mui/material/Popper';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FileDownloadButton from 'components/common/FileDownloadButton';
import { HALO_BUTTON_JSCODE, getHaloButtonHtmlPage, getHaloButtonInsertCode } from './HaloButtonHelper';
import CopyToClipboardButton from 'components/common/CopyToClipboardButton';
import { useHaloButtonDialog } from '.';

const Container = styled('div')`
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;

    padding-top: 40px;
    padding-bottom: 25px;
    margin: 18px 0;
    border-radius: 10px;

    & > button {
        flex: 0 0 auto;
        align-self: center;
    }
`;

const ColorPickerHolder = styled('div')`
    position: absolute;
    top: 0;
    right: 0;

    & > input {
        border-end-start-radius: 10px;
        border-start-end-radius: 10px;
    }
`;

const ButtonHolder = styled('div')`
    display: flex;
    flex-direction: column;
    background-color: #000000a3;
    border-radius: 10px;
`;

const PreviewPanel: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();

    const [color, setColor] = useState<string>('#797272');

    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleColorChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setColor(value);
    };

    const handleClick = useCallback(
        (size: number, event: React.MouseEvent<HTMLElement>) => {
            setHaloButtonConfig({ ...haloButtonConfig, size });

            setAnchorEl(event.currentTarget);
            if (event.currentTarget === anchorEl) {
                setOpen((previousOpen) => !previousOpen);
            } else {
                setOpen(true);
            }
        },
        [anchorEl, open, haloButtonConfig]
    );

    const textToCopyForButton = useMemo(() => {
        return getHaloButtonInsertCode(haloButtonConfig.size, haloButtonConfig.fallbackUrl, haloButtonConfig.tooltip, haloButtonConfig.action, haloButtonConfig.data);
    }, [haloButtonConfig]);

    const createCompleteHTMLFile = useCallback(
        () => getHaloButtonHtmlPage(haloButtonConfig.size, haloButtonConfig.fallbackUrl, haloButtonConfig.tooltip, haloButtonConfig.action, haloButtonConfig.data),
        [haloButtonConfig]
    );

    return (
        <Container sx={{ backgroundColor: color }}>
            <ColorPickerHolder>
                <input type="color" id="favcolor" name="favcolor" value={color} onChange={handleColorChange} />
            </ColorPickerHolder>
            <HaloButtonPreview percentage={50} onClick={(event) => handleClick(50, event)} />
            <HaloButtonPreview percentage={100} onClick={(event) => handleClick(100, event)} />
            <HaloButtonPreview percentage={25} onClick={(event) => handleClick(25, event)} />
            <Popper
                open={open}
                anchorEl={anchorEl}
                style={{ zIndex: 10000 }}
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 10],
                        },
                    },
                ]}
                transition
            >
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={350}>
                        <ButtonHolder>
                            <FileDownloadButton
                                text="Download JS-file for Header-inclusion"
                                variant="text"
                                mimeType="application/javascript"
                                createData={createJSFileForHeaderInclusion}
                                filename="HaloButtonCode.js"
                            />
                            <CopyToClipboardButton textToCopy={textToCopyForButton}>Copy Script-tag for Button</CopyToClipboardButton>
                            <FileDownloadButton text="Download complete HTML-File" variant="text" mimeType="text/html" createData={createCompleteHTMLFile} filename="HaloButtonComplete.html" />
                        </ButtonHolder>
                    </Fade>
                )}
            </Popper>
        </Container>
    );
};

const createJSFileForHeaderInclusion = () => HALO_BUTTON_JSCODE;

export default PreviewPanel;
