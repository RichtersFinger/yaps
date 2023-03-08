const version = "0.3";


// load and setup prerequisites
var express = require('express');
var app = express();
var http = require('http');
var server = require('http').Server(app);
var io = require('socket.io')(server, {
	  pingInterval: 25000,
	  pingTimeout: 60000,
	  // > 800KB for standard maxHttpBufferSize: 1e6
	  // > 32MB for maxHttpBufferSize: 4e7 in socket.io
	  maxHttpBufferSize: 4e7
  });
const fs = require('fs');
const path = require("path");
const tmpdir = "tmp";
// prepare/cleanup temporary directory (used to store uploaded puzzle motive images)
if (!fs.existsSync(tmpdir)){
    fs.mkdirSync(tmpdir);
} else {
	fs.readdir(tmpdir, (err, files) => {
	  if (err) {
			console.log("unable to read '" + tmpdir + "/', no cleanup done");
		} else {
			for (const file of files) {
				fs.unlink(path.join(tmpdir, file), (err) => {
					if (err) {
						console.log("unable to delete '" + path.join(tmpdir, file) + "'");
					}
				});
			}
		}
	});
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/html/lobby.html');
});

app.use("/img", express.static('img'));
app.use("/lib", express.static('lib'));
app.use("/sfx", express.static('sfx'));
app.use("/tmp", express.static('tmp')); // tmp-directory contains the individual session's puzzle motives

//app.use('/favicon.ico', express.static('img/_server_/logo.ico'));

// load additional modules
const rng = require('./lib/rng.js');
const thisrng = new rng;
thisrng.seed(Date.now());
const client = require('./lib/client.js');
const puzzlepiece = require('./lib/puzzlepiece_server.js');
const puzzle = require('./lib/puzzle_server.js');

var clients = {};
const nMaximumCharactersSessionName = 20;
const nMaximumCharactersSessionPassphrase = 20;
var sessions = {};

// ask for ip & define port:
const publicipAPI = 'api.ipify.org';
const port = 8080;
var serverip = 0;
http.get({'host': publicipAPI, 'port': 80, 'path': '/'}, function(resp) {
  resp.on('data', function(ip) {
    serverip = ip;
		console.log("public adress " + serverip + ":" + port);
  });
}).on('error', function(err) {
	console.log("public IP address API unavailable.. maybe check url definition 'publicipAPI' in file 'index.js'");
});

var welcome = io.of('/welcome');
welcome.on('connection', function (socket) {
	var userID = socket.id; // user/client identifier for communication
	var thisClient;

	// client says they visited before
	socket.on('iamaknownclient', function (previousname) {
		if (typeof(previousname) === 'string') {
			if (typeof(clients[previousname]) !== 'undefined') {
				if (clients[previousname].loggedIn) {
					// register as new client anyway
					clients[userID] = new client(userID, userID);
					thisClient = clients[userID];
					console.log("registered new client", userID);
					socket.emit('newClientID', userID);
					thisClient.login();
				} else {
					// make association to existing entry
					console.log(previousname + ": reconnecting existing client");
					console.log("updating socketID from", clients[previousname].socketID, " to", userID);
					clients[previousname].socketID = userID;
					thisClient = clients[previousname];
					thisClient.login();
				}
			} else {
				// register as new client anyway
				clients[userID] = new client(userID, userID);
				thisClient = clients[userID];
				console.log("registered new client", userID);
				socket.emit('newClientID', userID);
				thisClient.login();
			}
		}
	});
	// client says they are new
	socket.on('iamanewclient', function () {
		socket.emit('newClientID', userID);
		clients[userID] = new client(userID, userID);
		thisClient = clients[userID];
		console.log("registered new client", userID);
		thisClient.login();
	});
	// logout client if they exist and are associated with the most recent socket id
	socket.on('disconnect', function(){
		if (typeof(thisClient) === 'undefined') {
			return;
		}
		if (thisClient.socketID === userID) {
    	console.log("user", thisClient.clientID, " left");
			if (thisClient.currentgameid !== "") {
				if (sessions[thisClient.currentgameid]) {
					sessions[thisClient.currentgameid].currentplayers--;
					console.log('> ' + thisClient.currentgameid + ': ' + sessions[thisClient.currentgameid].currentplayers + '/' + sessions[thisClient.currentgameid].maxplayers);
					thisClient.currentgameid = "";
				}
			}
			thisClient.logout();
		}
	});
	// client wants to update displayed name
	const nMaximumCharacters = 20;
	socket.on('myNameIs', function(newDisplayedName){
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			return;
		}
		if (typeof(newDisplayedName) === 'string') {
			// check whether chosen name too long
			if (newDisplayedName.length > nMaximumCharacters) {
				thisClient.name = newDisplayedName.substr(0, nMaximumCharacters);
			} else {
				thisClient.name = newDisplayedName;
			}
			// remove unwanted characters
			thisClient.name = thisClient.name.replace(/<|>|&|;|#/g, "");
			// report back actual name
			socket.emit('yourNameIs', thisClient.name);
		}
	});
	// client wants to update their color
	const nColorSelection = 18;
	socket.on('myColorIs', function(newColorID){
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			return;
		}
		if (typeof(newColorID) === 'number') {
			// check whether a valid number has been submitted
			if (Number.isInteger(newColorID)) {
				if (newColorID >= 0 && newColorID < nColorSelection) {
					thisClient.colorID = newColorID;
				} else {
					thisClient.colorID = 0;
				}
				// report back actual newColorID
				socket.emit('yourColorIs', thisClient.colorID);
			}
		}
	});
	// client requests a current list of sessions
	socket.on('iNeedANewList', function(){
		var reducedListOfSessions = [];
		var i = 0;
		for (const session in sessions) {
			reducedListOfSessions[i++] = {"sessionid": sessions[session].id,
			                            "name": sessions[session].name,
			                            "currentplayers": sessions[session].currentplayers,
			                            "maxplayers": sessions[session].maxplayers,
			                            "currentpieces": sessions[session].currentpieces,
			                            "totalpieces": sessions[session].totalpieces,
			                            "bpassphrase": sessions[session].bpassphrase};
		}
		socket.emit('currentListOfSessions', reducedListOfSessions);
	});
	// client requests to create a new session
	const nMaximumCharactersSession = 20;
	const nMaximumPiecesPerDirection = 50, nMinimumPiecesLongDirection = 5, nMinimumPiecesShortDirection = 3;
	const nMaximumRetriesFindingID = 5;
	const nMaximumPlayers = 20;
	socket.on('iWantToStartNewSession', function(some_session_object) {
		// check existence and types of entries in some_session_object
		var validinputtypes = true;
		if (typeof(some_session_object) !== 'object') {
			validinputtypes = false;
		} else {
			if (!("name" in some_session_object)
				  || !("bpassphrase" in some_session_object)
				  || !("passphrase" in some_session_object)
				  || !("piecesperlength" in some_session_object)
				  || !("maxplayers" in some_session_object)
				  || !("motive" in some_session_object)
				  || !("motive_res" in some_session_object)) {
				validinputtypes = false;
			} else {
				if (typeof(some_session_object.name) !== 'string'
				    || typeof(some_session_object.bpassphrase) !== 'boolean'
				    || typeof(some_session_object.passphrase) !== 'string'
				    || typeof(some_session_object.piecesperlength) !== 'number'
				    || typeof(some_session_object.maxplayers) !== 'number'
				    || typeof(some_session_object.motive) !== 'string'
				    || typeof(some_session_object.motive_res) !== 'object') {
					validinputtypes = false;
				} else {
					if (typeof(some_session_object.motive_res[0]) !== 'number' || typeof(some_session_object.motive_res[1]) !== 'number') {
						validinputtypes = false;
					}
				}
			}
		}
		if (!validinputtypes) {
			socket.emit('alert', 'bad input');
			return;
		}
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			return;
		}

		var new_session_object = {};
		// make internal session id with up to 5 retries.. (this setup should prevent the creation of many "identical" sessions)
		var sessionid;
		var foundValidID = false;
		for (var i = 0; i < nMaximumRetriesFindingID; i++) {
			sessionid = gethash(some_session_object.name + some_session_object.motive + i);
			if (typeof(sessions[sessionid]) === 'undefined') {
				foundValidID = true;
				break;
			}
		}
		if (!foundValidID) {
			socket.emit('alert', "something went wrong during session creation; maybe game already exists?");
			return;
		}
		console.log('new session with ID ' + sessionid + ' requested by ' + thisClient.clientID);
		// test if all input is valid and insert into server-side object
		new_session_object.name = some_session_object.name.replace(/<|>|&|;|#/g, "");
		if (new_session_object.name.length > nMaximumCharactersSession) {
			new_session_object.name = new_session_object.name.substr(0, nMaximumCharactersSession);
		}
		new_session_object.bpassphrase = some_session_object.bpassphrase;
		new_session_object.passphrase = some_session_object.passphrase;
		if (Number.isInteger(some_session_object.piecesperlength)) {
			if (some_session_object.piecesperlength >= nMinimumPiecesLongDirection && some_session_object.piecesperlength <= nMaximumPiecesPerDirection) {
				new_session_object.piecesperlength = some_session_object.piecesperlength;
			} else {
				socket.emit('alert', "Number of pieces in long edge out of range.");
				return;
			}
		} else {
			socket.emit('alert', "Invalid setting for number of pieces in long edge.");
			return;
		}

		var maxplayers = 1;
		if (Number.isInteger(some_session_object.maxplayers)) {
			if (some_session_object.maxplayers >= 1 && some_session_object.maxplayers <= nMaximumPlayers) {
				maxplayers = some_session_object.maxplayers;
			} else {
				maxplayers = 10;
			}
		} else {
			maxplayers = 10;
		}
		new_session_object.currentplayers = 0;
		new_session_object.maxplayers = maxplayers;

		// check if valid motive data; write to file
		// filepath = "tmp/" + filename + "." + image.substring(image.indexOf('/') + 1, image.indexOf(';base64'));
		if (some_session_object.motive.substr(0, 10) === "data:image") {
			// as url
			var filepath = "tmp/motive_" + sessionid; // + "." + some_session_object.motive.substring(some_session_object.motive.indexOf('/') + 1, some_session_object.motive.indexOf(';base64'));
			var saveimage_response = saveimagetofile(some_session_object.motive, filepath);
			if (saveimage_response.success) {
				new_session_object.motive = filepath;
				// also save as data-string
				new_session_object.motive_base64 = some_session_object.motive;
				if (Number.isInteger(some_session_object.motive_res[0]) && Number.isInteger(some_session_object.motive_res[1])) {
					new_session_object.layout = [];
					// use longer edge of image for piecesperlength setting
					// also temporarily store appropriate puzzledimensions in new_session_object; later: puzzle.dimensions
					if (some_session_object.motive_res[1] > some_session_object.motive_res[0]) {
						new_session_object.layout[1] = new_session_object.piecesperlength;
						new_session_object.layout[0] = Math.floor(0.5 + some_session_object.motive_res[0]/some_session_object.motive_res[1]*new_session_object.piecesperlength);
						new_session_object.puzzledimensions = [some_session_object.motive_res[0]/some_session_object.motive_res[1], 1.0];
					} else {
						new_session_object.layout[0] = new_session_object.piecesperlength;
						new_session_object.layout[1] = Math.floor(0.5 + some_session_object.motive_res[1]/some_session_object.motive_res[0]*new_session_object.piecesperlength);
						new_session_object.puzzledimensions = [1.0, some_session_object.motive_res[1]/some_session_object.motive_res[0]];
					}
					// check whether resulting puzzle resolution is fine
					if (Math.min(new_session_object.layout[0], new_session_object.layout[1]) < nMinimumPiecesShortDirection) {
							socket.emit('alert', "Requested puzzle resolution too small (" + new_session_object.layout[0] + ", " + new_session_object.layout[1] + ").");
							return;
					}
					// layout is okay > set total number of pieces
					new_session_object.currentpieces = 0;
					new_session_object.totalpieces = new_session_object.layout[0]*new_session_object.layout[1];

					if (some_session_object.motive_res[0] > 5*new_session_object.layout[0] && some_session_object.motive_res[1] > 5*new_session_object.layout[1]) {
						new_session_object.motive_res = [];
						new_session_object.motive_res[0] = some_session_object.motive_res[0];
						new_session_object.motive_res[1] = some_session_object.motive_res[1];
					} else {
						socket.emit('alert', "Image resolution insufficient for given layout.");
						return;
					}
				} else {
					socket.emit('alert', "Bad info on image resolution.");
					return;
				}
			} else {
				socket.emit('alert', "Error when reading image file.");
				return;
			}
		} else {
			socket.emit('alert', "The received data is no valid image file.");
			return;
		}


		// everything seems fine; initialize puzzle object
		new_session_object.puzzle = new puzzle(sessionid, new_session_object.layout, new_session_object.puzzledimensions, Math.floor(10000 * thisrng.get()), {}, new_session_object.motive, puzzlepiece);
		// dimxy, lxy

		// add some more info to session object
		new_session_object.id = sessionid;
		new_session_object.currentHost = thisClient.clientID;
		sessions[sessionid] = new_session_object;

		sessions[sessionid].currentplayers = 1;
		thisClient.currentgameid = sessions[sessionid].id;
		sessions[sessionid].players = [];
		sessions[sessionid].players[0] = thisClient.clientID;
		// signal host to enter game
		socket.emit('enterThisSession', getfullsessionobject(sessionid));
		console.log('> ' + sessionid + ': ' + sessions[sessionid].currentplayers + '/' + sessions[sessionid].maxplayers);
	});
	// handle client request to enter specific session
	socket.on('iWantToEnterSession', function(some_session_id) {
		// deny if not registered yet
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			return;
		}
		// check if session id valid and this session exists
		if (typeof(some_session_id) === 'string') {
			if (typeof(sessions[some_session_id]) !== 'undefined') {
				// is session full?
				if (sessions[some_session_id].currentplayers < sessions[some_session_id].maxplayers) {
					// send info to client
					sessions[some_session_id].currentplayers++;
					thisClient.currentgameid = sessions[some_session_id].id;
					socket.emit('enterThisSession', getfullsessionobject(some_session_id));
					console.log('> ' + some_session_id + ': ' + sessions[some_session_id].currentplayers + '/' + sessions[some_session_id].maxplayers);
				} else {
					socket.emit('alert', "This session is full.");
				}
			} else {
				socket.emit('alert', "This session does not exist (anymore).");
			}
		}
	});
});

// start listening for clients
server.listen(port, function(){
	console.log("Listening on port " +  port);
});

// format full client-side info on session/puzzle into object
function getfullsessionobject(someSessionID) {
	var somesession = {};
	var somepuzzle = {};
	somesession["id"] = someSessionID;
	somesession["puzzle"] = somepuzzle;
	somepuzzle["layout"] = sessions[someSessionID].puzzle.layout;
	somepuzzle["dimensions"] = sessions[someSessionID].puzzle.dimensions;
	somepuzzle["seed"] = sessions[someSessionID].puzzle.seed;
	somepuzzle["style"] = sessions[someSessionID].puzzle.style;
	somepuzzle["motive"] = sessions[someSessionID].puzzle.motive;
	var pieces = [];
	for (var i = 0; i < somepuzzle.layout[0]; i++) {
		pieces[i] = [];
		for (var j = 0; j < somepuzzle.layout[1]; j++) {
			pieces[i][j] = {};
			pieces[i][j]["x"] = sessions[someSessionID].puzzle.pieces[i][j].x;
			pieces[i][j]["y"] = sessions[someSessionID].puzzle.pieces[i][j].y;
			pieces[i][j]["angle"] = sessions[someSessionID].puzzle.pieces[i][j].angle;
			pieces[i][j]["connections"] = sessions[someSessionID].puzzle.pieces[i][j].connections;
		// this is done client-side via puzzle seed
		//	pieces[i][j]["w"] = sessions[someSessionID].puzzle.pieces[i][j].w;
		//	pieces[i][j]["h"] = sessions[someSessionID].puzzle.pieces[i][j].h;
		}
	}
	somepuzzle["pieces"] = pieces;
	return somesession;
}

// encode base64-image, save to file
function saveimagetofile(image, filepath) {
	var bitmap = Buffer.from(/base64,(.+)/.exec(image)[1], 'base64');
	// try to save
	try {
		fs.writeFileSync(filepath, bitmap);
		return {"success": true, "buffer": bitmap};
	} catch(err) {
		console.log('some error occured when trying to save base64 to file', err);
		return {"success": false, "buffer": bitmap};
	}
}

// calculating hash value for images
function gethash(input) {
	var hash = 0;
	if (input.length === 0) {
		return Math.abs(hash).toString(16);
	}
	for (var i = 0; i < input.length; i++) {
		var character = input.charCodeAt(i);
		hash = ((hash<<5)-hash)+character;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(16);
}
