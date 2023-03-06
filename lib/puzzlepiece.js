class puzzlepiece {
	constructor(motiveurl) {
		this.location = [0, 0];
		// these define the clip-path, where inner has the fine details and outer constitutes a bounding box (tl|br)
		this.pathinner = [];
		this.pathouter = [];
		// wrap img in div which is at fitting size & have overflow:hidden
		this.divcontainer = document.createElement('div');
		this.divcontainer.style.background = "rgba(255,255,255,0.8)";
		this.divcontainer.style.overflow = "hidden";
		this.divcontainer.style.position = "absolute";
		this.divcontainer.style.width = "0%";
		this.divcontainer.style.height = "0%";
		this.img = document.createElement('img');
		this.imgw = -1;
		this.imgh = -1;
		this.img.addEventListener("load", (event) => {
			this.imgw = this.img.clientWidth;
			this.imgh = this.img.clientHeight;
			this.setuptestclip();
			this.applyclip();
		});
		if (motiveurl) {
			this.img.src = motiveurl;
		}
		this.img.style.position = "absolute";
		this.divcontainer.append(this.img);
	}
	setmotive(motiveurl) {
		this.img.src = motiveurl;
	}
	setuptestclip() {
		this.pathinner = [[0.4, 0.4], [0.4, 0.5], [0.5, 0.5], [0.5, 0.4]];
		this.pathouter = [[0.38, 0.38], [0.52, 0.52]];
	}
	applyclip() {
		if (this.pathinner.length > 0) {
			this.divcontainer.style.width = (this.pathouter[1][0] - this.pathouter[0][0])*this.imgw + "px";
			this.divcontainer.style.height = (this.pathouter[1][1] - this.pathouter[0][1])*this.imgh + "px";
			var thisclip = "polygon(";//5% 5%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%);
			for (var i = 0; i < this.pathinner.length; i++) {
				thisclip += 100*this.pathinner[i][0] + "% " + 100*this.pathinner[i][1] + "%, "
			}
			thisclip += 100*this.pathinner[0][0] + "% " + 100*this.pathinner[0][1] + "%)";
			this.img.style.clipPath = thisclip;
			this.img.style.left = -this.pathouter[0][0]*this.imgw + "px";
			this.img.style.top = -this.pathouter[0][1]*this.imgh + "px";
		}
	}
}
