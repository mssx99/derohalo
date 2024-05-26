import React, { useRef } from 'react';
import HaloButtonBase64 from './HaloButtonDialog/HaloButtonBase64';

interface IHaloButtonPreview {
    percentage?: number;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    tooltipText?: string;
}

const HaloButtonPreview: React.FC<IHaloButtonPreview> = ({ percentage = 100, onClick, tooltipText = 'Open chat' }) => {
    const newSize = 200 * (percentage / 100);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const buttonContentRef = useRef<HTMLDivElement>(null);
    const buttonIconRef = useRef<HTMLDivElement>(null);

    const buttonStyle: React.CSSProperties = {
        position: 'relative',
        padding: '0',
        width: `${newSize}px`,
        height: `${newSize}px`,
        border: `${newSize / 50}px solid #888888`,
        outline: 'none',
        backgroundColor: '#f4f5f6',
        borderRadius: `${newSize / 5}px`,
        boxShadow: '-6px -20px 35px #ffffff, -6px -10px 15px #ffffff, -20px 0px 30px #ffffff, 6px 20px 25px rgba(0, 0, 0, 0.2)',
        transition: '0.13s ease-in-out',
        cursor: 'pointer',
        boxSizing: 'border-box',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
    };

    const buttonContentStyle: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        paddingTop: `${newSize / 10}px`,
        width: '100%',
        height: '100%',
        boxShadow: 'inset 0px -8px 0px #dddddd, 0px -8px 0px #f4f5f6',
        borderRadius: `${newSize / 5}px`,
        transition: '0.13s ease-in-out',
        zIndex: 1,
        boxSizing: 'border-box',
        WebkitTapHighlightColor: 'transparent',
    };

    const buttonIconStyle: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        transform: 'translate3d(0px, -4px, 0px)',
        gridColumn: '4',
        alignSelf: 'start',
        justifySelf: 'end',
        width: `${newSize * 0.9}px`,
        height: `${newSize * 0.75}px`,
        transition: '0.13s ease-in-out',
    };

    const imgStyle: React.CSSProperties = {
        width: `${newSize * 0.9}px`,
        height: `${newSize * 0.75}px`,
        userSelect: 'none',
    };

    const handleMouseDown = () => {
        if (!buttonRef.current || !buttonContentRef.current || !buttonIconRef.current) return;
        buttonRef.current.style.boxShadow = 'none';
        buttonContentRef.current.style.boxShadow = 'none';
        buttonIconRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    };

    const handleMouseUp = () => {
        if (!buttonRef.current || !buttonContentRef.current || !buttonIconRef.current) return;
        buttonRef.current.style.boxShadow = '-6px -20px 35px #ffffff, -6px -10px 15px #ffffff, -20px 0px 30px #ffffff, 6px 20px 25px rgba(0, 0, 0, 0.2)';
        buttonContentRef.current.style.boxShadow = 'inset 0px -8px 0px #dddddd, 0px -8px 0px #f4f5f6';
        buttonIconRef.current.style.transform = 'translate3d(0px, -4px, 1000px)';
    };

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (onClick) onClick(event);
    };

    return (
        <button
            ref={buttonRef}
            className="button"
            draggable={false}
            style={buttonStyle}
            title={tooltipText}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseOut={handleMouseUp}
            onClick={handleClick}
        >
            <div ref={buttonContentRef} className="button__content" style={buttonContentStyle}>
                <div ref={buttonIconRef} className="button__icon" style={buttonIconStyle}>
                    <img draggable={false} src={HaloButtonBase64} alt="DeroHalo Button Icon" style={imgStyle} />
                </div>
            </div>
        </button>
    );
};

export default HaloButtonPreview;
