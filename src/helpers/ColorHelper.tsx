import { CHATMESSAGE_COLOR_HIGH, CHATMESSAGE_COLOR_LOW } from 'Constants';

export const getColor = (index: number, total: number = 9): string => {
    index = index % total;
    let hue = ((index * 360) / total) % 360;
    let color: string = 'hsl(' + hue + ', 80%, 70%)'; //100%, 50%
    return color;
};

export const interpolateColor = (number: number): string => {
    const startColor = CHATMESSAGE_COLOR_LOW;
    const endColor = CHATMESSAGE_COLOR_HIGH;

    const r = Math.round(startColor.r + (endColor.r - startColor.r) * number);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * number);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * number);

    const hex =
        '#' +
        [r, g, b]
            .map((x) => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            })
            .join('');

    return hex;
};

export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};

export const getContrastYIQ = (hexcolor: string): string => {
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
};

const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgb(${r}, ${g}, ${b})`;
};

const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.slice(1), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = ((num >> 8) & 0x00ff) + amt,
        G = (num & 0x0000ff) + amt;

    return `#${(0x1000000 + (R < 255 ? R : 255) * 0x10000 + (B < 255 ? B : 255) * 0x100 + (G < 255 ? G : 255)).toString(16).slice(1)}`;
};

export const createGradient = (hexcolor: string): string => {
    const rgbColor = hexToRgb(hexcolor);
    // Lighten the color by x%
    const lighterColor = lightenColor(hexcolor, 30);

    return `linear-gradient(to bottom, ${lighterColor}, ${rgbColor})`;
};
