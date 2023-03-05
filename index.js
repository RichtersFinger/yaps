const version = "0.1";


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

app.get('/', function(req, res){
  res.sendFile(__dirname + '/html/lobby.html');
});

app.use("/img", express.static('img'));
app.use("/lib", express.static('lib'));
app.use("/sfx", express.static('sfx'));
//app.use('/favicon.ico', express.static('img/_server_/logo.ico'));

// load additional modules
const rng = require('./lib/rng.js');
const somerng = new rng;
const client = require('./lib/client.js');

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
		if (clients[previousname]) {
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
		if (thisClient) {
			if (thisClient.socketID === userID) {
	    	console.log("user", thisClient.clientID, " left");
				if (thisClient.currentgameid !== "") {
					if (sessions[thisClient.currentgameid]) {
						sessions[thisClient.currentgameid].currentplayers--;
						console.log('> ' + thisClient.currentgameid + ': ' + sessions[thisClient.currentgameid].currentplayers + '/' + sessions[thisClient.currentgameid].maxplayers);
					}
				}
				thisClient.logout();
			}
		}
	});
	// client wants to update displayed name
	const nMaximumCharacters = 20;
	socket.on('myNameIs', function(newDisplayedName){
		if (thisClient && newDisplayedName) {
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
		if (thisClient && newColorID != null) {
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
	const nMaximumPiecesPerDirection = 50;
	const nMaximumRetriesFindingID = 5;
	const nMaximumPlayers = 20;
	socket.on('iWantToStartNewSession', function(some_session_object) {
		/*iosocket.emit('iWantToStartNewSession', {"name": div_lobby_content_newgame_settings_name.value,
																					 "bpassphrase": div_lobby_content_newgame_settings_passphrase_check.checked,
																					 "passphrase": div_lobby_content_newgame_settings_passphrase.value,
																					 "layout": [parseInt(div_lobby_content_newgame_settings_layout1.value), parseInt(div_lobby_content_newgame_settings_layout2.value)],
																					 "motive": puzzlemotive});*/
		// test if all input is valid and insert into server-side object
		var new_session_object = {};
		new_session_object.name = some_session_object.name.replace(/<|>|&|;|#/g, "");
		if (new_session_object.name.length > nMaximumCharactersSession) {
			new_session_object.name = new_session_object.name.substr(0, nMaximumCharactersSession);
		}
		new_session_object.bpassphrase = some_session_object.bpassphrase;
		new_session_object.passphrase = some_session_object.passphrase;
		var num1 = 1, num2 = 1;
		if (some_session_object.layout.length === 2) {
			if (Number.isInteger(some_session_object.layout[0])) {
				if (some_session_object.layout[0] >= 1 && some_session_object.layout[0] <= nMaximumPiecesPerDirection) {
					num1 = some_session_object.layout[0];
				} else {
					num1 = 10;
				}
			} else {
				num1 = 10;
			}
			if (Number.isInteger(some_session_object.layout[1])) {
				if (some_session_object.layout[1] >= 1 && some_session_object.layout[1] <= nMaximumPiecesPerDirection) {
					num2 = some_session_object.layout[1];
				} else {
					num2 = 10;
				}
			} else {
				num2 = 10;
			}
		} else {
			num1 = 10;
			num2 = 10;
		}
		new_session_object.layout = [num1, num2];
		new_session_object.currentpieces = 0;
		new_session_object.totalpieces = num1*num2;
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

		if (some_session_object.motive.substr(0, 10) === "data:image") {
			new_session_object.motive = some_session_object.motive;
		} else {
			socket.emit('alert', "The received data is no valid image file.");
			return;
		}
		// make internal session id with up to 5 retries.. (this setup should prevent the creation of many "identical" sessions)
		var sessionid;
		var foundValidID = false;
		for (var i = 0; i < nMaximumRetriesFindingID; i++) {
			sessionid = gethash(new_session_object.name + new_session_object.motive + i);
			if (!sessions[sessionid]) {
				foundValidID = true;
				break;
			}
		}
		if (foundValidID) {
			console.log('new session with ID ' + sessionid + ' registered by ' + thisClient.clientID);
			// add some more info to session object
			new_session_object.id = sessionid;
			new_session_object.currentHost = thisClient.clientID;
			sessions[sessionid] = new_session_object;

			sessions[sessionid].currentplayers = 1;
			thisClient.currentgameid = sessions[sessionid].id;
			sessions[sessionid].players = [];
			sessions[sessionid].players[0] = thisClient.clientID;
			socket.emit('enterThisSession', {"sessionid": sessions[sessionid].id,
																			 "motive": sessions[sessionid].motive});
			console.log('> ' + sessionid + ': ' + sessions[sessionid].currentplayers + '/' + sessions[sessionid].maxplayers);
		} else {
			socket.emit('alert', "something went wrong during session creation; maybe game already exists?");
		}
	});
	// handle client request to enter specific session
	socket.on('iWantToEnterSession', function(some_session_id) {
		if (sessions[some_session_id]) {
			if (sessions[some_session_id].currentplayers < sessions[some_session_id].maxplayers) {
				sessions[some_session_id].currentplayers++;
				thisClient.currentgameid = sessions[some_session_id].id;
				socket.emit('enterThisSession', {"sessionid": sessions[some_session_id].id,
																				 "motive": sessions[some_session_id].motive});
				console.log('> ' + some_session_id + ': ' + sessions[some_session_id].currentplayers + '/' + sessions[some_session_id].maxplayers);
			} else {
					socket.emit('alert', "This session is full.");
			}
		} else {
					socket.emit('alert', "This session does not exist (anymore).");
		}
	});
});

// start listening for clients
server.listen(port, function(){
	console.log("Listening on port " +  port);
});

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
