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

		// this type of object is similar to puzzle piece but has the combined shape of all pieces in a partition
		// this is used to create shadows/highlights around the edges of puzzle pieces
		// example: {<list of pieces in partition>, "left|topmost": <left|topmost piece in given partition>, "color": <rgbcolor>, "containerdiv": <div element>};
		this.partitionshadows = [];
		this.partitionhighlights = [];
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
			}
		}
	}
	// updates the puzzle piece locations during camera pan/zoom
	updatePiecePositions() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].divcontainer.style.left = thiscamera.getx_px(this.pieces[i][j].x - (this.pieces[i][j].x0 - this.pieces[i][j].pathouter[0][0])) + "px";
				this.pieces[i][j].divcontainer.style.top = thiscamera.gety_px((this.pieces[i][j].y - (this.pieces[i][j].y0 - this.pieces[i][j].pathouter[0][1]))*this.aspectratio) + "px"; // why is the aspectratio-factor needed?
		    this.pieces[i][j].divcontainer.style.zIndex = this.pieces[i][j].z;
			}
		}
		// position shadows & highlights of partitions
		const displacement = 0.0015;
		for (const partitionshadow of this.partitionshadows) {
			partitionshadow.divcontainer.style.left = thiscamera.getx_px(-displacement + partitionshadow.leftmost.x - (partitionshadow.leftmost.x0 - partitionshadow.leftmost.pathouter[0][0])) + "px";
			partitionshadow.divcontainer.style.top = thiscamera.gety_px((+displacement + partitionshadow.topmost.y - (partitionshadow.topmost.y0 - partitionshadow.topmost.pathouter[0][1]))*this.aspectratio) + "px";
			partitionshadow.divcontainer.style.zIndex = Math.min(partitionshadow.leftmost.z, partitionshadow.bottommost.z, partitionshadow.rightmost.z, partitionshadow.topmost.z)-1;
		}
		for (const partitionhighlight of this.partitionhighlights) {
			partitionhighlight.divcontainer.style.left = thiscamera.getx_px(+displacement + partitionhighlight.leftmost.x - (partitionhighlight.leftmost.x0 - partitionhighlight.leftmost.pathouter[0][0])) + "px";
			partitionhighlight.divcontainer.style.top = thiscamera.gety_px((-displacement + partitionhighlight.topmost.y - (partitionhighlight.topmost.y0 - partitionhighlight.topmost.pathouter[0][1]))*this.aspectratio) + "px";
			partitionhighlight.divcontainer.style.zIndex = Math.min(partitionhighlight.leftmost.z, partitionhighlight.bottommost.z, partitionhighlight.rightmost.z, partitionhighlight.topmost.z)-1;
		}
	}
	// updates the puzzle piece scale during camera zoom
	updatePieceScale() {
		for (var i = 0; i < this.layout[0]; i++) {
			for (var j = 0; j < this.layout[1]; j++) {
				this.pieces[i][j].divcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
			}
		}
		for (const partitionshadow of this.partitionshadows) {
			partitionshadow.divcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
		}
		for (const partitionhighlight of this.partitionhighlights) {
			partitionhighlight.divcontainer.style.transform = "scale(" + thiscamera.zoom + ")";
		}
	}
	// cleans up previous this.partitionshadows and generates anew from somepartitioning
	renew_partition_shadows(somepartitioning) {
		// make new list of objects
		// read partitions from input
		var new_partitionshadows = [];
		var new_partitionhighlights = [];
		for (const partition of somepartitioning) {
      var thispartitionshadow = {};
			new_partitionshadows.push(thispartitionshadow);

      thispartitionshadow.partition = [];
      // assemble partition "object"
      for (const piece of partition) {
        thispartitionshadow.partition.push(this.pieces[piece[0]][piece[1]]);
      }

			// find left- and topmost pieces in this partition
			thispartitionshadow.leftmost = thispartitionshadow.partition[0];
			thispartitionshadow.bottommost = thispartitionshadow.partition[0];
			thispartitionshadow.rightmost = thispartitionshadow.partition[0];
			thispartitionshadow.topmost = thispartitionshadow.partition[0];
			for (const piece of thispartitionshadow.partition) {
				if (piece.pathouter[0][0] < thispartitionshadow.leftmost.pathouter[0][0]) {
					thispartitionshadow.leftmost = piece;
				}
				if (piece.pathouter[1][1] > thispartitionshadow.bottommost.pathouter[1][1]) {
					thispartitionshadow.bottommost = piece;
				}
				if (piece.pathouter[1][0] > thispartitionshadow.rightmost.pathouter[1][0]) {
					thispartitionshadow.rightmost = piece;
				}
				if (piece.pathouter[0][1] < thispartitionshadow.topmost.pathouter[0][1]) {
					thispartitionshadow.topmost = piece;
				}
			}

			// trace the contour of this partition by following edges starting with top left corner of leftmost piece in counter-clockwise direction
			var currentpiece = thispartitionshadow.leftmost;
			var currentdir = 0;
			var listofedges = [];
			while (true) {
				// check whether current edge is at the surface of partition
				if (!currentpiece.connections[currentdir] || typeof(currentpiece.neighbors[currentdir]) === 'undefined') {
					// add current edge to list
					listofedges.push(currentpiece.edges[currentdir]);
				} else {
					// turn right one unit
					currentdir = (currentdir + 4 - 1)%4;
				}

				// check if there is a piece in the same direction as the current edge
				if (currentpiece.connections[(currentdir+1)%4] && typeof(currentpiece.neighbors[(currentdir+1)%4]) !== 'undefined') {
					// use this neighbor for next segment
					currentpiece = currentpiece.neighbors[(currentdir+1)%4];
				} else {
					currentdir = (currentdir + 1)%4;
					// check next direction
				}
				if (currentpiece.i === thispartitionshadow.leftmost.i && currentpiece.j === thispartitionshadow.leftmost.j && currentdir === 0) {
					// closed path
					break;
				}
			}

			// make string from listofedges
			thispartitionshadow.pathinner = [];
			for (const edge of listofedges) {
				thispartitionshadow.pathinner = thispartitionshadow.pathinner.concat(edge);
			}
			thispartitionshadow.thisclip = "polygon(";
			for (const point of thispartitionshadow.pathinner) {
				thispartitionshadow.thisclip += 100*point[0] + "% " + 100*point[1] + "%, "
			}
			thispartitionshadow.thisclip += 100*thispartitionshadow.pathinner[0][0] + "% " + 100*thispartitionshadow.pathinner[0][1] + "%)";

			// create containerdiv and contentdiv (analogous to puzzlepiece but with div instead of img)
			thispartitionshadow.divcontainer = document.createElement('div');
			thispartitionshadow.divcontainer.style.overflow = "hidden";
			thispartitionshadow.divcontainer.style.position = "absolute";
			thispartitionshadow.divcontainer.style.pointerEvents = "none";
			thispartitionshadow.divcontainer.style.transformOrigin = "top left";
			thispartitionshadow.contentdiv = document.createElement('div');
			thispartitionshadow.contentdiv.style.position = "absolute";
			thispartitionshadow.divcontainer.append(thispartitionshadow.contentdiv);

			thispartitionshadow.color = "rgb(50, 50, 50, 1)";
			thispartitionshadow.contentdiv.style.backgroundColor = thispartitionshadow.color;
			thispartitionshadow.contentdiv.style.clipPath = thispartitionshadow.thisclip;
			// offset contentdiv element inside divcontainer to have the clipped section centered in the div (so the shadow will be seen at the desired position)
			thispartitionshadow.contentdiv.style.width = this.dimensions_px[0] + "px";
			thispartitionshadow.contentdiv.style.height = this.dimensions_px[1] + "px";
			thispartitionshadow.contentdiv.style.left = -thispartitionshadow.leftmost.pathouter[0][0]*this.dimensions_px[0] + "px";
			thispartitionshadow.contentdiv.style.top = -thispartitionshadow.topmost.pathouter[0][1]*this.dimensions_px[1] + "px";
			thispartitionshadow.divcontainer.style.width = (thispartitionshadow.rightmost.pathouter[1][0] - thispartitionshadow.leftmost.pathouter[0][0])*this.dimensions_px[0] + "px";
			thispartitionshadow.divcontainer.style.height = (thispartitionshadow.bottommost.pathouter[1][1] - thispartitionshadow.topmost.pathouter[0][1])*this.dimensions_px[1] + "px";
    }

		// copy info for highlights
		var new_partitionhighlights = [];
		for (const shadow of new_partitionshadows) {
			var thispartitionhighlight = {"leftmost": shadow.leftmost,
			                              "bottommost": shadow.bottommost,
			                              "rightmost": shadow.rightmost,
			                              "topmost": shadow.topmost}
			new_partitionhighlights.push(thispartitionhighlight);

			// create containerdiv and contentdiv (analogous to puzzlepiece but with div instead of img)
			thispartitionhighlight.divcontainer = document.createElement('div');
			thispartitionhighlight.divcontainer.style.overflow = "hidden";
			thispartitionhighlight.divcontainer.style.position = "absolute";
			thispartitionhighlight.divcontainer.style.pointerEvents = "none";
			thispartitionhighlight.divcontainer.style.transformOrigin = "top left";
			thispartitionhighlight.contentdiv = document.createElement('div');
			thispartitionhighlight.contentdiv.style.position = "absolute";
			thispartitionhighlight.divcontainer.append(thispartitionhighlight.contentdiv);

			thispartitionhighlight.color = "rgb(200, 200, 200, 1)";
			thispartitionhighlight.contentdiv.style.backgroundColor = thispartitionhighlight.color;
			thispartitionhighlight.contentdiv.style.clipPath = shadow.thisclip;
			// offset contentdiv element inside divcontainer to have the clipped section centered in the div (so the shadow will be seen at the desired position)
			thispartitionhighlight.contentdiv.style.width = this.dimensions_px[0] + "px";
			thispartitionhighlight.contentdiv.style.height = this.dimensions_px[1] + "px";
			thispartitionhighlight.contentdiv.style.left = -thispartitionhighlight.leftmost.pathouter[0][0]*this.dimensions_px[0] + "px";
			thispartitionhighlight.contentdiv.style.top = -thispartitionhighlight.topmost.pathouter[0][1]*this.dimensions_px[1] + "px";
			thispartitionhighlight.divcontainer.style.width = (thispartitionhighlight.rightmost.pathouter[1][0] - thispartitionhighlight.leftmost.pathouter[0][0])*this.dimensions_px[0] + "px";
			thispartitionhighlight.divcontainer.style.height = (thispartitionhighlight.bottommost.pathouter[1][1] - thispartitionhighlight.topmost.pathouter[0][1])*this.dimensions_px[1] + "px";
		}

		// remove old + add new
		for (const element of this.partitionshadows) {
			element.divcontainer.remove();
		}
		for (const element of this.partitionhighlights) {
			element.divcontainer.remove();
		}
		this.partitionshadows = new_partitionshadows;
		for (const element of this.partitionshadows) {
			this.parentdiv.append(element.divcontainer);
		}
		this.partitionhighlights = new_partitionhighlights;
		for (const element of this.partitionhighlights) {
			this.parentdiv.append(element.divcontainer);
		}
	}
}
