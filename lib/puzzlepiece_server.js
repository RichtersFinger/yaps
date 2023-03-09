class puzzlepiece {
	constructor(parentpuzzle0, i0, j0) {
		// reference to parent puzzle
		this.parentpuzzle = parentpuzzle0;

		// id of puzzle piece within this puzzle (set in puzzle-class)
		this.id;

		// indexed position in puzzle grid
		this.i = i0; // x-direction; left (0) -> right (this.parentpuzzle.layout[0])
		this.j = j0; // y-direction; top (0) -> bottom (this.parentpuzzle.layout[1])
		// actual position in game
		this.x = 0;
		this.y = 0;
		// layering of puzzle pieces
		this.z = 0;

		// dimensions in game (used to detect whether tiles are to be connected during game)
		this.w = 0;
		this.h = 0;

		// current angle
		this.angle = 0;

		// references to neighbors, left bottom right top (in pieces' coodinates); // value 'undefined' if no neighbor in some direction
		this.neighbors = [];

		// boolean values for whether piece is connected to respective neighbor, left bottom right top (in pieces' coodinates)
		this.connections = [false, false, false, false];

		// reference to the partition object for this piece; a partition object contains two lists: a list of pieces in the partition ("pieces") and a list of unconnected edges ("edges")
		this.partition;

		// variable to track player currently holding this tile
		this.heldby = undefined;
	}
}
module.exports = puzzlepiece;
