



export default class Errors {

    public static readonly LackOfStatementParametersMsg = 'Creating a simple statement requires following parameters: "Left Operand", "Comparison Operator", "Right Operand".';
    public static readonly InvalidLogicalOperatorMsg = 'Invalid logical operator.';
    public static readonly InvalidComparisonOperatorMsg = 'Invalid comparison operator.';
    public static readonly OperandTypesUseBeforeInitializeMsg = 'Can not use operand types before initializing.';
    public static readonly JoinAndWhereClausesMustBeClosed = 'Join and Where clauses need to be closed with .endJoin(), .endWhere() methods.';
    public static readonly CollectionNameAlreadyInitialized = 'Collection name already initialized.';
    public static readonly InvalidONuse = 'Can not use ON without one of JOINs.';


    public static throwError(msg: string): never {
        throw new Error(msg);
    }

    public static throwLackOfStatementParameters(): never {
        Errors.throwError(Errors.LackOfStatementParametersMsg);
    }

    public static throwInvalidLogicalOperator(operatorRecieved: string): never {
        Errors.throwError(`${Errors.InvalidLogicalOperatorMsg} Recieved ${operatorRecieved}`);
    }

    public static throwInvalidComparisonOperator(operatorRecieved: string): never {
        Errors.throwError(`${Errors.InvalidComparisonOperatorMsg} Recieved ${operatorRecieved}`);
    }

    public static throwOperandTypesUseBeforeInitialize(): never {
        Errors.throwError(Errors.OperandTypesUseBeforeInitializeMsg);
    }

    public static throwJoinAndWhereClausesMustBeClosed(): never {
        Errors.throwError(Errors.JoinAndWhereClausesMustBeClosed);
    }

    public static throwCollectionNameAlreadyInitialized(): never {
        Errors.throwError(Errors.CollectionNameAlreadyInitialized);
    }

    public static throwInvalidONuse(): never {
        Errors.throwError(Errors.InvalidONuse);
    }
}