let grid = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0]
];

function setSpace(x, y, z) {
    grid[6 - y][x - 1] = z;
}

setSpace(1, 1, 1);
setSpace(1, 2, 1);
setSpace(1, 3, 1);
setSpace(1, 4, 1);

console.log(grid);
