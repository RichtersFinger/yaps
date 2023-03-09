class puzzlepiece {
	constructor(parentpuzzle0, i0, j0, motiveurl) {
		this.parentpuzzle = parentpuzzle0;

		// indexed position in puzzle grid
		this.i = i0; // x-direction; left (0) -> right (this.parentpuzzle.layout[0])
		this.j = j0; // y-direction; top (0) -> bottom (this.parentpuzzle.layout[1])
		// actual position in game
		this.x = 0;
		this.y = 0;
		// position in puzzle
		this.x0 = 0;
		this.y0 = 0;
		// css z-index
		this.z = 0;
		// actual dimensions in game
		this.w = 0;
		this.h = 0;
		// these define the clip-path, where inner has the fine details and outer constitutes a bounding box (tl|br)
		this.pathinner = [];
		this.pathouter = [];
		// wrap img in div which is at fitting size & has overflow:hidden
		// the img is then (later) clipped and shifted inside this div
		this.divcontainer = document.createElement('div');
		//this.divcontainer.style.background = "rgba(255,255,255,0.8)";
		this.divcontainer.style.overflow = "hidden";
		this.divcontainer.style.position = "absolute";
		this.divcontainer.style.width = "0%";
		this.divcontainer.style.height = "0%";
		this.divcontainer.style.transformOrigin = "top left";
		this.img = document.createElement('img');
		this.img.setAttribute('draggable', false);
		if (typeof(motiveurl) === 'string') {
			this.img.src = motiveurl;
		}
		this.img.style.position = "absolute";
		this.divcontainer.append(this.img);

		// used as offset for zIndex if piece is highlighted 
		this.highlight = 0;

		// similar to server-side implementation; used to find pieces that have to be moved alongside one another
		// contains references to all pieces that are in the partition of this piece
		this.partition = [];
	}
	setmotive(motiveurl) {
		this.img.src = motiveurl;
	}
	setuptestclip() {
		// this routine is used for debugging/testing purposes
		// define the units in which the pieces of the puzzle are counted
		var unitx = 1.0/this.parentpuzzle.layout[0];
		var unity = 1.0/this.parentpuzzle.layout[1];
		// define inner (visual) clipping path; this will later be the outline of an actual puzzle piece
		this.pathinner = [[this.i*unitx, this.j*unity],
		                  [this.i*unitx, (this.j + 1)*unity],
		                  [(this.i + 1)*unitx, (this.j + 1)*unity],
		                  [(this.i + 1)*unitx, this.j*unity]];
		// this is a bounding box to allow the inner path to protrude outwards
		this.pathouter = [[this.i*unitx-0.0, this.j*unity-0.0], [(this.i + 1)*unitx+0.0, (this.j + 1)*unity+0.0]];
		// set correct camera space position in complete puzzle
		// calculate the width and height of the piece in camera space
		// with margin (pathouter)
		this.w = (this.pathouter[1][0] - this.pathouter[0][0])*this.parentpuzzle.dimensions[0];
		this.h = (this.pathouter[1][1] - this.pathouter[0][1])*this.parentpuzzle.dimensions[1];
		// precise (pathinner)
		// this.w = unitx*this.parentpuzzle.dimensions[0];
		// this.h = unity*this.parentpuzzle.dimensions[1];
	}
	applyclip() {
		// apply the previously defined clipping path
		if (this.pathinner.length > 0) {
			// set pixel space dimensions of div-container for this piece
			this.divcontainer.style.width = (this.pathouter[1][0] - this.pathouter[0][0])*this.parentpuzzle.dimensions_px[0] + "px";
			this.divcontainer.style.height = (this.pathouter[1][1] - this.pathouter[0][1])*this.parentpuzzle.dimensions_px[1] + "px";
			// convert pathinner to css-property
			var thisclip = "polygon(";
			for (var i = 0; i < this.pathinner.length; i++) {
				thisclip += 100*this.pathinner[i][0] + "% " + 100*this.pathinner[i][1] + "%, "
			}
			thisclip += 100*this.pathinner[0][0] + "% " + 100*this.pathinner[0][1] + "%)";
			// and apply to element
			this.img.style.clipPath = thisclip;
			// offset img element inside div to have the clipped section centered in the div (so the piece will be seen at the desired position)
			this.img.style.left = -this.pathouter[0][0]*this.parentpuzzle.dimensions_px[0] + "px";
			this.img.style.top = -this.pathouter[0][1]*this.parentpuzzle.dimensions_px[1] + "px";
		}
	}
}
