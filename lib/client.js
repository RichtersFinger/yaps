class client {
	constructor(someID, somesocketID, somename) {
		// persistent internal identifier for clients
		this.clientID = someID;
		// current socket id (changes on page reload etc.)
		this.socketID = somesocketID;

		this.loggedIn = false;

		this.currentgameid = "";

		this.name = "";
		if (typeof(somename) === 'string') {
			this.name = somename;
		}
		this.colorID = 0;

		// variable to track what puzzle piece player is holding (if any)
		this.holdsPiece = undefined;
	}
	setName (somename) {
		this.name = somename;
	}
	login(){this.loggedIn = true;}
	logout(){this.loggedIn = false;}
}
module.exports = client;
