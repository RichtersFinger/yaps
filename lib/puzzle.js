class puzzle {
	constructor(layout0, seed0, style0, motive0, dimensions0, parentdiv0) {
		// puzzle resolution in x and y
		this.layout = layout0;
		// seed for the random generation of the tiling
		this.seed = seed0;
		// unsed for now, object that contains info on puzzle style
		this.style = style0;

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
	}
/*
	setmotive(motiveurl) {
		this.motive = motiveurl;
		// function used to finalize puzzle setup after the motive image has been loaded
		let somepuzzle = this;
		var setuppieces = function() {
			for (let i = 0; i < somepuzzle.layout[0]; i++) {
				for (let j = 0; j < somepuzzle.layout[1]; j++) {
					// note: TEMPORARY
					// apply settings to pieces
					somepuzzle.pieces[i][j].setmotive(somepuzzle.motive);
					somepuzzle.pieces[i][j].setuptestclip();
					somepuzzle.pieces[i][j].applyclip();

					// dragging pieces - test setup (client side only)
					// analogue to dragging camera in 'game.js'
					let dragging_piece = false;
					let mousedown_mouselocation = [0, 0];
					let piece_mouselocation = [0, 0];
					somepuzzle.pieces[i][j].img.addEventListener("mousedown", (event) => {
						if (event.which === 1) {
							event.stopPropagation();
							mousedown_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
							piece_mouselocation = [somepuzzle.pieces[i][j].x, somepuzzle.pieces[i][j].y];
							dragging_piece = true;
						}
					});
					somepuzzle.pieces[i][j].img.addEventListener("mousemove", (event) => {
						if (dragging_piece) {
							var mousemove_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
							somepuzzle.pieces[i][j].x = piece_mouselocation[0] + thiscamera.getlength_cam(mousemove_mouselocation[0] - mousedown_mouselocation[0]);
							somepuzzle.pieces[i][j].y = piece_mouselocation[1] + thiscamera.getlength_cam(mousemove_mouselocation[1] - mousedown_mouselocation[1]);
							somepuzzle.pieces[i][j].divcontainer.style.left = thiscamera.getx_px(somepuzzle.pieces[i][j].x) + "px";
							somepuzzle.pieces[i][j].divcontainer.style.top = thiscamera.gety_px(somepuzzle.pieces[i][j].y) + "px";
						}
					});
					somepuzzle.pieces[i][j].img.addEventListener("mouseup", (event) => {
						if (dragging_piece && event.which === 1) {
							dragging_piece = false;
						}
					});
				}
			}
			somepuzzle.updatePiecePositions();
			somepuzzle.updatePieceScale();
		};
		var setdimensions = function() {
			// save image dimensions
			somepuzzle.dimensions_px[0] = somepuzzle.img.naturalWidth;
			somepuzzle.dimensions_px[1] = somepuzzle.img.naturalHeight;
		}
		// make sure to get image dimenions (either onload or sync if already loaded)
		this.img.addEventListener("load", (event) => {
			setdimensions();
			// use the gathered info to finalize puzzle  piece configuration
			setuppieces();
		});
		this.img.src = motiveurl;
		if (this.img.complete) {
			setdimensions();
			// use the gathered info to finalize puzzle  piece configuration
			setuppieces();
		}
	}
	*/
	// this routine inserts the individual pieces of the puzzle into the game container
	readPieceCoordinates(listofpieces) {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].x = listofpieces[i][j].x;
				this.pieces[i][j].y = listofpieces[i][j].y;
				this.pieces[i][j].angle = listofpieces[i][j].angle;
			}
		}
	}
	generatePieceClippaths() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].setuptestclip();
				this.pieces[i][j].applyclip();
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
