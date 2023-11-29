

export interface ISqlSimpleStatement {
    leftOperand: string | SqlSimpleStatement;
    operator: string;
    rightOperand: string | number | Array<string> | Array<number> | SqlSimpleStatement;
    rightOperandType?: string;
}


export default class SqlSimpleStatement implements ISqlSimpleStatement {
    private _leftOperand: string | SqlSimpleStatement;
    private _operator: string;
    private _rightOperand: string | number | Array<string> | Array<number> | SqlSimpleStatement;
    private _rightOperandType?: string;

    constructor(
        leftOperand: string | SqlSimpleStatement,
        operator: string,
        rightOperand: string | number | Array<string> | Array<number> | SqlSimpleStatement,
        rightOperandType?: string,
    ) {
        this._leftOperand = leftOperand;
        this._operator = operator;
        this._rightOperand = rightOperand;
        this._rightOperandType = rightOperandType;
    }

    public get leftOperand(): string | SqlSimpleStatement{
        return this._leftOperand;
    }

    public get operator(): string {
        return this._operator;
    }

    public get rightOperand(): string | number | Array<string> | Array<number> | SqlSimpleStatement {
        return this._rightOperand;
    }

    public get rightOperandType(): string | undefined {
        return this._rightOperandType ?? undefined;
    }

    public toString(): string {
        return `${this.leftOperand.toString()} ${this.operator} ${this.rightOperand.toString()}`;
    }
}
