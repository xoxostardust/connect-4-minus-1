export class ColumnIsFullError extends Error {
    constructor(message = '') {
        super(message);
    }
}
