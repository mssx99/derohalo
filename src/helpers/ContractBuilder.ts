class ContractBuilder {
    description: string | undefined;
    methods: ContractMethod[] = [];
    constructor() {
        this.methods = [];
        this.addMethod('InitializePrivate', true);
    }

    addDescription(description: string) {
        this.description = description;
    }

    addLineToInitializer(command: string, lineNumber?: number) {
        return this.methods[0].addLine(command, lineNumber);
    }

    addMethod(name: string, isPublic: boolean = false, parameters: IContractParameter[] = [], returnType: ContractReturnType = 'Uint64') {
        if (isPublic) {
            name = this.makeFirstLetterUpperCase(name);
        } else {
            name = this.makeFirstLetterLowerCase(name);
        }
        const method = new ContractMethod(name, parameters, returnType);
        this.methods.push(method);
        return method;
    }

    makeFirstLetterUpperCase(str: string) {
        if (str.charAt(0) !== str.charAt(0).toUpperCase()) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        return str;
    }

    makeFirstLetterLowerCase(str: string) {
        if (str.charAt(0) !== str.charAt(0).toLowerCase()) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        }
        return str;
    }

    build() {
        const lines: string[] = [];

        if (this.description) {
            lines.push(this.description);
            lines.push('');
        }

        this.methods.forEach((method) => {
            lines.push.apply(lines, method.toStringLineArray());
        });

        return lines.join('\n');
    }
}

interface INewLineString {
    command: string;
    prependNewLine?: boolean;
    appendNewLine?: boolean;
}

export class ContractMethod {
    name: string;
    parameters: IContractParameter[];
    returnType: ContractReturnType;
    lastLineNumber: number = 0;
    lines: { [key: string]: string | INewLineString } = {};

    constructor(name: string, parameters: IContractParameter[], returnType: ContractReturnType) {
        this.name = name;
        this.parameters = parameters;
        this.returnType = returnType;
    }

    setLastLine(lineNumber: number) {
        this.lastLineNumber = lineNumber;
    }

    addLine(command: string | INewLineString, lineNumber?: number) {
        if (!lineNumber) {
            lineNumber = this.getNextAvailableLine();
        }

        this.lines[lineNumber.toString()] = command;
        this.lastLineNumber = lineNumber;
    }

    addLinePrependNewLine(command: string, lineNumber?: number) {
        this.addLine({ command, prependNewLine: true }, lineNumber);
    }

    addLineAppendNewLine(command: string, lineNumber?: number) {
        this.addLine({ command, appendNewLine: true }, lineNumber);
    }

    getNextAvailableLine() {
        let newLineNumber = this.lastLineNumber + 1;
        while (this.lines[newLineNumber.toString()] !== undefined) {
            newLineNumber++;
        }
        return newLineNumber;
    }

    jumpLine() {
        return this.jumpLines();
    }

    jumpLines(numberOfLines: number = 1) {
        return this.lastLineNumber + numberOfLines + 2;
    }

    getParameterString() {
        let outputString = this.parameters.map((p) => `${p.name} ${p.type}`).join(',');
        return outputString;
    }

    toStringLineArray() {
        const outputLines: string[] = [];
        outputLines.push(`Function ${this.name}(${this.getParameterString()}) ${this.returnType}`);

        for (let lineNumber in this.lines) {
            const command = this.lines[lineNumber];
            if (typeof command === 'object') {
                if (command.prependNewLine) outputLines.push('');
                outputLines.push(`${lineNumber} ${command.command}`);
                if (command.appendNewLine) outputLines.push('');
            } else {
                outputLines.push(`${lineNumber} ${command}`);
            }
        }

        outputLines.push(`End Function\n`);
        return outputLines;
    }
}

export interface IContractParameter {
    name: string;
    type: ContractReturnType;
}

type ContractReturnType = 'Uint64' | 'String';

export default ContractBuilder;
