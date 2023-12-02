

export default class DbField {
    private _name: string;

    constructor (name: string) {
        this._name = name;
    }

    public get name (): string {
        return this._name;
    }

    public get SUM(): string {
        return this.operate('SUM');
    }

    public get AVG(): string {
        return this.operate('AVG');
    }

    private operate(operator: string): string {
        return `${operator}(${this._name}) AS ${this._name}_${operator}`;
    }
}


