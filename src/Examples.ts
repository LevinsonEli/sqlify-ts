
import QueryBuilder from "./QueryBuilder";
import CollectionDefinition from "./CollectionDefinition";
import DbField from "./DbField";

const queryBuilder = new QueryBuilder();

const productsCollection = new CollectionDefinition('products', ['id', 'name', 'price']);

queryBuilder.from(productsCollection.name)
    .selectFields([ ...productsCollection.fieldsList, productsCollection.field.price.AVG ])
    .where(productsCollection.field.id.default, '=', 12, 'INT')
    .endWhere();

// .where(productsCollection.field.id.name.isEqual(12, "INT"))
// .where()

console.log(queryBuilder.getQuery());
console.log(queryBuilder.getValues());
