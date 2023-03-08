// This error is thrown if the column of a GridColumn is full (use isFull property to determine whether the column is full or not)
export class ColumnIsFullError extends Error {
    constructor(message = '') {
        super(message);
    }
}
