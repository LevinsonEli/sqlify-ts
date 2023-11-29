

import { LogicalStatementManager } from "logical-stmt-manager";
import SqlSimpleStatement from "./SqlSimpleStatement";
import Errors from "./Errors";


export default class QueryBuilder {
    private _collectionName: string;
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
    }

    constructor() {
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
    }

    public from(collectionName: string): QueryBuilder {
        this._collectionName = collectionName;
        return this;
    }

    public selectFields(fields: Array<string>): QueryBuilder {
        this._selectFields = fields.slice(0);
        return this;
    }

    public newStmt(
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
        rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement,
        rightOperandType?: string
    ): QueryBuilder {
        this._lastClause = QueryBuilder.CLAUSE.WHERE;
        return this.newStmt(leftOperand, operator, rightOperand, rightOperandType);
    }

    public and(
        leftOperand: string | SqlSimpleStatement | QueryBuilder,
        operator?: string,
        rightOperand?: string | number | Array<string> | Array<number> | SqlSimpleStatement,
        rightOperandType?: string
    ): QueryBuilder {

        if (leftOperand instanceof QueryBuilder) {
            this._stmtManager.and(this._stmtManager);
        }
        else {
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


    public getQuery(): string {
        return `SELECT ${this._selectFields} FROM ${this._collectionName} WHERE ${this._curStatement}`;
    }

    public getBeautifulQuery(): string {
        this.checkLastClauseWasClosed();

        let query = '';
        query += this._selectFields.length !== 0 ? ('SELECT ' + this._selectFields.join(', ')) : ''; // if no fields -> *
        query += this._collectionName ? ('\nFROM ' + this._collectionName) : '';
        query += this._joinsList.length !== 0 ? ('\n' + this._joinsList.join('\n')) : '';
        query += this._whereStatement ? ('\nWHERE ' + this._whereStatement) : '';
        query += this._orderByStatement ? ('\n' + this._orderByStatement) : '';
        query += this._limitStatement ? ('\n' + this._limitStatement) : '';
        query += this._offsetStatement ? ('\n' + this._offsetStatement) : '';

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

    private addValue(value: number | string | Array<number> | Array<string>): number {
        return this._values.push(value);
    }
}

