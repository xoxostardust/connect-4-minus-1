import { Grid, GridPiece } from './grid.js';

const brandNewGrid = new Grid();

const column = brandNewGrid.getColumn(3);

column.placePiece(new GridPiece());
column.placePiece(new GridPiece());
column.placePiece(new GridPiece());
column.placePiece(new GridPiece());

console.log(brandNewGrid.asArray());

column.removePiece(4);

console.log(brandNewGrid.asArray());
