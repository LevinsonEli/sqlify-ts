
import Errors from '../src/Errors';
import SqlSimpleStatement from '../src/SqlSimpleStatement';
import QueryBuilder from '../src/QueryBuilder';

describe('Query Builder unit tests', () => {

    const sqlBuilder = new QueryBuilder();

    it('Creates basic statement.', () => {
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price'])
            .where('1', '=', '1')
            .endWhere();
        const expectedQuery = `SELECT p.id, p.name, p.price\nFROM products AS p\nWHERE 1 = 1`;

        expect(sqlBuilder.getQuery()).toBe(expectedQuery);
    });

    it('Cleans query and values on .clean() call.', () => {
        sqlBuilder.clean();

        expect(sqlBuilder.getQuery()).toBe('');
        expect(sqlBuilder.getValues()).toStrictEqual([]);
    });

    it('Enables to create nested statements in WHERE clause.', () => {
        sqlBuilder.clean();
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price'])
            .where(new SqlSimpleStatement('p.id', '%', '2'), '=', '0')
            .endWhere();
        const expectedQuery = `SELECT p.id, p.name, p.price\nFROM products AS p\nWHERE p.id % 2 = 0`;

        expect(sqlBuilder.getQuery()).toBe(expectedQuery);
    });

    it('Throws an error if WHERE clause was not closed.', () => {
        sqlBuilder.clean();
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price'])
            .where('1', '=', '1');

        expect(() => sqlBuilder.getQuery()).toThrow(Errors.JoinAndWhereClausesMustBeClosed);
    });

    it('Throws an error if JOIN clause was not closed.', () => {
        sqlBuilder.clean();
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price'])
            .join('order_products AS op')
            .on('op.product_id', '=', 'p.id');

        expect(() => sqlBuilder.getQuery()).toThrow(Errors.JoinAndWhereClausesMustBeClosed);
    });

    it('Throws an error if ON clause was used without one of JOINs.', () => {
        sqlBuilder.clean();
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price']);

        expect(() => sqlBuilder.on('op.product_id', '=', 'p.id')).toThrow(Errors.InvalidONuse);
    });

    it('Creates list of values for statement with arguments.', () => {
        sqlBuilder.clean();
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price'])
            .where('p.id', '=', 1, QueryBuilder.TYPES.INT)
            .and('p.price', '=', 15.99, QueryBuilder.TYPES.INT)
            .endWhere();
        const expectedQuery = `SELECT p.id, p.name, p.price\nFROM products AS p\nWHERE p.id = $1 AND p.price = $2`;
        const expectedValues = [1, 15.99];

        expect(sqlBuilder.getQuery()).toBe(expectedQuery);
        expect(sqlBuilder.getValues()).toStrictEqual(expectedValues);
    });

    it('Creates list of values for nested statements with arguments.', () => {
        sqlBuilder.clean();
        sqlBuilder.from('products AS p')
            .selectFields(['p.id', 'p.name', 'p.price'])
            .where(
                new SqlSimpleStatement('p.id', '%', 2, QueryBuilder.TYPES.INT), 
                '=', 0, QueryBuilder.TYPES.INT)
            .endWhere();
        const expectedQuery = `SELECT p.id, p.name, p.price\nFROM products AS p\nWHERE p.id % $1 = $2`;
        const expectedValues = [2, 0];

        expect(sqlBuilder.getQuery()).toBe(expectedQuery);
        expect(sqlBuilder.getValues()).toStrictEqual(expectedValues);
    });
});