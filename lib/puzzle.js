class puzzle {
	constructor(layout0, seed0, style0, motif0, dimensions0, parentdiv0) {
		// puzzle resolution in x and y
		this.layout = layout0;
		// seed for the random generation of the tiling
		this.seed = seed0;
		// object that contains info on puzzle style; style.edges=<flat|regular>
		this.style = style0;

		// counter for puzzle progress (completion)
		this.totaledges = 2*this.layout[0]*this.layout[1] - this.layout[0] - this.layout[1];

		// parent container for puzzle pieces
		this.parentdiv = parentdiv0;

		// save image dimension in camera and pixel space
		this.dimensions = dimensions0;
		this.dimensions_px = [];
		this.aspectratio = dimensions0[1]/dimensions0[0];

		// variables for image
		this.motif = motif0;
		// get natural image dimenions
		this.img = document.createElement('img');
		this.img.addEventListener("load", (event) => {
			this.dimensions_px[0] = this.img.naturalWidth;
			this.dimensions_px[1] = this.img.naturalHeight;
		});
		this.img.src = this.motif;

		// setup data structures
		this.pieces = [];
		for (var i = 0; i < this.layout[0]; i++) {
			this.pieces[i] = [];
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j] = new puzzlepiece(this, i, j, this.motif);
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
	}
	// this routine reads the server-provided tile shape information into the client-side puzzle object
	readPieceShapes(listofpieces) {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].w = listofpieces[i][j].w;
				this.pieces[i][j].h = listofpieces[i][j].h;
				this.pieces[i][j].edges = listofpieces[i][j].edges;
				this.pieces[i][j].connections = listofpieces[i][j].connections;
			}
		}
	}
	// this routine reads the server-provided positioning information into the client-side puzzle object
	readPieceCoordinates(listofpieces) {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].x = listofpieces[i][j].x;
				this.pieces[i][j].y = listofpieces[i][j].y;
				this.pieces[i][j].x0 = listofpieces[i][j].x0;
				this.pieces[i][j].y0 = listofpieces[i][j].y0;
				this.pieces[i][j].z = listofpieces[i][j].z;
				this.pieces[i][j].angle = listofpieces[i][j].angle;
			}
		}
	}
	generatePieceClippaths() {
		switch(this.style.edges) {
			case "flat":
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].setuptestclip();
						this.pieces[i][j].applyclip();
					}
				}
				break;
			case "flat_irregular":
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].setupclip();
						this.pieces[i][j].applyclip();
					}
				}
				break;
			case "regular":
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].setupclip();
						this.pieces[i][j].applyclip();
					}
				}
				break;
			default:
				for (var i = 0; i < this.layout[0]; i++) {
					for (var j = 0; j < this.layout[1]; j++) {
						this.pieces[i][j].setuptestclip();
						this.pieces[i][j].applyclip();
					}
				}
		}
		// use information on piece shape to prepare positioning of piece in different orientations
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				// the top left corner of piece (game's frame) is kept at a constant position (pre-/post rotation)
				// hard to explain why it looks like this.. can be easily constructed from sketches (note that here translateX moves in x-direction in piece's frame not game's frame..)
				this.pieces[i][j].angleoffset[0] = [0, 0];
				this.pieces[i][j].angleoffset[1] = [(this.pieces[i][j].pathouter[0][0] - this.pieces[i][j].edges[1][0][0]) - (this.pieces[i][j].pathouter[0][1] - this.pieces[i][j].edges[0][0][1]), (this.pieces[i][j].pathouter[0][1] - this.pieces[i][j].edges[1][0][1]) + (this.pieces[i][j].pathouter[0][0] - this.pieces[i][j].edges[0][0][0])];
				this.pieces[i][j].angleoffset[2] = [(this.pieces[i][j].pathouter[0][0] - this.pieces[i][j].edges[2][0][0]) + (this.pieces[i][j].pathouter[0][0] - this.pieces[i][j].edges[0][0][0]), (this.pieces[i][j].pathouter[0][1] - this.pieces[i][j].edges[2][0][1]) + (this.pieces[i][j].pathouter[0][1] - this.pieces[i][j].edges[0][0][1])];
				this.pieces[i][j].angleoffset[3] = [(this.pieces[i][j].pathouter[0][0] - this.pieces[i][j].edges[3][0][0]) + (this.pieces[i][j].pathouter[0][1] - this.pieces[i][j].edges[0][0][1]), (this.pieces[i][j].pathouter[0][1] - this.pieces[i][j].edges[3][0][1]) - (this.pieces[i][j].pathouter[0][0] - this.pieces[i][j].edges[0][0][0])];
			}
		}
	}
	insertPieces() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
		 		this.parentdiv.append(this.pieces[i][j].divcontainer);
		 		this.parentdiv.append(this.pieces[i][j].divedgeshadowcontainer);
		 		this.parentdiv.append(this.pieces[i][j].divedgehighlightcontainer);
			}
		}
	}
	// updates the puzzle piece locations during camera pan/zoom
	updatePiecePositions() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				// no interuption during animation..
				if (typeof(this.pieces[i][j].rotation_timer) !== 'undefined') continue;

				var piece = this.pieces[i][j];
				if (typeof(piece.rotation_timer) === 'undefined') {
					// position puzzle piece
					piece.divcontainer.style.left = thiscamera.getx_px(piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
					piece.divcontainer.style.top = thiscamera.gety_px((piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
					piece.divcontainer.style.zIndex = piece.z;
					// position shadows & highlights of piece
					piece.divedgeshadowcontainer.style.left = thiscamera.getx_px(-puzzlepiece_shadows_highlights_offset + piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
					piece.divedgeshadowcontainer.style.top = thiscamera.gety_px(( puzzlepiece_shadows_highlights_offset + piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
					piece.divedgeshadowcontainer.style.zIndex = piece.z-1;
					// position shadows & highlights of piece
					piece.divedgehighlightcontainer.style.left = thiscamera.getx_px( puzzlepiece_shadows_highlights_offset + piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
					piece.divedgehighlightcontainer.style.top = thiscamera.gety_px((-puzzlepiece_shadows_highlights_offset + piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
					piece.divedgehighlightcontainer.style.zIndex = piece.z-1;
				} else {
					var cosangle = Math.cos(piece.animation_angle*Math.PI/2);
					var sinangle = Math.sin(piece.animation_angle*Math.PI/2);
					// get interpolated relative vector for correct positioning (changing corner of reference)
					var interpolatedx = piece.rotate_anim_current*(piece.x0[piece.rotate_anim_end%4] - thispuzzle.pieces[i][j].x0[piece.rotate_anim_end%4])
															+ (1-piece.rotate_anim_current)*(piece.x0[piece.rotate_anim_start%4] - thispuzzle.pieces[i][j].x0[piece.rotate_anim_start%4]);
					var interpolatedy = piece.rotate_anim_current*(piece.y0[piece.rotate_anim_end%4] - thispuzzle.pieces[i][j].y0[piece.rotate_anim_end%4])
															+ (1-piece.rotate_anim_current)*(piece.y0[piece.rotate_anim_start%4] - thispuzzle.pieces[i][j].y0[piece.rotate_anim_start%4]);
					// transform relative position
					var deltax = interpolatedx*cosangle - interpolatedy*sinangle;
					var deltay = interpolatedx*sinangle + interpolatedy*cosangle;

					// position piece accordingly
					piece.x = thispuzzle.pieces[i][j].x + deltax;
					piece.y = thispuzzle.pieces[i][j].y + deltay;

					// update div positioning
					piece.divcontainer.style.left = thiscamera.getx_px(piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
					piece.divcontainer.style.top = thiscamera.gety_px((piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
					// position shadows & highlights of piece
					piece.divedgeshadowcontainer.style.left = thiscamera.getx_px(-puzzlepiece_shadows_highlights_offset + piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
					piece.divedgeshadowcontainer.style.top = thiscamera.gety_px(( puzzlepiece_shadows_highlights_offset + piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
					// position shadows & highlights of piece
					piece.divedgehighlightcontainer.style.left = thiscamera.getx_px( puzzlepiece_shadows_highlights_offset + piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
					piece.divedgehighlightcontainer.style.top = thiscamera.gety_px((-puzzlepiece_shadows_highlights_offset + piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
				}
			}
		}
	}
	// updates the puzzle piece angle, offset, and scale
	updatePieceTransformation() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				// no interuption during animation..
				if (typeof(this.pieces[i][j].rotation_timer) !== 'undefined') continue;
				
				// calculate angle-specific offset
				var translateX_current = thiscamera.getlength_px(this.pieces[i][j].angleoffset[this.pieces[i][j].angle][0]);
				var translateY_current = thiscamera.getlength_px(this.pieces[i][j].angleoffset[this.pieces[i][j].angle][1]);

				var transformstring = "rotate(" + this.pieces[i][j].angle*90 + "deg) translateX(" + translateX_current + "px) translateY(" + translateY_current + "px) scale(" + thiscamera.zoom + ")";

				// apply that transformation
				this.pieces[i][j].divcontainer.style.transform = transformstring;
				this.pieces[i][j].divedgeshadowcontainer.style.transform = transformstring;
				this.pieces[i][j].divedgehighlightcontainer.style.transform = transformstring;
			}
		}
	}
}
