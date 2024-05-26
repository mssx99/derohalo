import Draggable from 'react-draggable';
import React, { Ref, RefObject, ReactNode } from 'react';
import { useXarrow } from 'react-xarrows';

const boxStyle = {
    border: '1px #999 solid',
    borderRadius: '10px',
    textAlign: 'center',
    width: '200px',
    height: '60px',
    color: 'white',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    padding: '10px',
} as const;

interface IDraggableBoxProps {
    text?: string;
    children?: ReactNode;
}

export const DraggableBox = React.forwardRef<HTMLDivElement, IDraggableBoxProps>((props, ref: Ref<HTMLDivElement>) => {
    const updateXarrow = useXarrow();

    return (
        <Draggable nodeRef={ref as RefObject<HTMLDivElement>} onDrag={updateXarrow} onStop={updateXarrow} bounds="parent" cancel=".excluded">
            <div ref={ref} style={boxStyle}>
                {props.children ?? (
                    <div className="excluded" style={{ backgroundColor: 'green' }}>
                        {props.text}
                        <input value="ok" />
                    </div>
                )}
            </div>
        </Draggable>
    );
});
