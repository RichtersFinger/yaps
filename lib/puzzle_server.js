const acceptablePlacementDistanceForConnection = 0.03;
class puzzle {
	constructor(someID, layout0, puzzledimensions0, seed0, style0, motif0, puzzlepiece) {
		// internal identifier for session associated with this puzzle
		this.sessionID = someID;

		// puzzle resolution in x and y
		this.layout = layout0;
		// seed for the random generation of the tiling
		this.seed = seed0;
		// unsed for now, object that contains info on puzzle style
		this.style = style0;

		// grid is defined by the intersections of slices along which the puzzle is cut
		/* indices of puzzle slices (m from 0 to nx = layout[0]; n from 0 to ny = layout[1])
		n\m 0   1   2      nx
		0   _________ ..___
		    |   |   |      |
		    |   |   |      |
		1   |---+---+  .. -|
		    |   |   |      |
		    |   |   |      |
		2   |---+---+  .. -|
			  ..  .      .  ..
		    |   .      .   |
			  |              |
		ny	‾‾‾‾   ..   ‾‾‾
		*/
		this.grid;

		// counter for puzzle progress
		this.connectededges = 0;
		this.totaledges = 2*this.layout[0]*this.layout[1] - this.layout[0] - this.layout[1];

		// motif image
		this.motif = motif0;
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
	}
	// this sets up the tiling of pieces
	// somerng is a random number generator
	make_puzzlepiece_tiling(somedifficulty, somerng) {
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
			case "flat_irregular":
				somerng.seed(this.seed);
				// get list of points for corners of puzzle pieces
				switch(somedifficulty) {
					case 3:
						this.grid = this.create_puzzle_grid(0.05, somerng);
						break;
					default:
						this.grid = this.create_puzzle_grid(0.2, somerng);
				}

				// helper function that swaps out the x- and y-coordinates in an array of points
				var transpose_slice = function(somearray) {
					var result = [];
					for (const entry of somearray) {
						result.push([entry[1], entry[0]]);
					}
					return result;
				}

				// helper function that performs the interpolation between two points (given in somearray [[x0, y0], [x1, y1]])
				// for now just linear interpolation
				var interpolate_slice = function(somearray) {
					// how many interpolation points are inserted (actually inserted are n_interpolation-1)
					const n_interpolation = 1;
					var result = [somearray[0]];
					for (var n = 1; n <= n_interpolation; n++) {
						// interpolate x-coordinate
						var p = n/n_interpolation;
						var thisx = (1-p)*somearray[0][0] + p*somearray[1][0];
						var thisy = (1-p)*somearray[0][1] + p*somearray[1][1];

						result.push([thisx, thisy]);
					}
					return result;
				}

				// helper function that reverses the the points in a slice
				var reverse_slice = function(somearray) {
					var result = [];
					for (var n = somearray.length-1; n >= 0; n--) {
						result.push(somearray[n]);
					}
					return result;
				}

				// interpolate smooth curves to use as slices of puzzle
				// slices.x contains indices 0 .. this.layout[0] indexed by segments 0 .. this.layout[1]-1
				// slices.y analogously
				// a slice is the sampled smooth interpolation of the previously calculated grid
				var slices = {'x': [], 'y': []};

				// fill out x-direction
				for (var i = 0; i <= this.layout[0]; i++) {
					slices.x[i] = [];
					for (var j = 0; j < this.layout[1]; j++) {
						slices.x[i][j] = transpose_slice(interpolate_slice(transpose_slice([this.grid[i][j], this.grid[i][j+1]])));
					}
				}
				// fill out y-direction
				for (var i = 0; i < this.layout[0]; i++) {
					slices.y[i] = [];
					for (var j = 0; j <= this.layout[1]; j++) {
						slices.y[i][j] = interpolate_slice([this.grid[i][j], this.grid[i+1][j]]);
					}
				}

				// save parts of slices to edges of puzzle pieces + calculated remaining parameters
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].edges[0] = slices.x[i][j];
						this.pieces[i][j].edges[1] = slices.y[i][j+1];
						this.pieces[i][j].edges[2] = reverse_slice(slices.x[i+1][j]);
						this.pieces[i][j].edges[3] = reverse_slice(slices.y[i][j]);
						// top right - top left
						this.pieces[i][j].w = this.grid[i+1][j][0] - this.grid[i][j][0];
						// bottom left - top left
						this.pieces[i][j].h = this.grid[i][j+1][1] - this.grid[i][j][1];
						// and position
						this.pieces[i][j].x = this.grid[i][j][0];
						this.pieces[i][j].y = this.grid[i][j][1];
						this.pieces[i][j].z = i + this.layout[0]*j;
					}
				}

				break;
			case "regular":
				somerng.seed(this.seed);
				// get list of points for corners of puzzle pieces
				switch(somedifficulty) {
					case 2:
						this.grid = this.create_puzzle_grid(0.05, somerng);
						break;
					case 1:
						this.grid = this.create_puzzle_grid(0.10, somerng);
						break;
					case 0:
						this.grid = this.create_puzzle_grid(0.15, somerng);
						break;
				}

				// helper function that swaps out the x- and y-coordinates in an array of points
				var transpose_slice = function(somearray) {
					var result = [];
					for (const entry of somearray) {
						result.push([entry[1], entry[0]]);
					}
					return result;
				}

				// helper function that performs the interpolation between two points (given in somearray [[x0, y0], [x1, y1]])
				// only linear interpolation
				var interpolate_slice_linear = function(somearray) {
					// how many interpolation points are inserted (actually inserted are n_interpolation-1)
					const n_interpolation = 1;
					var result = [somearray[0]];
					for (var n = 1; n <= n_interpolation; n++) {
						// interpolate x-coordinate
						var p = n/n_interpolation;
						var thisx = (1-p)*somearray[0][0] + p*somearray[1][0];
						var thisy = (1-p)*somearray[0][1] + p*somearray[1][1];

						result.push([thisx, thisy]);
					}
					return result;
				}

				// helper function that performs the interpolation between two points (given in somearray [[x0, y0], [x1, y1]]) including the generation of a knob/hole
				var interpolate_slice_complex = function(somearray, someparameters) {
					// how many interpolation points are inserted (actually inserted are n_interpolation-1)
					const n_interpolation = 100;
					var result = [somearray[0]];
					for (var n = 1; n <= n_interpolation; n++) {
						// helper function definitions
						// linear tangential component of interpolation
						var linear_x = function(p, startx, deltax, someparameters) {
							if (p < someparameters.fractionB) {
								return startx + p*deltax;
							}
							if (p < someparameters.fractionB + someparameters.fractionA) {
								return startx + someparameters.fractionB*deltax;
							}
							return startx + p*deltax - deltax*someparameters.fractionA;
						}
						// linear normal component of interpolation
						var linear_y = function(p, starty, deltay, someparameters) {
							return starty + p*deltay;
						}
						// complex tangential component of interpolation
						var knob_x = function(p, someparameters) {
							if (p < 0) {
								return 0;
							}
							if (p > 1) {
								return 1;
							}
							return p + someparameters.tangential_amplitude * Math.sin(4*Math.PI*p) + someparameters.tangential_irregularity * Math.sin(3*Math.PI*p);
						}
						// complex normal component of interpolation
						var knob_y = function(p, someparameters) {
							if (p < 0) {
								return 0;
							}
							if (p > 1) {
								return 0;
							}
							return someparameters.normal_amplitude * 0.5 *(1 - Math.cos(2*Math.PI*p));
						}

						// interpolate x-coordinate
						var p = n/n_interpolation;
						var deltax = somearray[1][0] - somearray[0][0];
						var deltay = somearray[1][1] - somearray[0][1];
						var thisx = linear_x(p, somearray[0][0], deltax, someparameters) + deltax * someparameters.fractionA * knob_x((p - someparameters.fractionB)/someparameters.fractionA, someparameters);
						var thisy = linear_y(p, somearray[0][1], deltay, someparameters) + someparameters.sign * deltax * knob_y((p - someparameters.fractionB)/someparameters.fractionA, someparameters);

						result.push([thisx, thisy]);
					}
					return result;
				}

				// helper function that reverses the the points in a slice
				var reverse_slice = function(somearray) {
					var result = [];
					for (var n = somearray.length-1; n >= 0; n--) {
						result.push(somearray[n]);
					}
					return result;
				}

				// helper that calculates a random value from a given range
				var get_random_value_from_range = function(x0, x1) {
					return x0 + somerng.get() * (x1-x0);
				}

				// helper that calculates a random set of shape parameters
				var get_shape_parameters = function() {
					var result = {};
					// which piece has knob and which has hole
					result.sign = 0;
					if (somerng.get() > 0.5)
						result.sign = 1;
					else
						result.sign = -1;
					switch(somedifficulty) {
						case 2:
							// on what fraction does the structure exist
							result.fractionA = 1.0/2.85;
							// where is the structure located
							result.fractionB = 1.0*(1-result.fractionA)/2.0;
							// tangential amplitude
							result.tangential_amplitude = 0.2;
							// normal amplitude
							result.normal_amplitude = 0.325;
							// tangential_irregularity
							result.tangential_irregularity = 0.0;
							break;
						case 1:
							// on what fraction does the structure exist
							result.fractionA = 1.0/get_random_value_from_range(2.66, 3.0);
							// where is the structure located
							result.fractionB = get_random_value_from_range(0.8, 1.2)*(1-result.fractionA)/2.0;
							// tangential amplitude
							result.tangential_amplitude = get_random_value_from_range(0.18, 0.22);
							// normal amplitude
							result.normal_amplitude = get_random_value_from_range(0.3, 0.35);
							// tangential_irregularity
							result.tangential_irregularity = get_random_value_from_range(-0.1, 0.1);
							break;
						case 0:
							// on what fraction does the structure exist
							result.fractionA = 1.0/get_random_value_from_range(2.25, 3.25);
							// where is the structure located
							result.fractionB = get_random_value_from_range(0.6, 1.4)*(1-result.fractionA)/2.0;
							// tangential amplitude
							result.tangential_amplitude = get_random_value_from_range(0.15, 0.25);
							// normal amplitude
							result.normal_amplitude = get_random_value_from_range(0.25, 0.4);
							// tangential_irregularity
							result.tangential_irregularity = get_random_value_from_range(-0.2, 0.2);
							break;
					}
					return result;
				};

				// interpolate smooth curves to use as slices of puzzle
				// slices.x contains indices 0 .. this.layout[0] indexed by segments 0 .. this.layout[1]-1
				// slices.y analogously
				// a slice is the sampled smooth interpolation of the previously calculated grid
				var slices = {'x': [], 'y': []};

				// fill out x-direction
				for (var i = 0; i <= this.layout[0]; i++) {
					slices.x[i] = [];
					for (var j = 0; j < this.layout[1]; j++) {
						// only make complex edge if inside of tiling (instead of at the border)
						if (i === 0 || i === this.layout[0]) {
							slices.x[i][j] = transpose_slice(interpolate_slice_linear(transpose_slice([this.grid[i][j], this.grid[i][j+1]])));
						} else {
							// determine shape parameters
							var parameters = get_shape_parameters();

							// make slice
							slices.x[i][j] = transpose_slice(interpolate_slice_complex(transpose_slice([this.grid[i][j], this.grid[i][j+1]]), parameters));
						}
					}
				}
				// fill out y-direction
				for (var i = 0; i < this.layout[0]; i++) {
					slices.y[i] = [];
					for (var j = 0; j <= this.layout[1]; j++) {
						// only make complex edge if inside of tiling (instead of at the border)
						if (j === 0 || j === this.layout[1]) {
							slices.y[i][j] = interpolate_slice_linear([this.grid[i][j], this.grid[i+1][j]]);
						} else {
							// determine shape parameters
							var parameters = get_shape_parameters();

							// make slice
							slices.y[i][j] = interpolate_slice_complex([this.grid[i][j], this.grid[i+1][j]], parameters);
						}
					}
				}

				// save parts of slices to edges of puzzle pieces + calculated remaining parameters
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].edges[0] = slices.x[i][j];
						this.pieces[i][j].edges[1] = slices.y[i][j+1];
						this.pieces[i][j].edges[2] = reverse_slice(slices.x[i+1][j]);
						this.pieces[i][j].edges[3] = reverse_slice(slices.y[i][j]);
						// top right - top left
						this.pieces[i][j].w = this.grid[i+1][j][0] - this.grid[i][j][0];
						// bottom left - top left
						this.pieces[i][j].h = this.grid[i][j+1][1] - this.grid[i][j][1];
						// and position
						this.pieces[i][j].x = this.grid[i][j][0];
						this.pieces[i][j].y = this.grid[i][j][1];
						this.pieces[i][j].z = i + this.layout[0]*j;
					}
				}

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
		for (var j = 0; j < this.layout[1]; j++) {
			for (var i = 0; i < this.layout[0]; i++) {
				this.pieces[i][j].x0 = [this.pieces[i][j].edges[0][0][0], this.pieces[i][j].edges[1][0][0], this.pieces[i][j].edges[2][0][0], this.pieces[i][j].edges[3][0][0]];
				this.pieces[i][j].y0 = [this.pieces[i][j].edges[0][0][1], this.pieces[i][j].edges[1][0][1], this.pieces[i][j].edges[2][0][1], this.pieces[i][j].edges[3][0][1]];
			}
		}
	}
	// this creates a 2d-set of points for the corner points of puzzle pieces
	// somerange determines how far the regular points are perturbed and somerng is a random number generator
	create_puzzle_grid(somerange, somerng) {
		var result = []
		for (var i = 0; i <= this.layout[0]; i++) {
			result[i] = [];
			for (var j = 0; j <= this.layout[1]; j++) {
				// handle puzzle border having only 1d perturbation
				var thisrangex = somerange, thisrangey = somerange;
				if (i === 0 || i === this.layout[0]) {
					thisrangex = 0;
				}
				if (j === 0 || j === this.layout[1]) {
					thisrangey = 0;
				}
				result[i][j] = [(i + 2.0*thisrangex*(somerng.get() - 0.5))/this.layout[0]*this.dimensions[0],
			                  (j + 2.0*thisrangey*(somerng.get() - 0.5))/this.layout[1]*this.dimensions[1]];
			}
		}
		return result;
	}
	// make initial placement of puzzle pieces
	distribute_pieces(distribution_mode, somerng) {
		switch(distribution_mode) {
		case 'completed':
			for (var i = 0; i < this.layout[0]; i++) {
				for (var j = 0; j < this.layout[1]; j++) {
					this.pieces[i][j].x = this.pieces[i][j].x0[0];
					this.pieces[i][j].y = this.pieces[i][j].y0[0];
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
	// make initial orientation of puzzle pieces
	distribute_angles(somerng) {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].angle = Math.floor(somerng.get()*4);
			}
		}
	}
	// this routine check if new combinations are possible with current placement of somepiece
	// manipulates the partitions of the parentpuzzle and returns number of connections made
	checkNewConnections(somepiece) {
		const debug = false;
		if (debug) console.log('=========================');
		var anythingnew = 0;
		// loop over neighbors
		for (var k = 0; k < 4; k++) {
			// connections are set up such that only if a piece in the respective direction exists, the entry can be false
			if (!somepiece.connections[k]) {
				// connect only pieces that are lying down
				if (typeof(somepiece.neighbors[k].heldby) === 'undefined') {
					// relative distance
					var d0 = [somepiece.neighbors[k].x0[somepiece.angle] - somepiece.x0[somepiece.angle],
					          somepiece.neighbors[k].y0[somepiece.angle] - somepiece.y0[somepiece.angle]];
					var cosangle = Math.cos(somepiece.angle*Math.PI/2);
					var sinangle = Math.sin(somepiece.angle*Math.PI/2);
					var d = [d0[0]*cosangle - d0[1]*sinangle,
					         d0[0]*sinangle + d0[1]*cosangle];

					if (debug) {
						console.log('=============');
						console.log(Math.abs(somepiece.angle - somepiece.neighbors[k].angle));
						console.log(Math.abs(somepiece.x + d[0] - somepiece.neighbors[k].x));
						console.log(Math.abs(somepiece.y + d[1] - somepiece.neighbors[k].y));
					}
					// check if placement correct
					if (Math.abs(somepiece.angle - somepiece.neighbors[k].angle) < 0.01) { // same orientation needed
						if (Math.abs(somepiece.x + d[0] - somepiece.neighbors[k].x) < acceptablePlacementDistanceForConnection
						    && Math.abs(somepiece.y + d[1] - somepiece.neighbors[k].y) < acceptablePlacementDistanceForConnection) {
								// reposition tested piece + partition to fit with neighbors partition
								if (debug) console.log('new connection, reposition other tiles');
		            var cosangle = Math.cos(somepiece.angle*Math.PI/2);
		            var sinangle = Math.sin(somepiece.angle*Math.PI/2);
								for (const piece of somepiece.partition.pieces) {
									// get coordinates
			            var deltax = (piece.x0[somepiece.angle] - somepiece.neighbors[k].x0[somepiece.angle]) * cosangle
									             - (piece.y0[somepiece.angle] - somepiece.neighbors[k].y0[somepiece.angle]) * sinangle;
			            var deltay = (piece.x0[somepiece.angle] - somepiece.neighbors[k].x0[somepiece.angle]) * sinangle
									             + (piece.y0[somepiece.angle] - somepiece.neighbors[k].y0[somepiece.angle]) * cosangle;
									piece.x = somepiece.neighbors[k].x + deltax;
									piece.y = somepiece.neighbors[k].y + deltay;
								}

								if (debug) console.log('merging partitions of sizes', somepiece.partition.pieces.length, somepiece.neighbors[k].partition.pieces.length);
								// merge partitions
								anythingnew += this.mergepartitions(somepiece.partition, somepiece.neighbors[k].partition);

								// for debugging
								// console.log('merged the tiles: ', somepiece.i, somepiece.j, 'and', somepiece.neighbors[k].i, somepiece.neighbors[k].j);
								// console.log('new partition:', somepiece.partition);
						}
					}
				}
			}
		}
		return anythingnew;
	}
	// this routine merges two partitions and updates the list of partitions in this puzzle
	// returns the number of new connections for this merge
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
		var newconnections = 0;
		for (const edge of partition1.edges) {
			if (edge[0].partition.id !== newpartition.id || edge[1].partition.id !== newpartition.id) {
				newpartition.edges.push(edge);
			} else {
				this.makeconnection(edge[0], edge[1]);
				newconnections++;
			}
		}
		for (const edge of partition2.edges) {
			if (edge[0].partition.id !== newpartition.id || edge[1].partition.id !== newpartition.id) {
				newpartition.edges.push(edge);
			}
		}
		return newconnections;
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
