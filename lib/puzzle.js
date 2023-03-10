class puzzle {
	constructor(layout0, seed0, style0, motive0, dimensions0, parentdiv0) {
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

		// variables for image
		this.motive = motive0;
		// get natural image dimenions
		this.img = document.createElement('img');
		this.img.addEventListener("load", (event) => {
			this.dimensions_px[0] = this.img.naturalWidth;
			this.dimensions_px[1] = this.img.naturalHeight;
		});
		this.img.src = this.motive;

		// setup data structures
		this.pieces = [];
		for (var i = 0; i < this.layout[0]; i++) {
			this.pieces[i] = [];
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j] = new puzzlepiece(this, i, j, this.motive);
			}
		}

		// note: add puzzle piece highlights based on the current partitioning
	}
	// this routine inserts the individual pieces of the puzzle into the game container
	readPieceCoordinates(listofpieces) {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].x = listofpieces[i][j].x;
				this.pieces[i][j].y = listofpieces[i][j].y;
				this.pieces[i][j].x0 = listofpieces[i][j].x0;
				this.pieces[i][j].y0 = listofpieces[i][j].y0;
				this.pieces[i][j].z = listofpieces[i][j].z;
				this.pieces[i][j].divcontainer.style.zIndex = this.pieces[i][j].z;
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
				console.log("regular puzzle edge style not implemented yet.")
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
			}
		}
	}
	// updates the puzzle piece locations during camera pan/zoom
	updatePiecePositions() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].divcontainer.style.left = thiscamera.getx_px(this.pieces[i][j].x) + "px";
				this.pieces[i][j].divcontainer.style.top = thiscamera.gety_px(this.pieces[i][j].y) + "px";
		    this.pieces[i][j].divcontainer.style.zIndex = this.pieces[i][j].z;
			}
		}
	}
	// updates the puzzle piece scale during camera zoom
	updatePieceScale() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].divcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
			}
		}
	}
}
