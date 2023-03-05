class rng {
	constructor() {
		this.m_w = 123456789;
		this.m_z = 567891234;
		this.mask = 0xffffffff;
	}
	seed(i) {
	    this.m_w = (123456789 + i) & this.mask;
	    this.m_z = (567891234 - i) & this.mask;
	}
	// returns number 0 <= x < 1
	get() {
	    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
	    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
	    var result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
	    result /= 4294967296;
	    return result;
	}
}

// returns value of the cookie 'name' or null if cookie not existent
function getCookie(name) {
	var result = null;
	var cookies = document.cookie.split(";");
	for (var i = 0; i < cookies.length; i++) {
		var thiscookie = cookies[i].split("=");
		if (thiscookie.length === 2) {
			if (thiscookie[0].trim() === name) {
				result = thiscookie[1].trim();
				break;
			}
		}
	}
	return result;
}

// enables smooth opacity transition of html-element
function fadeto(element, op0, op1, msduration, somecallback) {
	var op = op0;
	var currentdate = new Date();
	var t0 = currentdate.getTime();

	var timer = setInterval(function () {
		var currentdate = new Date();
		var t1 = currentdate.getTime();
		op = op0 + (op1 - op0)*(t1-t0)/msduration;
		if (t1 >= t0 + msduration){
			op = op1;
			element.style.opacity = op;
			if (somecallback) somecallback();
			clearInterval(timer);
		}
		element.style.opacity = op;
	}, 16);
}

// enables smooth transition in style of html-element
// transitionfunction takes a single argument that interpolates linearly between 0 and 1 for the desired duration
function animate(msduration, transitionfunction, somecallback) {
	var currentdate = new Date();
	var t0 = currentdate.getTime();

	var timer = setInterval(function () {
		var currentdate = new Date();
		var t1 = currentdate.getTime();
		transitionfunction((t1-t0)/msduration);
		if (t1 >= t0 + msduration){
			if (somecallback) somecallback();
			clearInterval(timer);
			timer = undefined;
		}
	}, 16);

	return timer;
}
