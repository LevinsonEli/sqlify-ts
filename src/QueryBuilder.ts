

import { LogicalStatementManager } from "logical-stmt-manager";
import SqlSimpleStatement from "./SqlSimpleStatement";
import Errors from "./Errors";


export default class QueryBuilder {
    private _collectionName: string;
    private _createCollectionName?: string;
    private _createCollectionColumns?: Array<string>;
    private _selectFields: Array<string>;
    private _whereStatement: string;
    private _offsetStatement: string;
    private _limitStatement: string;
    private _orderByStatement: string;
    private _curStatement: string;
    private _lastClause: string;
    private _values: Array<number | string | Array<number> | Array<string>>;

    public _stmtManager: LogicalStatementManager<SqlSimpleStatement>;

    public _joinsList: Array<string>;

    private _parentQueryBuilder?: QueryBuilder;

    private _generalQuery?: string;

    public static readonly TYPES = {
        INT: 'INT',
        DECIMAL: 'DECIMAL',
        STRING: 'STRING',
        INT_ARRAY: 'INTEGER[]',
        DECIMAL_ARRAY: 'DECIMAL[]',
        STRING_ARRAY: 'STRING[]',
    }

    public static readonly OPERATOR = {
        OR: 'OR',
        AND: 'AND',
    }

    public static readonly LOGIC_OPERATOR = {
        IS_EQUAL: '=',
        IS_NOT_EQUAL: '!=',
    }

    public static readonly CLAUSE = {
        WHERE: 'WHERE',
        CLOSED: 'CLOSED',
        JOIN: {
            DEFAULT: 'JOIN',
            LEFT: 'LEFT JOIN',
            RIGHT: 'RIGHT JOIN',
            OUTER: 'OUTER JOIN',
            INNER: 'INNER JOIN',
        },
        CREATE: 'CREATE',
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
    }

    constructor(config?: { parentQueryBuilder?: QueryBuilder }) {
        this._values = [];
        this._collectionName = '';
        this._selectFields = [];
        this._whereStatement = '';
        this._offsetStatement = '';
        this._limitStatement = '';
        this._orderByStatement = '';
        this._curStatement = '';
        this._lastClause = '';
        this._joinsList = [];

        this._stmtManager = new LogicalStatementManager();
        this._joinsList = [];


        this._parentQueryBuilder = config?.parentQueryBuilder;
    }

    public from(collectionName: string): QueryBuilder {
        this._collectionName = collectionName;
        return this;
    }

    public selectFields(fields: Array<string>): QueryBuilder {
        this._selectFields = fields.slice(0);
        return this;
    }

    private newStmt(
        leftOperand: string | SqlSimpleStatement | QueryBuilder,
        operator?: string,
        rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement,
        rightOperandType?: string
    ): QueryBuilder {

        if (leftOperand instanceof QueryBuilder) {
            this._stmtManager.newStmt(this._stmtManager);
        }
        else {
            this.checkParametersForSqlStmt(operator, rightOperand);
            this._stmtManager.newStmt(new SqlSimpleStatement(
                leftOperand, operator!, rightOperand!, rightOperandType
            ));
        }

        return this;
    }

    public where(
        leftOperand: string | SqlSimpleStatement | QueryBuilder,
        operator?: string,
        rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement | QueryBuilder,
        rightOperandType?: string
    ): QueryBuilder {
        this._lastClause = QueryBuilder.CLAUSE.WHERE;
        if (rightOperand instanceof QueryBuilder) {
            const subQueryAsString = `(\n\t${rightOperand.getQuery().replace(/\n/g, '\n\t')}\n)`;
            return this.newStmt(leftOperand, operator, subQueryAsString, rightOperandType);
        }
        return this.newStmt(leftOperand, operator, rightOperand, rightOperandType);
    }

    public and(
        leftOperand: string | SqlSimpleStatement | QueryBuilder,
        operator?: string,
        rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement | QueryBuilder,
        rightOperandType?: string
    ): QueryBuilder {

        if (leftOperand instanceof QueryBuilder) {
            this._stmtManager.and(this._stmtManager);
        }
        else {
            if (rightOperand instanceof QueryBuilder) {
            const subQueryAsString = `(\n\t${rightOperand.getQuery().replace(/\n/g, '\n\t')}\n)`;
                return this.and(leftOperand, operator, subQueryAsString, rightOperandType);
            }
            this.checkParametersForSqlStmt(operator, rightOperand);
            this._stmtManager.and(new SqlSimpleStatement(
                leftOperand, operator!, rightOperand!, rightOperandType
            ));
        }

        return this;
    }

    public join(collectionName: string): QueryBuilder {

        this.checkLastClauseWasClosed();
        this._joinsList.push(`${QueryBuilder.CLAUSE.JOIN.DEFAULT} ${collectionName} ON `);
        this._lastClause = QueryBuilder.CLAUSE.JOIN.DEFAULT;

        return this;
    }

    public on(
        leftOperand: string | SqlSimpleStatement | QueryBuilder,
        operator?: string,
        rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement,
        rightOperandType?: string
    ): QueryBuilder {
        if (Object.values(QueryBuilder.CLAUSE.JOIN).indexOf(this._lastClause) === -1)
            Errors.throwInvalidONuse();
        return this.newStmt(leftOperand, operator, rightOperand, rightOperandType);
    }

    public endJoin(): QueryBuilder {
        return this.endStmt();
    }

    public endWhere(): QueryBuilder {
        return this.endStmt();
    }

    public endStmt(): QueryBuilder {
        if (Object.values(QueryBuilder.CLAUSE.JOIN).indexOf(this._lastClause) !== -1) {
            this._joinsList[this._joinsList.length - 1] += this.attachStmtToClause();
        } else if (this._lastClause === QueryBuilder.CLAUSE.WHERE) {
            this._whereStatement += this.attachStmtToClause();
        }
        this._lastClause = QueryBuilder.CLAUSE.CLOSED;
        return this;
    }

    private attachStmtToClause(): string {

        const result = this._stmtManager.statementsStack.reduce((accum, cur) => {
            if (cur instanceof SqlSimpleStatement) {
                accum += this.getStmtAsStringAndAddValues(cur);
            } else if (cur === LogicalStatementManager.BRACKETS.OPEN || cur === LogicalStatementManager.BRACKETS.CLOSE) {
                accum += cur;
            } else if (Object.values(LogicalStatementManager.LOGICAL_OPERATORS).indexOf(cur as string) !== -1) {
                accum += ` ${cur} `;
            }
            return accum;
        }, '') as string;
        this._stmtManager.clean();

        return result;
    }

    private getStmtAsStringAndAddValues(sqlSimpletStmt: SqlSimpleStatement): string {

        let result = '';
        if (sqlSimpletStmt.leftOperand instanceof SqlSimpleStatement)
            result += `${this.getStmtAsStringAndAddValues(sqlSimpletStmt.leftOperand)}`;
        else
            result += `${sqlSimpletStmt.leftOperand}`;

        result += ` ${sqlSimpletStmt.operator} `;
        if (sqlSimpletStmt.rightOperand instanceof SqlSimpleStatement) {
            result += `${this.getStmtAsStringAndAddValues(sqlSimpletStmt.rightOperand)}`;
        } else {
            if (sqlSimpletStmt.rightOperandType) {
                const newValueNum = this.addValue(sqlSimpletStmt.rightOperand);
                switch (sqlSimpletStmt.rightOperandType) {
                    case QueryBuilder.TYPES.STRING_ARRAY:
                    case QueryBuilder.TYPES.DECIMAL_ARRAY:
                    case QueryBuilder.TYPES.INT_ARRAY: result += `($${newValueNum}::${QueryBuilder.TYPES.INT_ARRAY})`; break;
                    default: result += `$${newValueNum}`; break;
                }
            } else {
                result += `${sqlSimpletStmt.rightOperand}`;
            }
        }

        return result;
    }

    private checkLastClauseWasClosed(): void {
        if (this._lastClause === QueryBuilder.CLAUSE.CLOSED)
            return;
        if (this._lastClause !== '' && this._stmtManager.statementsStack.length !== 0)
            Errors.throwJoinAndWhereClausesMustBeClosed();
    }

    private checkParametersForSqlStmt(operator?: string, rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement): void {
        if (operator === undefined || rightOperand === undefined)
            Errors.throwLackOfStatementParameters()
    }

    public offset(offsetNum: number): QueryBuilder {
        this._offsetStatement = `OFFSET ${offsetNum}`;
        return this;
    }

    public limit(limitNum: number): QueryBuilder {
        this._limitStatement = `LIMIT ${limitNum}`;
        return this;
    }

    public orderBy(fields: Array<string>): QueryBuilder {
        this._orderByStatement = `ORDER BY ${fields.join(', ')}`;
        return this;
    }

    public createTable(tableName: string): QueryBuilder {
        this._createCollectionName = tableName;
        return this;
    }

    public addColumn(name: string, type: string, constraintsString: string): QueryBuilder {
        if (!this._createCollectionColumns)
            this._createCollectionColumns = [];
        this._createCollectionColumns.push(`${name} ${type} ${constraintsString}`);
        return this;
    }

    public insert(collectionName: string, data: { [key: string] : number | string }): QueryBuilder {
        this._lastClause = QueryBuilder.CLAUSE.INSERT;
        this._generalQuery = `INSERT INTO ${collectionName} (${Object.keys(data)}) VALUES (${Object.values(data)})`;
        return this;
    }

    public update(collectionName: string): QueryBuilder {
        this._lastClause = QueryBuilder.CLAUSE.UPDATE;
        this._generalQuery = `UPDATE ${collectionName}`;
        return this;
    }

    public set(data: { [key: string] : number | string }): QueryBuilder {
        this._generalQuery = `\nSET `;
        for (const property in data) {
            const newValNum = this.addValue(data[property]);
            this._generalQuery += `${property} = ${newValNum},\n`;
        }
        this._generalQuery = this._generalQuery.slice(0, -2);
        return this;
    }

    public deleteFrom(collectionName: string): QueryBuilder {
        this._lastClause = QueryBuilder.CLAUSE.DELETE;
        this._generalQuery = `DELETE FROM ${collectionName}`;
        return this;
    }

    public getQuery(): string {
        this.checkLastClauseWasClosed();

        if (this._lastClause === QueryBuilder.CLAUSE.INSERT)
            return this._generalQuery!;
        if (this._lastClause === QueryBuilder.CLAUSE.UPDATE) {
            return `${this._generalQuery!}\nWHERE ${this._whereStatement}`;
        }
        if (this._lastClause === QueryBuilder.CLAUSE.DELETE) {
            return `${this._generalQuery!}\nWHERE ${this._whereStatement}`;
        }

        let query = '';
        query += this._selectFields.length !== 0 ? (`SELECT ${this._selectFields.join(', ')}`) : '*';
        query += this._collectionName ? (`\nFROM ${this._collectionName}`) : '';
        query += this._joinsList.length !== 0 ? (`\n${this._joinsList.join('\n')}`) : '';
        query += this._whereStatement ? (`\nWHERE ${this._whereStatement}`) : '';
        query += this._orderByStatement ? (`\n${this._orderByStatement}`) : '';
        query += this._limitStatement ? (`\n${this._limitStatement}`) : '';
        query += this._offsetStatement ? (`\n${this._offsetStatement}`) : '';

        return query;
    }

    public clean(): void {
        this._values = [];
        this._collectionName = '';
        this._selectFields = [];
        this._whereStatement = '';
        this._offsetStatement = '';
        this._limitStatement = '';
        this._orderByStatement = '';
        this._curStatement = '';
        this._lastClause = '';
        this._joinsList = [];
        this._stmtManager.clean();
    }

    public getValues(): Array<number | string | Array<number> | Array<string>> {
        return this._values;
    }

    public addValue(value: number | string | Array<number> | Array<string>): number {
        if (this._parentQueryBuilder !== undefined) {
            return this._parentQueryBuilder.addValue(value);
        }
        return this._values.push(value);
    }
}
