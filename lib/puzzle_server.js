const acceptablePlacementDistanceForConnection = 0.04;
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

		// counter for puzzle progress
		this.connectededges = 0;
		this.totaledges = 2*this.layout[0]*this.layout[1] - this.layout[0] - this.layout[1];

		// motive image
		this.motive = motive0;
		this.dimensions = puzzledimensions0;

		this.maximumz = this.layout[0]*this.layout[1];
		this.pieces = [];
		for (var i = 0; i < this.layout[0]; i++) {
			this.pieces[i] = [];
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j] = new puzzlepiece(this, i, j);
				this.pieces[i][j].id = i + j*this.layout[0];
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
				// initialize connections (true if neighbor undefined)
				for (var k = 0; k < 4; k++) {
					this.pieces[i][j].connections[k] = typeof(this.pieces[i][j].neighbors[k]) === 'undefined';
				}
			}
		}

		// contains partition objects of already connected pieces; a partition object contains two lists: a list of pieces in the partition ("pieces") and a list of unconnected edges ("edges")
		this.partitions = {};
		// make initial partitions
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].partition = {"id": this.pieces[i][j].id, "pieces": [this.pieces[i][j]], "edges": []};
				// only add existing edges to partition object
				for (var k = 0; k < 4; k++) {
					if (typeof(this.pieces[i][j].neighbors[k]) !== 'undefined') {
						this.pieces[i][j].partition.edges.push([this.pieces[i][j], this.pieces[i][j].neighbors[k]]);
					}
				}
				this.partitions[this.pieces[i][j].partition.id] = this.pieces[i][j].partition;
			}
		}

		this.make_puzzlepiece_tiling();
	}
	// this sets up the tiling of pieces; for now: only position of top left corner in game/puzzle coordinates
	make_puzzlepiece_tiling() {
		switch(this.style.edges) {
			case "flat":
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].w = this.dimensions[0]/this.layout[0];
						this.pieces[i][j].h = this.dimensions[1]/this.layout[1];
						this.pieces[i][j].x = i/this.layout[0]*this.dimensions[0];
						this.pieces[i][j].y = j/this.layout[1]*this.dimensions[1];
						this.pieces[i][j].z = i + j*this.layout[0];
					}
				}
				break;
			case "regular":
				console.log("regular puzzle edge style not implemented yet.")
				break;
			default:
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].w = this.dimensions[0]/this.layout[0];
						this.pieces[i][j].h = this.dimensions[1]/this.layout[1];
						this.pieces[i][j].x = i/this.layout[0]*this.dimensions[0];
						this.pieces[i][j].y = j/this.layout[1]*this.dimensions[1];
						this.pieces[i][j].z = i + this.layout[0]*j;
					}
				}
		}
		// save positions of pieces within puzzle
		// x-direction
		for (var j = 0; j < this.layout[1]; j++) {
			var x00 = 0;
			for (var i = 0; i < this.layout[0]; i++) {
				this.pieces[i][j].x0 = x00;
				x00 += this.pieces[i][j].w;
			}
		}
		// y-direction
		for (var i = 0; i < this.layout[0]; i++) {
			var y00 = 0;
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].y0 = y00;
				y00 += this.pieces[i][j].h;
			}
		}
	}
	// make initial placement of puzzle pieces
	distribute_pieces(distribution_mode, somerng) {
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
			for (var i = 0; i < this.layout[0]; i++) {
				for (var j = 0; j < this.layout[1]; j++) {
					this.pieces[i][j].x = somerng.get()*this.dimensions[0];
					this.pieces[i][j].y = somerng.get()*this.dimensions[1];
				}
			}
			break;
		case 'randomized_positionandangle':

			break;
		default:
			console.log('Unknown distribution_mode passed to distribute_pieces: ' + distribution_mode);
		}
	}
	checkNewConnections(somepiece) {
		var anythingnew = false;
		// loop over neighbors
		for (var k = 0; k < 4; k++) {
			// connections are set up such that only if a piece in the respective direction exists, the entry can be false
			if (!somepiece.connections[k]) {
				// connect only pieces that are lying down
				if (typeof(somepiece.connections[k].heldby) === 'undefined') {
					// relative distance
					var d;
					// decide what the correct position would be
					switch(k) {
					case 0:
						d = [-somepiece.neighbors[k].w, 0];
						break;
					case 1:
						d = [0, somepiece.h];
						break;
					case 2:
						d = [somepiece.w, 0];
						break;
					case 3:
						d = [0, -somepiece.neighbors[k].h];
						break;
					}
					// check if placement correct
					if (Math.abs(somepiece.angle - somepiece.neighbors[k].angle) < 0.01) { // same orientation needed
						if (Math.abs(somepiece.x + d[0] - somepiece.neighbors[k].x) < acceptablePlacementDistanceForConnection
						    && Math.abs(somepiece.y + d[1] - somepiece.neighbors[k].y) < acceptablePlacementDistanceForConnection) {
							// fail-safe (should not happen..)
							//if (somepiece.partition.id !== somepiece.neighbors[k].partition.id) {
								// reposition held piece + partition to fit with neighbors partition
								for (const piece of somepiece.partition.pieces) {
									piece.x = somepiece.neighbors[k].x + (piece.x0 - somepiece.neighbors[k].x0);
									piece.y = somepiece.neighbors[k].y + (piece.y0 - somepiece.neighbors[k].y0);
								}

								// merge partitions
								this.mergepartitions(somepiece.partition, somepiece.neighbors[k].partition);

								anythingnew = true;
								// for debugging
								// console.log('merged the tiles: ', somepiece.i, somepiece.j, 'and', somepiece.neighbors[k].i, somepiece.neighbors[k].j);
								// console.log('new partition:', somepiece.partition);
							//}
						}
					}
				}
			}
		}
		return anythingnew;
	}
	mergepartitions(partition1, partition2) {
		// delete old partitions
		delete this.partitions[partition1.id];
		delete this.partitions[partition2.id];
		// create and link new (merged) partition
		var newpartition = {"id": partition1.id, "pieces": partition1.pieces.concat(partition2.pieces), "edges": []};
		this.partitions[newpartition.id] = newpartition;
		for (const piece of partition1.pieces) {
			piece.partition = newpartition;
		}
		for (const piece of partition2.pieces) {
			piece.partition = newpartition;
		}

		// check list of edges
		// keep only those that are not fully inside newpartition and update puzzlepiece neighbor-connection tracker
		var newedges = [];
		for (const edge of partition1.edges) {
			if (edge[0].partition.id !== newpartition.id || edge[1].partition.id !== newpartition.id) {
				newpartition.edges.push(edge);
			} else {
				this.makeconnection(edge[0], edge[1]);
			}
		}
		for (const edge of partition2.edges) {
			if (edge[0].partition.id !== newpartition.id || edge[1].partition.id !== newpartition.id) {
				newpartition.edges.push(edge);
			}
			// not required as edges inside partition already appeared in first loop
			// else {
			//	this.makeconnection(edge[0], edge[1]);
			//}
		}
	}
	makeconnection(piece1, piece2) {
		// find correct connection-array index (left bottom right top) via relative 2d-index in puzzle
		var direction_index12;
		if (piece2.i === piece1.i) { // same column
			direction_index12 = ((4 + piece2.j - piece1.j) % 4);
		} else { // by construction same row, i.e. piece2.j === piece1.j
			direction_index12 = (1 + piece2.i - piece1.i);
		}
		var direction_index21 = (direction_index12 + 2) % 4;
		// count new connection to puzzle progress
		if (!piece1.connections[direction_index12]) this.connectededges++;
		piece1.connections[direction_index12] = true;
		piece2.connections[direction_index21] = true;
	}
}
module.exports = puzzle;
