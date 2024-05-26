export const a11yProps: (index: number) => {} = (index) => {
    return {
        id: `main-tab-${index}`,
        'aria-controls': `main-tabpanel-${index}`,
    };
};

export const debounce = <F extends (...args: any[]) => void>(func: F, waitFor: number): ((...args: Parameters<F>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
};
