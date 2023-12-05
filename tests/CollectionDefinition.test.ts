import Errors from '../src/Errors';
import SqlSimpleStatement from '../src/SqlSimpleStatement';
import QueryBuilder from '../src/QueryBuilder';
import CollectionDefinition from '../src/CollectionDefinition';

describe('LCollection Definition unit tests', () => {

    const collDef = new CollectionDefinition('order_products', ['id', 'price', 'name']);

    //create two tables -> should be different unique ids
    // getName === getName
    // fieldsList
    // field -> return type, entries for every field
    it('.', () => {

    });

});