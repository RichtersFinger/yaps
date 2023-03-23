/* Copyright (c) 2023 Steffen Richters-Finger */
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
		// position in completed puzzle with relation to the top left|bottom left|bottom right|top right corner (in piece's coordinates)
		this.x0 = [];
		this.y0 = [];
		// layering of puzzle pieces
		this.z = 0;

		// dimensions in game (used to detect whether tiles are to be connected during game)
		this.w = 0;
		this.h = 0;

		// current angle; can take values 0..3 for angles 0, 90, 180, 270 deg clockwise
		this.angle = 0;

		// paths along which the piece is cut, left bottom right top
		this.edges = [];

		// references to neighbors, left bottom right top (in pieces' coodinates); // value 'undefined' if no neighbor in some direction
		this.neighbors = [];

		// boolean values for whether piece is connected to respective neighbor, left bottom right top (in pieces' coodinates)
		this.connections = [false, false, false, false];

		// reference to the partition object for this piece; a partition object contains two lists: a list of pieces in the partition ("pieces") and a list of unconnected edges ("edges")
		this.partition;

		// variable to track player currently holding this tile
		this.heldby = undefined;
	}
	// update all pieces in partition
	update_partition() {
		var cosangle = Math.cos(this.angle*Math.PI/2);
		var sinangle = Math.sin(this.angle*Math.PI/2);
		for (const piece of this.partition.pieces) {
			// get coordinates
			var deltax = (piece.x0[this.angle] - this.x0[this.angle]) * cosangle
									 - (piece.y0[this.angle] - this.y0[this.angle]) * sinangle;
			var deltay = (piece.x0[this.angle] - this.x0[this.angle]) * sinangle
									 + (piece.y0[this.angle] - this.y0[this.angle]) * cosangle;
			piece.x = this.x + deltax;
			piece.y = this.y + deltay;
		}
	}
}
module.exports = puzzlepiece;
