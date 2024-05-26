import React, { useEffect, useState } from 'react';
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';

interface CollapseFadeIn {
    showing: boolean;
    children: React.ReactElement<any, any>;
}

const DISPLAY_DELAY = 1000;

const CollapseFadeIn: React.FC<CollapseFadeIn> = ({ showing, children }) => {
    const [renderedShowing, setRenderedShowing] = useState(false);

    useEffect(() => {
        setRenderedShowing(showing);
    }, [showing]);

    return (
        <Collapse in={renderedShowing} timeout={DISPLAY_DELAY}>
            <Fade in={renderedShowing} timeout={DISPLAY_DELAY}>
                {children}
            </Fade>
        </Collapse>
    );
};

export default CollapseFadeIn;
