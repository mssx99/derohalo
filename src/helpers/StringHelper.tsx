export const hex_to_ascii = (str1: string) => {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
};

export const changeNewLinesForBackslashN = (str: string) => {
    return str.replace(/\n/g, '\\n');
};
