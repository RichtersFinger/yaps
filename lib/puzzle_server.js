class puzzle {
	constructor(someID, layout0, puzzledimensions0, seed0, style0, motive0, puzzlepiece) {
		// internal identifier for session associated with this puzzle
		this.sessionID = someID;

		// puzzle resolution in x and y
		this.layout = layout0;
		// seed for the random generation of the tiling
		this.seed = seed0;
		// unsed for now, object that contains info on puzzle style
		this.style = style0;

		// motive image
		this.motive = motive0;
		this.dimensions = puzzledimensions0;

		this.pieces = [];
		for (var i = 0; i < this.layout[0]; i++) {
			this.pieces[i] = [];
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j] = new puzzlepiece(this, i, j);
			}
		}
		// setup neighbor references, left bottom right top (in pieces' coodinates); // value 'undefined' if no neighbor in given direction
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				if (i === 0) {
					this.pieces[i][j].neighbors = [undefined, this.pieces[i][j+1], this.pieces[i+1][j], this.pieces[i][j-1]];
				} else if (i === this.layout[0] - 1) {
					this.pieces[i][j].neighbors = [this.pieces[i-1][j], this.pieces[i][j+1], undefined, this.pieces[i][j-1]];
				} else {
					this.pieces[i][j].neighbors = [this.pieces[i-1][j], this.pieces[i][j+1], this.pieces[i+1][j], this.pieces[i][j-1]];
				}
			}
		}

		// contains sets of already connected pieces
		this.partitions = [];

		this.make_puzzlepiece_tiling();
	}
	make_puzzlepiece_tiling() {
		// this sets up the tiling of pieces; for now: only position of top left corner in game/puzzle coordinates
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].w = this.dimensions[0]/this.layout[0];
				this.pieces[i][j].h = this.dimensions[1]/this.layout[1];
				this.pieces[i][j].x = i/this.layout[0]*this.dimensions[0];
				this.pieces[i][j].y = j/this.layout[1]*this.dimensions[1];
			}
		}
	}
	distribute_pieces(distribution_mode) {
		switch(distribution_mode) {
		case 'completed':
			for (var i = 0; i < this.layout[0]; i++) {
				for (var j = 0; j < this.layout[1]; j++) {
					this.pieces[i][j].x = i/this.layout[0]*this.dimensions[0];
					this.pieces[i][j].y = j/this.layout[1]*this.dimensions[1];
				}
			}
			break;
		case 'randomized_position':

			break;
		case 'randomized_positionandangle':

			break;
		default:
			console.log('Unknown distribution_mode passed to distribute_pieces: ' + distribution_mode);
		}
	}
}
module.exports = puzzle;
