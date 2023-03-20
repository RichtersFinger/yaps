const version = "0.9.10.1";

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
// prepare/cleanup temporary directory (used to store uploaded puzzle motif images)
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
app.use("/tmp", express.static('tmp')); // tmp-directory contains the individual session's puzzle motifs

app.use('/favicon.ico', express.static('img/icons/favicon.ico'));

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
http.get({'host': publicipAPI, 'port': 80, 'path': '/', 'timeout': 5000}, function(resp) {
  resp.on('data', function(ip) {
    serverip = ip;
		console.log("public adress " + serverip + ":" + port);
  });
}).on('error', function(err) {
	console.log("public IP address API unavailable.. maybe check url definition 'publicipAPI' in file 'index.js'");
}).on('timeout', function(err) {
	console.log("(public ip) " + publicipAPI + " takes unusually long to answer..");
});

io.on('connection', function (socket) {
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
					console.log("updating socketID from", clients[previousname].socketID, "to", userID, "(" + clients[previousname].name + ")");
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
		for (const session in sessions) {
			reducedListOfSessions.push({"sessionid": sessions[session].id,
			                            "name": sessions[session].name,
			                            "currentplayers": sessions[session].currentplayers,
			                            "maxplayers": sessions[session].maxplayers,
			                            "currentconnections": sessions[session].currentconnections,
			                            "totalconnections": sessions[session].totalconnections,
			                            "difficulty": sessions[session].difficulty,
			                            "bpassphrase": sessions[session].bpassphrase,
			                            "userotation": sessions[session].userotation});
		}
		socket.emit('currentListOfSessions', reducedListOfSessions);
	});
	// client requests to create a new session
	const nMaximumCharactersSession = 20;
	const nMaximumPiecesPerDirection = 50, nMinimumPiecesLongDirection = 5, nMinimumPiecesShortDirection = 3;
	const nMaximumRetriesFindingID = 5;
	const nMaximumPlayers = 20;
	const nDifficultySettings = 4;
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
				  || !("difficulty" in some_session_object)
				  || !("userotation" in some_session_object)
				  || !("competitive" in some_session_object)
				  || !("motif" in some_session_object)
				  || !("motif_res" in some_session_object)) {
				validinputtypes = false;
			} else {
				if (typeof(some_session_object.name) !== 'string'
				    || typeof(some_session_object.bpassphrase) !== 'boolean'
				    || typeof(some_session_object.passphrase) !== 'string'
				    || typeof(some_session_object.piecesperlength) !== 'number'
				    || typeof(some_session_object.maxplayers) !== 'number'
				    || typeof(some_session_object.difficulty) !== 'number'
						|| typeof(some_session_object.userotation) !== 'boolean'
						|| typeof(some_session_object.competitive) !== 'boolean'
				    || typeof(some_session_object.motif) !== 'string'
				    || typeof(some_session_object.motif_res) !== 'object') {
					validinputtypes = false;
				} else {
					if (typeof(some_session_object.motif_res[0]) !== 'number' || typeof(some_session_object.motif_res[1]) !== 'number') {
						validinputtypes = false;
					}
				}
			}
		}
		if (!validinputtypes) {
			socket.emit('alert', 'bad input');
			socket.emit('releaseBlockedInterface');
			return;
		}
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			socket.emit('releaseBlockedInterface');
			return;
		}
		if (thisClient.name === "") {
			socket.emit('alert', 'Please enter a name first.');
			socket.emit('releaseBlockedInterface');
			return;
		}

		var new_session_object = {};
		// make internal session id with up to 5 retries.. (this setup should prevent the creation of many "identical" sessions)
		var sessionid;
		var foundValidID = false;
		for (var i = 0; i < nMaximumRetriesFindingID; i++) {
			sessionid = gethash(some_session_object.name + some_session_object.motif + i);
			if (typeof(sessions[sessionid]) === 'undefined') {
				foundValidID = true;
				break;
			}
		}
		if (!foundValidID) {
			socket.emit('alert', "something went wrong during session creation; maybe game already exists?");
			socket.emit('releaseBlockedInterface');
			return;
		}
		console.log('new session with ID ' + sessionid + ' requested by ' + thisClient.clientID);
		// test if all input is valid and insert into server-side object
		// check on validity of session name & passphrase
		new_session_object.name = some_session_object.name.replace(/<|>|&|;|#/g, "");
		if (new_session_object.name.length > nMaximumCharactersSession) {
			new_session_object.name = new_session_object.name.substr(0, nMaximumCharactersSession);
		}
		new_session_object.bpassphrase = some_session_object.bpassphrase;
		new_session_object.passphrase = some_session_object.passphrase;

		// check on validity of puzzle resolution input
		if (Number.isInteger(some_session_object.piecesperlength)) {
			if (some_session_object.piecesperlength >= nMinimumPiecesLongDirection && some_session_object.piecesperlength <= nMaximumPiecesPerDirection) {
				new_session_object.piecesperlength = some_session_object.piecesperlength;
			} else {
				socket.emit('alert', "Number of pieces in long edge out of range.");
				socket.emit('releaseBlockedInterface');
				return;
			}
		} else {
			socket.emit('alert', "Invalid setting for number of pieces in long edge.");
			socket.emit('releaseBlockedInterface');
			return;
		}

		// check on validity of maxplayer input
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

		// check on validity of difficulty input
		var difficulty = 0;
		if (Number.isInteger(some_session_object.difficulty)) {
			if (some_session_object.difficulty >= 0 && some_session_object.difficulty < nDifficultySettings) {
				difficulty = some_session_object.difficulty;
			} else {
				difficulty = 0;
			}
		} else {
			difficulty = 0;
		}
		new_session_object.difficulty = difficulty;
		var style = {"edges": "regular"};
		if (new_session_object.difficulty === 3) {
			style.edges = "flat_irregular";
		}

		new_session_object.userotation = some_session_object.userotation;
		new_session_object.competitive = some_session_object.competitive;

		// check if valid motif data; write to file
		// filepath = "tmp/" + filename + "." + image.substring(image.indexOf('/') + 1, image.indexOf(';base64'));
		if (some_session_object.motif.substr(0, 10) === "data:image") {
			// as url
			var filepath = "tmp/motif_" + sessionid; // + "." + some_session_object.motif.substring(some_session_object.motif.indexOf('/') + 1, some_session_object.motif.indexOf(';base64'));
			var saveimage_response = saveimagetofile(some_session_object.motif, filepath);
			if (saveimage_response.success) {
				new_session_object.motif = filepath;
				// also save as data-string
				new_session_object.motif_base64 = some_session_object.motif;
				if (Number.isInteger(some_session_object.motif_res[0]) && Number.isInteger(some_session_object.motif_res[1])) {
					new_session_object.layout = [];
					// use longer edge of image for piecesperlength setting
					// also temporarily store appropriate puzzledimensions in new_session_object; later: puzzle.dimensions
					if (some_session_object.motif_res[1] > some_session_object.motif_res[0]) {
						new_session_object.layout[1] = new_session_object.piecesperlength;
						new_session_object.layout[0] = Math.floor(0.5 + some_session_object.motif_res[0]/some_session_object.motif_res[1]*new_session_object.piecesperlength);
						new_session_object.puzzledimensions = [some_session_object.motif_res[0]/some_session_object.motif_res[1], 1.0];
					} else {
						new_session_object.layout[0] = new_session_object.piecesperlength;
						new_session_object.layout[1] = Math.floor(0.5 + some_session_object.motif_res[1]/some_session_object.motif_res[0]*new_session_object.piecesperlength);
						new_session_object.puzzledimensions = [1.0, some_session_object.motif_res[1]/some_session_object.motif_res[0]];
					}
					const game_boundary_baserange = 2.0;
		      new_session_object.game_boundary_left = 0.5 - new_session_object.puzzledimensions[0] * game_boundary_baserange;
		      new_session_object.game_boundary_right = 0.5 + new_session_object.puzzledimensions[0] * game_boundary_baserange;
		      new_session_object.game_boundary_top = 0.5 - new_session_object.puzzledimensions[1] * game_boundary_baserange;
		      new_session_object.game_boundary_bottom = 0.5 + new_session_object.puzzledimensions[1] * game_boundary_baserange;
					// check whether resulting puzzle resolution is fine
					if (Math.min(new_session_object.layout[0], new_session_object.layout[1]) < nMinimumPiecesShortDirection) {
							socket.emit('alert', "Requested puzzle resolution too small (" + new_session_object.layout[0] + ", " + new_session_object.layout[1] + ").");
							socket.emit('releaseBlockedInterface');
							return;
					}

					if (some_session_object.motif_res[0] > 5*new_session_object.layout[0] && some_session_object.motif_res[1] > 5*new_session_object.layout[1]) {
						new_session_object.motif_res = [];
						new_session_object.motif_res[0] = some_session_object.motif_res[0];
						new_session_object.motif_res[1] = some_session_object.motif_res[1];
					} else {
						socket.emit('alert', "Image resolution insufficient for given layout.");
						socket.emit('releaseBlockedInterface');
						return;
					}
				} else {
					socket.emit('alert', "Bad info on image resolution.");
					socket.emit('releaseBlockedInterface');
					return;
				}
			} else {
				socket.emit('alert', "Error when reading image file.");
				socket.emit('releaseBlockedInterface');
				return;
			}
		} else {
			socket.emit('alert', "The received data is no valid image file.");
			socket.emit('releaseBlockedInterface');
			return;
		}


		// everything seems fine; initialize puzzle object
		new_session_object.puzzle = new puzzle(sessionid, new_session_object.layout, new_session_object.puzzledimensions, Math.floor(10000 * thisrng.get()), style, new_session_object.motif, puzzlepiece);
		new_session_object.puzzle.make_puzzlepiece_tiling(new_session_object.difficulty, thisrng);

		// set total number of connections
		new_session_object.currentconnections = 0;
		new_session_object.totalconnections = new_session_object.puzzle.totaledges;

		// distribute tiles over game div; for now only fixed setting..
	//	new_session_object.puzzle.distribute_pieces('completed', thisrng);
		new_session_object.puzzle.distribute_pieces('randomized_position', thisrng);
		if (new_session_object.userotation) {
			new_session_object.puzzle.distribute_angles(thisrng);
		}
		// make sure nothing got placed badly
		for (var i = 0; i < new_session_object.puzzle.layout[0]; i++) {
			for (var j = 0; j < new_session_object.puzzle.layout[1]; j++) {
				enforce_game_boundary(new_session_object, new_session_object.puzzle.pieces[i][j]);
			}
		}

		// add some more info to session object
		new_session_object.id = sessionid;
		new_session_object.currentHost = thisClient.clientID;
		new_session_object.playerToBeKicked = undefined;
		new_session_object.kickedPlayers = [];
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
	socket.on('iWantToEnterSession', function(some_session_id, some_passphrase) {
		// deny if not registered yet
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			socket.emit('releaseBlockedInterface');
			return;
		}
		if (thisClient.name === "") {
			socket.emit('alert', 'Please enter a name first.');
			socket.emit('releaseBlockedInterface');
			return;
		}
		// note: check and handle player still being registered in different game..
		if (thisClient.currentgameid !== "") {
			// ...
		}
		// check if session id valid and this session exists
		if (typeof(some_session_id) === 'string') {
			if (typeof(sessions[some_session_id]) !== 'undefined') {
				// prevent client from entering if already kicked from session
				if (sessions[some_session_id].kickedPlayers.includes(thisClient.clientID)) {
					socket.emit('alert', 'You have been kicked from that session.');
					socket.emit('releaseBlockedInterface');
					return;
				}
				// is session full?
				if (sessions[some_session_id].currentplayers < sessions[some_session_id].maxplayers) {
					// is passphrase necessary + correct
					if (sessions[some_session_id].bpassphrase) {
						if (typeof(some_passphrase) === 'undefined') {
							socket.emit('alert', 'No passphrase provided.');
							socket.emit('releaseBlockedInterface');
							return;
						} else {
							if (some_passphrase !== sessions[some_session_id].passphrase) {
								socket.emit('alert', 'Wrong passphrase.');
								socket.emit('releaseBlockedInterface');
								return;
							}
						}
					}
					// send info to client
					sessions[some_session_id].currentplayers++;
					thisClient.currentgameid = sessions[some_session_id].id;
					socket.emit('enterThisSession', getfullsessionobject(some_session_id));
					sessions[some_session_id].players.push(thisClient.clientID);
					console.log('> ' + some_session_id + ': ' + sessions[some_session_id].currentplayers + '/' + sessions[some_session_id].maxplayers);
					// make new host if necessary
					if (sessions[some_session_id].currentHost === "") {
						sessions[some_session_id].currentHost = thisClient.clientID;
						console.log('new host in ' + some_session_id + ': ' + sessions[some_session_id].currentHost + ' (' + thisClient.name + ')');
					}
					// update current list of players for everyone
					var currentStats = getCurrentListofPlayers(sessions[thisClient.currentgameid]);
					for (const client of sessions[thisClient.currentgameid].players) {
						io.to(clients[client].socketID).emit('currentStats', currentStats, sessions[thisClient.currentgameid].currentHost === client);
					}
				} else {
					socket.emit('alert', "This session is full.");
					socket.emit('releaseBlockedInterface');
				}
			} else {
				socket.emit('alert', "This session does not exist (anymore).");
				socket.emit('releaseBlockedInterface');
			}
		}
	});
	// handle client request to enter specific session
	socket.on('iNeedAnUpdate', function() {
		// deny if not registered yet
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'not logged in yet, try refreshing page');
			socket.emit('releaseBlockedInterface');
			return;
		}

		// check if session id valid and this session exists
		if (typeof(thisClient.currentgameid) === 'string') {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				for (var i = 0; i < sessions[thisClient.currentgameid].puzzle.layout[0]; i++) {
					for (var j = 0; j < sessions[thisClient.currentgameid].puzzle.layout[1]; j++) {
						piece = sessions[thisClient.currentgameid].puzzle.pieces[i][j];
						socket.emit('updatePieceCoordinates', piece.i, piece.j, piece.x, piece.y, piece.z, piece.angle);
					}
				}
				socket.emit('updatePuzzlePartitions', getClientSidePartitionObject(sessions[thisClient.currentgameid].puzzle));
			}
		}
	});

	// handle client request to pick up piece
	socket.on('iWantToPickUpPiece', function(i, j) {
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'Not logged in. Try reconnecting after refreshing page.');
			return;
		}
		// does the game exist?
		if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
			// is player part of that session?
			if (sessions[thisClient.currentgameid].players.includes(thisClient.clientID)) {
				// are tile indices valid?
				if (typeof(i) === 'number' && typeof(j) === 'number') {
					if (Number.isInteger(i) && Number.isInteger(j)) {
						if (i >= 0 && i < sessions[thisClient.currentgameid].puzzle.layout[0]
						    && j >= 0 && j < sessions[thisClient.currentgameid].puzzle.layout[1]) {
							// is tile not picked up by anyone yet?
							if (typeof(sessions[thisClient.currentgameid].puzzle.pieces[i][j].heldby) === 'undefined') {
								// does player already hold a piece? -> drop that first
								if (typeof(thisClient.holdsPiece) !== 'undefined') {
									if (typeof(thisClient.heldPieceTimeout) !== 'undefined') clearTimeout(thisClient.heldPieceTimeout);
									thisClient.heldPieceTimeout = undefined;
									socket.emit('stopMovingPiece', thisClient.holdsPiece.x, thisClient.holdsPiece.y, thisClient.holdsPiece.z, thisClient.holdsPiece.angle);

									// remove highlight of held piece
									for (const client of sessions[thisClient.currentgameid].players) {
										if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('unhighlightPiece', thisClient.holdsPiece.i, thisClient.holdsPiece.j);
									}
									thisClient.holdsPiece.heldby = undefined;
									thisClient.holdsPiece = undefined;
									// also revert claim on other tiles from same partition
									claimAllPiecesWithinPartition(sessions[thisClient.currentgameid], undefined, sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);
								}
								// claim this piece as held
								sessions[thisClient.currentgameid].puzzle.pieces[i][j].heldby = thisClient;
								thisClient.holdsPiece = sessions[thisClient.currentgameid].puzzle.pieces[i][j];
								// apply claim to all pieces in same partition
								claimAllPiecesWithinPartition(sessions[thisClient.currentgameid], thisClient, sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);
								dragPiecesToTop(sessions[thisClient.currentgameid], sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);

								// inform clients to highlight tile accordingly
								for (const client of sessions[thisClient.currentgameid].players) {
									if (typeof(clients[client]) !== 'undefined') {
										if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('highlightPiece', thisClient.holdsPiece.i, thisClient.holdsPiece.j, thisClient.colorID, thisClient.name);
										for (const piece of thisClient.holdsPiece.partition.pieces) {
											io.to(clients[client].socketID).emit('updatePieceCoordinates',
																																piece.i, piece.j, piece.x, piece.y, piece.z, piece.angle);
										}
									}
								}

								// timeout so that tile is dropped eventually automatically
								let clientwasholdingthis = thisClient.holdsPiece;
								thisClient.heldPieceTimeout = setTimeout(function() {
									if (typeof(thisClient) === 'undefined') return;
									if (typeof(thisClient.holdsPiece) === 'undefined') return;
									if (typeof(clientwasholdingthis) === 'undefined') return;
									if (typeof(sessions[thisClient.currentgameid]) === 'undefined') return;
									if (thisClient.holdsPiece.id === clientwasholdingthis.id) {
										socket.emit('stopMovingPiece', thisClient.holdsPiece.x, thisClient.holdsPiece.y, thisClient.holdsPiece.z, thisClient.holdsPiece.angle);

										for (const client of sessions[thisClient.currentgameid].players) {
											if (typeof(clients[client]) !== 'undefined') {
												for (const piece of thisClient.holdsPiece.partition.pieces) {
													io.to(clients[client].socketID).emit('updatePieceCoordinates',
													                                          piece.i, piece.j, piece.x, piece.y, piece.z, piece.angle);
												}
											}
											// remove highlight of held piece
											if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('unhighlightPiece', thisClient.holdsPiece.i, thisClient.holdsPiece.j);
										}
										thisClient.holdsPiece.heldby = undefined;
										thisClient.holdsPiece = undefined;
										// also revert claim on other tiles from same partition
										claimAllPiecesWithinPartition(sessions[thisClient.currentgameid], undefined, sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);
									}
								}, 20000);
								socket.emit('startMovingPiece', i, j, thisClient.holdsPiece.z);
							} else {
								socket.emit('stopMovingPiece', sessions[thisClient.currentgameid].puzzle.pieces[i][j].x, sessions[thisClient.currentgameid].puzzle.pieces[i][j].y, sessions[thisClient.currentgameid].puzzle.pieces[i][j].z, sessions[thisClient.currentgameid].puzzle.pieces[i][j].angle);
							}
						}
					}
				}
			}
		}
	});
	// handle client request to drop piece
	socket.on('iWantToDropPiece', function() {
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'Not logged in. Try reconnecting by refreshing page.');
			return;
		}
		// does the game exist?
		if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
			// is player part of that session?
			if (sessions[thisClient.currentgameid].players.includes(thisClient.clientID)) {
				if (typeof(thisClient.holdsPiece) !== 'undefined') {
					// release claim
					clearTimeout(thisClient.heldPieceTimeout);
					thisClient.heldPieceTimeout = undefined;
					socket.emit('stopMovingPiece', thisClient.holdsPiece.x, thisClient.holdsPiece.y, thisClient.holdsPiece.z, thisClient.holdsPiece.angle);
					var thisPiece = thisClient.holdsPiece;
					thisClient.holdsPiece.heldby = undefined;
					thisClient.holdsPiece = undefined;
					// also revert claim on other tiles from same partition
					claimAllPiecesWithinPartition(sessions[thisClient.currentgameid], undefined, thisPiece.partition);
					dragPiecesToTop(sessions[thisClient.currentgameid], thisPiece.partition);

					// check for new connection between pieces of this partition and others
					// to do this, first update current tile positions in held partition
					var cosangle = Math.cos(thisPiece.angle*Math.PI/2);
					var sinangle = Math.sin(thisPiece.angle*Math.PI/2);
					for (const piece of thisPiece.partition.pieces) {
						// get coordinates
						var deltax = (piece.x0[thisPiece.angle] - thisPiece.x0[thisPiece.angle]) * cosangle
												 - (piece.y0[thisPiece.angle] - thisPiece.y0[thisPiece.angle]) * sinangle;
						var deltay = (piece.x0[thisPiece.angle] - thisPiece.x0[thisPiece.angle]) * sinangle
												 + (piece.y0[thisPiece.angle] - thisPiece.y0[thisPiece.angle]) * cosangle;
						piece.x = thisPiece.x + deltax;
						piece.y = thisPiece.y + deltay;
						piece.angle = thisPiece.angle;
					}

					// partitionshavechanged counts the number of new connections
					var partitionshavechanged = 0;
					for (const piece of thisPiece.partition.pieces) {
						partitionshavechanged += sessions[thisClient.currentgameid].puzzle.checkNewConnections(piece);
					}

					// notify everyone about changes (if necessary)
					if (partitionshavechanged > 0) {
						// update scores
						if (sessions[thisClient.currentgameid].competitive) {
							thisClient.connectionCounter += partitionshavechanged;
							if (!(thisClient.currentgameid in thisClient.sessionConnectionCounter))
								thisClient.sessionConnectionCounter[thisClient.currentgameid] = partitionshavechanged;
							else
								thisClient.sessionConnectionCounter[thisClient.currentgameid] += partitionshavechanged;
							// update current list of players for everyone
							var currentStats = getCurrentListofPlayers(sessions[thisClient.currentgameid]);
							for (const client of sessions[thisClient.currentgameid].players) {
								io.to(clients[client].socketID).emit('currentStats', currentStats, sessions[thisClient.currentgameid].currentHost === client);
							}
						}


						enforce_game_boundary(sessions[thisClient.currentgameid], thisPiece);
						// adjust z-Index
						dragPiecesToTop(sessions[thisClient.currentgameid], thisPiece.partition);

						// send updated info to other players in this session
						var currentpartitions = getClientSidePartitionObject(sessions[thisClient.currentgameid].puzzle);
						for (const client of sessions[thisClient.currentgameid].players) {
							if (typeof(clients[client]) !== 'undefined') {
								// update piece coordinates
								for (const piece of thisPiece.partition.pieces) {
									io.to(clients[client].socketID).emit('updatePieceCoordinates',
									                                          piece.i, piece.j, piece.x, piece.y, piece.z, piece.angle);
								}

								// give player-held pieces priority by raising above that merged partition (since those are still held by players)
								if (typeof(clients[client].holdsPiece) !== 'undefined') {
									dragPiecesToTop(sessions[thisClient.currentgameid], clients[client].holdsPiece.partition);
									for (const piece of clients[client].holdsPiece.partition.pieces) {
										io.to(clients[client].socketID).emit('updatePieceCoordinates',
										                                          piece.i, piece.j, piece.x, piece.y, piece.z, piece.angle);
									}
								}

								// also submit new partition info
								io.to(clients[client].socketID).emit('updatePuzzlePartitions', currentpartitions);

								// also submit new progress
								sessions[thisClient.currentgameid].currentconnections = sessions[thisClient.currentgameid].puzzle.connectededges;
								io.to(clients[client].socketID).emit('updatePuzzleProgress', sessions[thisClient.currentgameid].currentconnections);

								// play sfx for all clients
								io.to(clients[client].socketID).emit('playSFX_combine', partitionshavechanged);
							}
						}
					} else {
						// only update piece positions in this partition
						for (const piece of thisPiece.partition.pieces) {
							// send info to clients
							for (const client of sessions[thisClient.currentgameid].players) {
								if (typeof(clients[client]) !== 'undefined') {
									io.to(clients[client].socketID).emit('updatePieceCoordinates',
									                                          piece.i, piece.j, piece.x, piece.y, piece.z, piece.angle);
								}
							}
						}
					}
					// remove highlight of held piece
					for (const client of sessions[thisClient.currentgameid].players) {
						if (typeof(clients[client]) !== 'undefined') {
							if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('unhighlightPiece', thisPiece.i, thisPiece.j);
						}
					}
				}
			}
		}
	});
	// handle client request to move piece
	socket.on('iWantToMoveMyPiece', function(x, y, angle) {
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'Not logged in. Try reconnecting by refreshing page.');
			return;
		}
		// does the game exist?
		if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
			// is player part of that session?
			if (sessions[thisClient.currentgameid].players.includes(thisClient.clientID)) {
				if (typeof(thisClient.holdsPiece) !== 'undefined') {
					// check types of input
					if (typeof(x) === 'number' && typeof(y) === 'number' && typeof(angle) === 'number') {
						if (Number.isInteger(angle)) {
							// update piece coordinates
							thisClient.holdsPiece.x = x;
							thisClient.holdsPiece.y = y;
							var inform_thisClient = false;
							// is this session with rotating tiles?
							if (sessions[thisClient.currentgameid].userotation) {
								inform_thisClient = angle !== thisClient.holdsPiece.angle;
								thisClient.holdsPiece.angle = (angle%4 + 4)%4;
							}
							enforce_game_boundary(sessions[thisClient.currentgameid], thisClient.holdsPiece);
							// note-: also update other tiles in the same partition
							// > not needed here if this update is performed on drop & on client side with 'updatePieceCoordinates'
							// send updated info to other players in this session
							for (const client of sessions[thisClient.currentgameid].players) {
								if (typeof(clients[client]) !== 'undefined' && (inform_thisClient || client !== thisClient.clientID)) {
									io.to(clients[client].socketID).emit('updatePieceCoordinates',
									                                          thisClient.holdsPiece.i, thisClient.holdsPiece.j, thisClient.holdsPiece.x, thisClient.holdsPiece.y, thisClient.holdsPiece.z, thisClient.holdsPiece.angle);
								}
							}
						}
					}
				}
			}
		}
	});
	// handle client request to turn piece/partition
	const brief_claim_duration = 500;
	socket.on('iWantToTurnAPiece', function(i, j, angle) {
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'Not logged in. Try reconnecting after refreshing page.');
			return;
		}
		// does the game exist?
		if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
			// is this session with rotating tiles?
			if (!sessions[thisClient.currentgameid].userotation) {
				return;
			}
			// is player part of that session?
			if (sessions[thisClient.currentgameid].players.includes(thisClient.clientID)) {
				// are tile indices valid?
				if (typeof(i) === 'number' && typeof(j) === 'number') {
					if (Number.isInteger(i) && Number.isInteger(j)) {
						if (i >= 0 && i < sessions[thisClient.currentgameid].puzzle.layout[0]
						    && j >= 0 && j < sessions[thisClient.currentgameid].puzzle.layout[1]) {
							// is tile not picked up by anyone yet?
							if (typeof(sessions[thisClient.currentgameid].puzzle.pieces[i][j].heldby) !== 'undefined') {
								if (sessions[thisClient.currentgameid].puzzle.pieces[i][j].heldby.clientID !== thisClient.clientID) {
									// decline only if other client has this claim
									return;
								}
								// if this is the same player, remove timeout
								if (typeof(thisClient.heldPieceTimeout) !== 'undefined') {
									clearTimeout(thisClient.heldPieceTimeout);
									thisClient.heldPieceTimeout = undefined;
									// inform clients to unhighlight tile and update coordinates accordingly
									for (const client of sessions[thisClient.currentgameid].players) {
										if (typeof(clients[client]) !== 'undefined') {
											if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('unhighlightPiece', thisClient.holdsPiece.i, thisClient.holdsPiece.j);
										}
									}
								}
							}
							// does player already hold a piece of a different partition? > ignore request.. should not be occurring
							if (typeof(thisClient.holdsPiece) !== 'undefined') {
								if (thisClient.holdsPiece.partition.id !== sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition.id) {
									return;
								}
							}
							// claim this piece as held
							sessions[thisClient.currentgameid].puzzle.pieces[i][j].heldby = thisClient;
							thisClient.holdsPiece = sessions[thisClient.currentgameid].puzzle.pieces[i][j];
							// apply claim to all pieces in same partition
							claimAllPiecesWithinPartition(sessions[thisClient.currentgameid], thisClient, sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);
							dragPiecesToTop(sessions[thisClient.currentgameid], sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);

							thisClient.holdsPiece.angle = (thisClient.holdsPiece.angle + 1)%4;
							enforce_game_boundary(sessions[thisClient.currentgameid], thisClient.holdsPiece);

							// inform clients to highlight tile and update coordinates accordingly
							for (const client of sessions[thisClient.currentgameid].players) {
								if (typeof(clients[client]) !== 'undefined') {
									if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('highlightPiece', thisClient.holdsPiece.i, thisClient.holdsPiece.j, thisClient.colorID, thisClient.name);
									io.to(clients[client].socketID).emit('updatePieceCoordinates',
																															thisClient.holdsPiece.i, thisClient.holdsPiece.j, thisClient.holdsPiece.x, thisClient.holdsPiece.y, thisClient.holdsPiece.z, thisClient.holdsPiece.angle);
								}
							}

							// apply this to other pieces of same partition
	            var cosangle = Math.cos(thisClient.holdsPiece.angle*Math.PI/2);
	            var sinangle = Math.sin(thisClient.holdsPiece.angle*Math.PI/2);
							for (const piece of thisClient.holdsPiece.partition.pieces) {
								// get coordinates
		            var deltax = (piece.x0[thisClient.holdsPiece.angle] - thisClient.holdsPiece.x0[thisClient.holdsPiece.angle]) * cosangle
								             - (piece.y0[thisClient.holdsPiece.angle] - thisClient.holdsPiece.y0[thisClient.holdsPiece.angle]) * sinangle;
		            var deltay = (piece.x0[thisClient.holdsPiece.angle] - thisClient.holdsPiece.x0[thisClient.holdsPiece.angle]) * sinangle
								             + (piece.y0[thisClient.holdsPiece.angle] - thisClient.holdsPiece.y0[thisClient.holdsPiece.angle]) * cosangle;
								piece.x = thisClient.holdsPiece.x + deltax;
								piece.y = thisClient.holdsPiece.y + deltay;
								piece.angle = thisClient.holdsPiece.angle;
							}


							// timeout so that tile is dropped automatically
							let clientwasholdingthis = thisClient.holdsPiece;
							thisClient.heldPieceTimeout = setTimeout(function() {
								if (typeof(thisClient) === 'undefined') return;
								if (typeof(thisClient.holdsPiece) === 'undefined') return;
								if (typeof(clientwasholdingthis) === 'undefined') return;
								if (typeof(sessions[thisClient.currentgameid]) === 'undefined') return;
								if (thisClient.holdsPiece.id === clientwasholdingthis.id) {
									for (const client of sessions[thisClient.currentgameid].players) {
										// remove highlight of held piece
										if (clients[client].clientID !== thisClient.clientID) io.to(clients[client].socketID).emit('unhighlightPiece', thisClient.holdsPiece.i, thisClient.holdsPiece.j);
									}
									thisClient.holdsPiece.heldby = undefined;
									thisClient.holdsPiece = undefined;
									// also revert claim on other tiles from same partition
									claimAllPiecesWithinPartition(sessions[thisClient.currentgameid], undefined, sessions[thisClient.currentgameid].puzzle.pieces[i][j].partition);
								}
							}, brief_claim_duration);
						}
					}
				}
			}
		}
	});
	// client requests a current list of sessions
	socket.on('iNeedCurrentStats', function(){
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			return;
		}
		// is client in a game?
		if (thisClient.currentgameid !== "") {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				var currentStats = getCurrentListofPlayers(sessions[thisClient.currentgameid]);
				socket.emit('currentStats', currentStats, sessions[thisClient.currentgameid].currentHost === thisClient.clientID);
			}
		}
	});
	// client requests to kick a certain player (index someindex in current list)
	// verification step
	socket.on('iWantToKickPlayer', function(someindex){
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			return;
		}
		// is client in a game?
		if (thisClient.currentgameid !== "") {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				// is this client the host?
				if (sessions[thisClient.currentgameid].currentHost === thisClient.clientID) {
					sessions[thisClient.currentgameid].playerToBeKicked = clients[sessions[thisClient.currentgameid].players[someindex]];
					if (typeof(sessions[thisClient.currentgameid].playerToBeKicked) !== 'undefined') {
						socket.emit('confirmKickPlayer', clients[sessions[thisClient.currentgameid].players[someindex]].name);
					}
				}
				socket.emit('currentStats', getCurrentListofPlayers(sessions[thisClient.currentgameid]), sessions[thisClient.currentgameid].currentHost === thisClient.clientID);
			}
		}
	});
	// confirmation step
	socket.on('iWantToConfirmKickPlayer', function(){
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			return;
		}
		// is client in a game?
		if (thisClient.currentgameid !== "") {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				// is this client the host?
				if (sessions[thisClient.currentgameid].currentHost === thisClient.clientID) {
					if (typeof(sessions[thisClient.currentgameid].playerToBeKicked) !== 'undefined') {
						console.log("host kicked " + sessions[thisClient.currentgameid].playerToBeKicked.clientID + " (" + sessions[thisClient.currentgameid].playerToBeKicked.name + ") from session " + thisClient.currentgameid);
						sessions[thisClient.currentgameid].kickedPlayers.push(sessions[thisClient.currentgameid].playerToBeKicked.clientID);
						cleanUpClientObject(sessions[thisClient.currentgameid].playerToBeKicked);
						io.to(sessions[thisClient.currentgameid].playerToBeKicked.socketID).emit('youCanLeave');
						io.to(sessions[thisClient.currentgameid].playerToBeKicked.socketID).emit('alert', "You have been kicked by the host.");
						sessions[thisClient.currentgameid].playerToBeKicked = undefined;

						// update current list of players for everyone
						var currentStats = getCurrentListofPlayers(sessions[thisClient.currentgameid]);
						for (const client of sessions[thisClient.currentgameid].players) {
							io.to(clients[client].socketID).emit('currentStats', currentStats, sessions[thisClient.currentgameid].currentHost === client);
						}
					}
				}
			}
		}
	});
	// handle client disconnect(lost connection/closed tab) to leave game session
	socket.on('disconnect', function(){
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			return;
		}
    console.log("user", thisClient.clientID, "(" + thisClient.name + ") disconnected");
		// does the game exist?
		if (thisClient.currentgameid !== "") {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				var someSession = sessions[thisClient.currentgameid];
				cleanUpClientObject(thisClient);
				// update current list of players for everyone
				var currentStats = getCurrentListofPlayers(someSession);
				for (const client of someSession.players) {
					io.to(clients[client].socketID).emit('currentStats', currentStats, someSession.currentHost === client);
				}
			}
		}
		thisClient.logout();
	});
	// handle client request to leave game session
	socket.on('iWantToLeaveMySession', function() {
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			socket.emit('alert', 'Not logged in. Try reconnecting by refreshing page.');
			return;
		}
		// does the game exist?
		if (thisClient.currentgameid !== "") {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				var someSession = sessions[thisClient.currentgameid];
				cleanUpClientObject(thisClient);
				// update current list of players for everyone
				var currentStats = getCurrentListofPlayers(someSession);
				for (const client of someSession.players) {
					io.to(clients[client].socketID).emit('currentStats', currentStats,someSession.currentHost === client);
				}
			}
		}
		socket.emit('youCanLeave');
	});
	// handle client request to cancel download+not enter game session (same as iWantToLeaveMySession but without emit('youCanLeave'))
	socket.on('iWantToCancelJoin', function() {
		// is user logged in?
		if (typeof(thisClient) === 'undefined') {
			return;
		}
		// does the game exist?
		if (thisClient.currentgameid !== "") {
			if (typeof(sessions[thisClient.currentgameid]) !== 'undefined') {
				var someSession = sessions[thisClient.currentgameid];
				cleanUpClientObject(thisClient);
				// update current list of players for everyone
				var currentStats = getCurrentListofPlayers(someSession);
				for (const client of someSession.players) {
					io.to(clients[client].socketID).emit('currentStats', currentStats, someSession.currentHost === client);
				}
			}
		}
	});
});

// start listening for clients
server.listen(port, function(){
	console.log("Listening on port " +  port);
});

// function to format puzzle partitioning in a form that can be send to clients
function getClientSidePartitionObject(somepuzzle) {
	// result is an object that contains an array of partitions, which themselves are arrays of pieces, and an array of pieces which only have information on changed connections
	var result = {"partitions": [], "pieces": []};
	for (const partition in somepuzzle.partitions) {
		var thispartition = [];
		for (const piece of somepuzzle.partitions[partition].pieces) {
			thispartition.push([piece.i, piece.j]);
		}
		result.partitions.push(thispartition);
	}
	for (var i = 0; i < somepuzzle.layout[0]; i++) {
		result.pieces[i] = [];
		for (var j = 0; j < somepuzzle.layout[1]; j++) {
			result.pieces[i][j] = {"connections": somepuzzle.pieces[i][j].connections};
		}
	}
	return result;
}

// applies/remove claim to hold puzzle piece to all tiles in a partition
function claimAllPiecesWithinPartition(someSession, someClient, somePartition) {
	for (const piece of somePartition.pieces) {
		piece.heldby = someClient;
	}
}

// make new common z-Index at the top for all pieces in this partition
function dragPiecesToTop(someSession, somePartition) {
	var newz = someSession.puzzle.maximumz++
	for (const piece of somePartition.pieces) {
		piece.z = newz;
	}
}

function enforce_game_boundary(someSession, somePiece) {
	// find boundary of partition
	var leftmost = somePiece;
	var rightmost = somePiece;
	var topmost = somePiece;
	var bottommost = somePiece;
	switch (somePiece.angle) {
		case 0:
			for (const piece of somePiece.partition.pieces) {
				if (piece.x0[0] < leftmost.x0[0]) {
					leftmost = piece;
				}
				if (piece.x0[0] + piece.w > rightmost.x0[0] + rightmost.w) {
					rightmost = piece;
				}
				if (piece.y0[0] < topmost.y0[0]) {
					topmost = piece;
				}
				if (piece.y0[0] + piece.h > bottommost.y0[0] + bottommost.h) {
					bottommost = piece;
				}
			}
			break;
		case 1:
			for (const piece of somePiece.partition.pieces) {
				if (piece.y0[1] > leftmost.y0[1]) {
					leftmost = piece;
				}
				if (piece.y0[0] < rightmost.y0[0]) {
					rightmost = piece;
				}
				if (piece.x0[0] < topmost.x0[0]) {
					topmost = piece;
				}
				if (piece.x0[2] > bottommost.x0[2]) {
					bottommost = piece;
				}
			}
			break;
		case 2:
			for (const piece of somePiece.partition.pieces) {
				if (piece.x0[2] > leftmost.x0[2]) {
					leftmost = piece;
				}
				if (piece.x0[0] < rightmost.x0[0]) {
					rightmost = piece;
				}
				if (piece.y0[2] > topmost.y0[2]) {
					topmost = piece;
				}
				if (piece.y0[0] < bottommost.y0[0]) {
					bottommost = piece;
				}
			}
			break;
		case 3:
			for (const piece of somePiece.partition.pieces) {
				if (piece.y0[3] < leftmost.y0[3]) {
					leftmost = piece;
				}
				if (piece.y0[2] > rightmost.y0[2]) {
					rightmost = piece;
				}
				if (piece.x0[2] > topmost.x0[2]) {
					topmost = piece;
				}
				if (piece.x0[0] < bottommost.x0[0]) {
					bottommost = piece;
				}
			}
			break;
	}
	somePiece.update_partition();
	// check individual directions and shift partition accordingly..
	if (leftmost.x < someSession.game_boundary_left) {
		leftmost.x = someSession.game_boundary_left;
		leftmost.update_partition();
	}
	if (rightmost.x + rightmost.w > someSession.game_boundary_right) {
		rightmost.x = someSession.game_boundary_right - rightmost.w;
		rightmost.update_partition();
	}
	if (topmost.y < someSession.game_boundary_top) {
		topmost.y = someSession.game_boundary_top;
		topmost.update_partition();
	}
	if (bottommost.y + bottommost.h > someSession.game_boundary_bottom) {
		bottommost.y = someSession.game_boundary_bottom - bottommost.h;
		bottommost.update_partition();
	}
}

// format full client-side info on session/puzzle into object
function getfullsessionobject(someSessionID) {
	var somesession = {};
	var somepuzzle = {};
	somesession["id"] = someSessionID;
	somesession["currentconnections"] = sessions[someSessionID].puzzle.connectededges;
	somesession["totalconnections"] = sessions[someSessionID].puzzle.totaledges;
	somesession["userotation"] = sessions[someSessionID].userotation;
	somesession["competitive"] = sessions[someSessionID].competitive;
	somesession["puzzle"] = somepuzzle;
	somepuzzle["layout"] = sessions[someSessionID].puzzle.layout;
	somepuzzle["dimensions"] = sessions[someSessionID].puzzle.dimensions;
	somepuzzle["seed"] = sessions[someSessionID].puzzle.seed;
	somepuzzle["style"] = sessions[someSessionID].puzzle.style;
	somepuzzle["motif"] = sessions[someSessionID].puzzle.motif;
	var pieces = [];
	for (var i = 0; i < somepuzzle.layout[0]; i++) {
		pieces[i] = [];
		for (var j = 0; j < somepuzzle.layout[1]; j++) {
			pieces[i][j] = {};
			pieces[i][j]["x"] = sessions[someSessionID].puzzle.pieces[i][j].x;
			pieces[i][j]["y"] = sessions[someSessionID].puzzle.pieces[i][j].y;
			pieces[i][j]["x0"] = sessions[someSessionID].puzzle.pieces[i][j].x0;
			pieces[i][j]["y0"] = sessions[someSessionID].puzzle.pieces[i][j].y0;
			pieces[i][j]["z"] = sessions[someSessionID].puzzle.pieces[i][j].z;
			pieces[i][j]["angle"] = sessions[someSessionID].puzzle.pieces[i][j].angle;
			pieces[i][j]["w"] = sessions[someSessionID].puzzle.pieces[i][j].w;
			pieces[i][j]["h"] = sessions[someSessionID].puzzle.pieces[i][j].h;
			pieces[i][j]["edges"] = sessions[someSessionID].puzzle.pieces[i][j].edges;
			pieces[i][j]["connections"] = sessions[someSessionID].puzzle.pieces[i][j].connections;
		}
	}
	somepuzzle["pieces"] = pieces;
	return somesession;
}

// make a current list of players in someSession
function getCurrentListofPlayers(someSession) {
	var result = [];
	for (const clientID of someSession.players) {
		if (typeof(clients[clientID]) === 'undefined') continue;
		if (!(someSession.id in clients[clientID].sessionConnectionCounter))
			clients[clientID].sessionConnectionCounter[someSession.id] = 0;
		result.push({"name": clients[clientID].name,
											 "colorID": clients[clientID].colorID,
											 "isHost": sessions[someSession.id].currentHost === clientID,
											 "sessionConnectionCounter": clients[clientID].sessionConnectionCounter[someSession.id],
											 "connectionCounter": clients[clientID].connectionCounter});
	}
	return result;
}

// clean up client object after disconnect from session
function cleanUpClientObject(someClient) {
	// clear holdsPiece (client)/heldby (pieces)
	if (typeof(someClient.holdsPiece) !== 'undefined') {
		// revert claim on other tiles from same partition
		claimAllPiecesWithinPartition(sessions[someClient.currentgameid], undefined, someClient.holdsPiece.partition);
		// remove highlight of held piece
		for (const client of sessions[someClient.currentgameid].players) {
			if (typeof(clients[client]) !== 'undefined') {
				if (clients[client].clientID !== someClient.clientID) io.to(clients[client].socketID).emit('unhighlightPiece', someClient.holdsPiece.i, someClient.holdsPiece.j);
			}
		}
		someClient.holdsPiece = undefined;
	}
	// clear heldPieceTimeout
	if (typeof(someClient.heldPieceTimeout) !== 'undefined') {
		clearTimeout(someClient.heldPieceTimeout);
		someClient.heldPieceTimeout = undefined;
	}
	var currentgameid = someClient.currentgameid;
	// remove client from player list
	if (sessions[someClient.currentgameid].players.includes(someClient.clientID)) {
		sessions[someClient.currentgameid].currentplayers--;
		sessions[someClient.currentgameid].players.splice(sessions[someClient.currentgameid].players.indexOf(someClient.clientID), 1);
		console.log('> ' + someClient.currentgameid + ': ' + sessions[someClient.currentgameid].currentplayers + '/' + sessions[someClient.currentgameid].maxplayers);
		someClient.currentgameid = "";
	}
	// find new host if necessary
	if (sessions[currentgameid].currentHost === someClient.clientID) {
		if (sessions[currentgameid].players.length > 0) {
			sessions[currentgameid].currentHost = sessions[currentgameid].players[0];
			console.log('new host in ' + currentgameid + ': ' + sessions[currentgameid].currentHost + ' (' + clients[sessions[currentgameid].currentHost].name + ')');
		} else {
			sessions[currentgameid].currentHost = "";
		}
		sessions[currentgameid].playerToBeKicked = undefined;
	}
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
