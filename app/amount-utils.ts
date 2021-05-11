import {BigNumber, BigNumberish} from "ethers";

function splitDigitsGroups(text: string, groupSize: number = 3): string[] {
    const ret: string[] = [];

    while(text.length > groupSize) {
        const group = text.substring(text.length - groupSize)
        text = text.substring(0, text.length - groupSize)
        ret.splice(0, 0, group)
    }

    if (text.length > 0) {
        ret.splice(0, 0, text)
    }

    return ret;
}

export function toFixedPointString(amount: BigNumberish, precision: number, reduceZeros: boolean = false): string {
    let integerStr = amount.toString()
    const sign = integerStr[0] === '-';
    if (sign) {
        integerStr = integerStr.substring(1);
    }
    if (integerStr.length < precision + 1) {
        integerStr = integerStr.padStart(precision + 1, '0')
    }

    const integerPart = integerStr.substring(0, integerStr.length - precision);
    let fractionalPart = integerStr.substring(integerStr.length - precision);
    const integerGroups = splitDigitsGroups(integerPart);

    if (reduceZeros) {
        fractionalPart = fractionalPart.replace(redundantZeros, '')
    }

    return `${sign?'-':''}${integerGroups.join(',')}${fractionalPart.length > 0 ? '.' : ''}${fractionalPart}`
}

const redundantZeros = /\.?0*$/;
const fixedPointRegex = /^-?([0-9,]+\.?[0-9]*|[0-9,]*\.?[0-9]+)$/;
export class InvalidFixedPointExpression extends Error {
    constructor() {
        super("invalid fixed-point expression");
    }
}
export class PrecisionOverflow extends Error {
    constructor() {
        super("precision overflow");
    }
}
export function fromFixedPointString(text: string, precision: number): BigNumber {
    if (!fixedPointRegex.test(text)) {
        throw new InvalidFixedPointExpression()
    }
    text = text.replace(',', '')

    const sign = text[0] === '-';
    if (sign) {
        text = text.substring(1);
    }

    const point = text.indexOf('.');
    let integerStr: string, fractionalStr: string;
    if (point === -1) {
        fractionalStr = '';
        integerStr = text
    } else {
        fractionalStr = text.substring(point + 1).replace(redundantZeros, '')
        integerStr = text.substring(0, point)
    }

    if (fractionalStr.length > precision) {
        throw new PrecisionOverflow()
    }
    fractionalStr = fractionalStr.padEnd(precision, '0')

    const integerText = `${sign?'-':''}${integerStr}${fractionalStr}`;
    return BigNumber.from(integerText)
}
