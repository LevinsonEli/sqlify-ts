import DbField from "./DbField";



export default class CollectionDefinition {
    private static counter = 0;
    private _collectionName: string;
    private _collectionNameId: number;
    private _fields: { [key: string]: DbField };
    private _fieldsList: Array<string>;

    constructor(collectionName: string, fieldsList: Array<string>) {
        this._collectionName = collectionName;
        this._fields = fieldsList.reduce((accum, cur) => {
            accum[cur] = new DbField(cur);
            return accum;
        }, {} as { [key: string]: DbField });
        this._fieldsList = fieldsList.slice(0);
        this._collectionNameId = ++CollectionDefinition.counter;
    }

    public get name(): string {
        return `${this._collectionName} AS ${this.getShortName}`;
    }

    public get field(): { [key: string]: DbField } {
        return this._fields;
    }

    public get fieldsList(): Array<string> {
        return this._fieldsList.map(field => `${this.getShortName()}.${field}`);
    }

    private getShortName(): string {

        let result = '';
        for (let i = 0; i < this._collectionName.length - 1; i++)
            if (this._collectionName[i] === '_')
                result += this._collectionName[i + 1];
        result += this._collectionNameId;

        return result.toLowerCase();
    }

}