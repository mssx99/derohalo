import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { useCheckProtocolHandler } from 'helpers/ProtocolHelper';
import Paper, { PaperProps } from '@mui/material/Paper';
import CollapseFadeIn from 'components/common/CollapseFadeIn';

const PaperWithElevation = React.forwardRef<HTMLDivElement, PaperProps>((props, ref) => <Paper ref={ref as React.RefObject<HTMLDivElement>} {...props} elevation={1} />);

const ProtocolContainer = styled(PaperWithElevation)`
    padding: 10px;
    text-align: center;
    box-sizing: border-box;
`;

const PROTOCOL_CHECK_DELAY = 2000;

const ProtocolHandlerCheck: React.FC = () => {
    const [shouldRender, setShouldRender] = useState(false);
    const [iFrame, setIFrame] = useState<HTMLIFrameElement | null>(null);
    const isRegistered = useCheckProtocolHandler(iFrame);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShouldRender(true);
        }, PROTOCOL_CHECK_DELAY);

        return () => clearTimeout(timer);
    }, []);

    if (!shouldRender) {
        return <></>;
    }

    if (isRegistered === null) {
        return <iframe ref={(el) => setIFrame(el)} style={{ display: 'none' }} />;
    }

    if (isRegistered) return <></>;

    return (
        <CollapseFadeIn showing={true}>
            <ProtocolContainer>
                Service Handler for "web+derohalo:"-protocol is not set in your browser. In your addressbar you should have an icon with 2 overlapping rectangles. Click it and press "allow". This will
                route all DeroHalo-Button clicks here right away without using the fallback-url.
            </ProtocolContainer>
        </CollapseFadeIn>
    );
};

export default ProtocolHandlerCheck;
