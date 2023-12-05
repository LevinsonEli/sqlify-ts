
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




// const subQueryBuilder = new QueryBuilder({ parentQueryBuilder: queryBuilder });
// const subQueryBuilder2 = new QueryBuilder({ parentQueryBuilder: queryBuilder });

// subQueryBuilder2.from('products')
//         .selectFields(['AVG(price)'])
//         .where('price2', '>', 100, 'INT')
//         .endWhere();
// subQueryBuilder.from('products')
//     .selectFields(['AVG(price)'])
//     .where('price', '>', subQueryBuilder2)
//     .and('p.id.11', '=', 11, 'INT')
//     .endWhere();

// queryBuilder.from('products AS p')
//     .selectFields(['p.id', 'p.price'])
//     .where('p.id', '=', 12, 'INT')
//     .and('p.price', '>', subQueryBuilder)
//     .endWhere();

// console.log(queryBuilder.getQuery());
// console.log(queryBuilder.getValues());

/*

const subQueryBuilder = new QueryBuilder({ parentQueryBuilder: queryBuilder });
then if we have parent query builder
we will use the addValue of parent query builder

WHERE
	EXISTS (
		SELECT
			1
		FROM
			payment
		WHERE
			payment.customer_id = customer.customer_id
	);


1:
    addProductsTable.ts
        export default class AddTableMigration extends Migration {
            up: () => {
                // create table
            }
            down: () => {
                // delete table
            }
        }

        SQL MIGRATION TOOL FOR NODE TYPESCRIPT (SMTFNT smtfnt)

commands : 
        migrate -> run all migrations
        migrate 4 -> run to a specific migration number (up or dowm)
        migrate -current
        

*/

