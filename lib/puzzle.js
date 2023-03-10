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
				// position puzzle piece
				this.pieces[i][j].divcontainer.style.left = thiscamera.getx_px(this.pieces[i][j].x - (this.pieces[i][j].x0 - this.pieces[i][j].pathouter[0][0])) + "px";
				this.pieces[i][j].divcontainer.style.top = thiscamera.gety_px((this.pieces[i][j].y - (this.pieces[i][j].y0 - this.pieces[i][j].pathouter[0][1]))) + "px";
				this.pieces[i][j].divcontainer.style.zIndex = this.pieces[i][j].z;
				// position shadows & highlights of piece
				this.pieces[i][j].divedgeshadowcontainer.style.left = thiscamera.getx_px(-puzzlepiece_shadows_highlights_offset + this.pieces[i][j].x - (this.pieces[i][j].x0 - this.pieces[i][j].pathouter[0][0])) + "px";
				this.pieces[i][j].divedgeshadowcontainer.style.top = thiscamera.gety_px(( puzzlepiece_shadows_highlights_offset + this.pieces[i][j].y - (this.pieces[i][j].y0 - this.pieces[i][j].pathouter[0][1]))) + "px";
				this.pieces[i][j].divedgeshadowcontainer.style.zIndex = this.pieces[i][j].z-1;
				// position shadows & highlights of piece
				this.pieces[i][j].divedgehighlightcontainer.style.left = thiscamera.getx_px( puzzlepiece_shadows_highlights_offset + this.pieces[i][j].x - (this.pieces[i][j].x0 - this.pieces[i][j].pathouter[0][0])) + "px";
				this.pieces[i][j].divedgehighlightcontainer.style.top = thiscamera.gety_px((-puzzlepiece_shadows_highlights_offset + this.pieces[i][j].y - (this.pieces[i][j].y0 - this.pieces[i][j].pathouter[0][1]))) + "px";
				this.pieces[i][j].divedgehighlightcontainer.style.zIndex = this.pieces[i][j].z-1;
			}
		}
	}
	// updates the puzzle piece scale during camera zoom
	updatePieceScale() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].divcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
				this.pieces[i][j].divedgeshadowcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
				this.pieces[i][j].divedgehighlightcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
			}
		}
	}
}
