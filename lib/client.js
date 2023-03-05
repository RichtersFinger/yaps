class client {
	constructor(someID, somesocketID, somename) {
		// persistent internal identifier for clients
		this.clientID = someID;
		// current socket id (changes on page reload etc.)
		this.socketID = somesocketID;

		this.loggedIn = false;

		this.name = "";
		if (somename) {
			this.name = somename;
		}
		this.colorID = 0;
	}
	setName (somename) {
		this.name = somename;
	}
	login(){this.loggedIn = true;}
	logout(){this.loggedIn = false;}
}
module.exports = client;
