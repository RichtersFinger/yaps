// web socket for communication with server
var iosocket;

// identifier mostly used for remembering an already known player after a connection loss
var myID;
// name displayed for others
var myName;
var myColorID = 0;

// note: every asset in preload?
const GRAPHICAL_ASSETS = ["img/logo.png",
                          "img/icons/addicon.png", "img/icons/backicon.png", "img/icons/gearicon.png", "img/icons/helpicon.png", "img/icons/listicon.png", "img/icons/lockicon.png", "img/icons/motif_placeholder.png", "img/icons/playicon.png", "img/icons/reloadicon.png", "img/icons/timesicon.png", "img/icons/nosoundicon.png", "img/icons/soundicon.png",
                          "img/back/abstract_seamless.jpeg", "img/back/leather_seamless.jpeg", "img/back/marble_seamless.jpeg", "img/back/wood_seamless.jpeg"];
const SFX_ASSETS = ["sfx/combine01.mp3", "sfx/combine02.mp3", "sfx/combine03.mp3", "sfx/combine04.mp3", "sfx/combine05.mp3", "sfx/combine06.mp3", "sfx/combine07.mp3", "sfx/combine08.mp3", "sfx/combine09.mp3", "sfx/combine10.mp3", "sfx/combine11.mp3",
                    "sfx/pickup01.mp3", "sfx/pickup02.mp3", "sfx/pickup03.mp3", "sfx/pickup04.mp3", "sfx/pickup05.mp3", "sfx/pickup06.mp3", "sfx/pickup07.mp3", "sfx/pickup08.mp3", "sfx/pickup09.mp3"];
const SFX_ASSETS_combine0 = 0, SFX_ASSETS_combinen = 11;
const SFX_ASSETS_pickup0 = 11, SFX_ASSETS_pickupn = 9;
var mute = false;

// lobby settings properties
const nMaximumCharacters = 20;
const nColorSelection = 18;
const colorbutton_backgrounds = ["radial-gradient(circle at 90% 0%, #fe9494 0%, #ff6060 100%)", // red
                                 "radial-gradient(circle at 90% 0%, #ff9a75 0%, #ff8b60 100%)",
                                 "radial-gradient(circle at 90% 0%, #ffef85 0%, #ffea60 100%)",
                                 "radial-gradient(circle at 90% 0%, #faff68 0%, #f9ff53 100%)", // yellow
                                 "radial-gradient(circle at 90% 0%, #d8ff91 0%, #c7ff60 100%)",
                                 "radial-gradient(circle at 90% 0%, #a6ff89 0%, #87ff60 100%)",
                                 "radial-gradient(circle at 90% 0%, #6dfe98 0%, #37ff72 100%)", // green
                                 "radial-gradient(circle at 90% 0%, #a0ffda 0%, #60ffc1 100%)",
                                 "radial-gradient(circle at 90% 0%, #a5f9ff 0%, #60f5ff 100%)",
                                 "radial-gradient(circle at 90% 0%, #abd5ff 0%, #60afff 100%)", // blue
                                 "radial-gradient(circle at 90% 0%, #93a1ff 0%, #6075ff 100%)",
                                 "radial-gradient(circle at 90% 0%, #b4a2ff 0%, #7e60ff 100%)",
                                 "radial-gradient(circle at 90% 0%, #c991ff 0%, #b160ff 100%)", // purple
                                 "radial-gradient(circle at 90% 0%, #ffa2fe 0%, #ff60fd 100%)",
                                 "radial-gradient(circle at 90% 0%, #ffa8c7 0%, #ff6099 100%)",
                                 "radial-gradient(circle at 90% 0%, #404040 0%, #000000 100%)", // black
                                 "radial-gradient(circle at 90% 0%, #c3c3c3 0%, #7a7a7a 100%)", // dark gray
                                 "radial-gradient(circle at 90% 0%, #ffffff 0%, #cbcbcb 100%)"]; // light gray
const colorbutton_colors = ["#ff6060", // red
                            "#ff8b60",
                            "#ffea60",
                            "#f9ff53", // yellow
                            "#c7ff60",
                            "#87ff60",
                            "#37ff72", // green
                            "#60ffc1",
                            "#60f5ff",
                            "#60afff", // blue
                            "#6075ff",
                            "#7e60ff",
                            "#b160ff", // purple
                            "#ff60fd",
                            "#ff6099",
                            "#000000", // black
                            "#7a7a7a", // dark gray
                            "#cbcbcb"]; // light gray

// in-game camera object for coordinate transformations
var thiscamera;
var camerazoom = 1.0;

// random number generator
var thisrng;

// contains a list of objects with properties "name"; "current .."; "max number of players"; "current .."; "total number of pieces"; "protected by passphrase"
var currentsessions;
var requestedNewList = false;

// used to determine whether a session start has been issued recently
var trying_to_create_session = false;
// used to determine whether a session join has been issued recently
var trying_to_join_session = false;
var trying_to_join_session_id = "";

// puzzle object
var thispuzzle;

// variables used to handle dragging of puzzle pieces
var try_to_drag_piece = false;
var dragging_piece = false;
var dragged_piece;
var mousedown_mouselocation = [0, 0];
var piece_mouselocation = [0, 0];
// this is used to limit the piece position updates to a certain rate
var drag_timeout;
const drag_timeout_time = 16;

window.onload = function () {
	// restore settings from cookies
	loadPreviousSettings();

	// connect to server via web socket
	iosocket = io.connect('/welcome');
	// setup socket communication
	setupSocketCommunication();

	// register as old/new user
	if (typeof(myID) !== 'undefined') {
		console.log('trying to register as', myID);
		iosocket.emit('iamaknownclient', myID);
	} else {
		iosocket.emit('iamanewclient');
	}

	thisrng = new rng();
	thisrng.seed(Date.now());

	// issue pre-loading of assets
	loadAssets(GRAPHICAL_ASSETS, SFX_ASSETS, function(){
		// prepare lobby-page
		setup_lobby();

    // prepare game-page
    setup_game();

		var div_loadingscreen = document.getElementById("div_loadingscreen");
		var div_lobby = document.getElementById("div_lobby");
		// hide loading screen
		fadeto(div_loadingscreen, 1.0, 0.0, 400,
			function(){
				div_loadingscreen.style.visibility = "hidden";
				div_lobby.style.opacity = 0;
				div_lobby.style.visibility = "visible";
				// then show lobby
				fadeto(div_lobby, 0.0, 1.0, 400);
			}
		);
	});
};

// renew list of sessions and respective controls
function renewListOfSessions() {
	// create table and place empty table into corresponding div
	var table_master = document.createElement("table");
	table_master.classList.add('sessionlist');
	document.getElementById("div_lobby_content_games_list").innerHTML = '';
	document.getElementById("div_lobby_content_games_list").append(table_master);

	// create header
	var tableheader = document.createElement("tr");
	var tableheader_passphrase = document.createElement("th");
	tableheader_passphrase.innerHTML = "";
	tableheader_passphrase.style.width = "min(calc(2.5vmin), calc(2.5vw))";
	var tableheader_name = document.createElement("th");
	tableheader_name.innerHTML = "Name";
	tableheader_name.style.width = "calc(20.5vw)";
	tableheader_name.style.paddingLeft = "calc(0.5vw)";
	var tableheader_pieces = document.createElement("th");
	tableheader_pieces.innerHTML = "Progress"; // "Pieces";
	tableheader_pieces.style.width = "calc(7.5vw)"
	tableheader_pieces.style.paddingLeft = "calc(0.5vw)";
	var tableheader_players = document.createElement("th");
	tableheader_players.innerHTML = "Players";
	tableheader_players.style.width = "calc(4.0vw)";
	tableheader_players.style.paddingLeft = "calc(0.5vw)";
	var tableheader_join = document.createElement("th");
	tableheader_join.innerHTML = "";
	tableheader_join.style.width = "calc(4.0vw)";
	tableheader.appendChild(tableheader_passphrase);
	tableheader.appendChild(tableheader_name);
	tableheader.appendChild(tableheader_pieces);
	tableheader.appendChild(tableheader_players);
	tableheader.appendChild(tableheader_join);
	table_master.appendChild(tableheader);

	// iterate over sessions and fill table
	for (let i = 0; i < currentsessions.length; i++) {
		let thisline = document.createElement("tr");
    // highlighting of entry that mouse is pointing at
		thisline.addEventListener("mouseenter", (event) => {
			thisline.style.outline = "calc(0.3vmin) solid rgba(255,255,255,0.5)";
		});
		thisline.addEventListener("mouseleave", (event) => {
			thisline.style.outline = "none";
		});
		thisline.addEventListener("dblclick", (event) => {
			if (event.which === 1) {

        // disable controls
        document.getElementById("div_lobby_content_profile_settings_nameinput").style.opacity = "0.5";
        document.getElementById("div_lobby_content_profile_settings_color").style.opacity = "0.5";
        document.getElementById("div_lobby_content_games_refreshlist").style.opacity = "0.5";
        document.getElementById("div_lobby_content_games_newgame").style.opacity = "0.5";
        document.getElementById("div_lobby_content_games_list").style.opacity = "0.5";
        document.getElementById("div_lobby_blockerdiv").style.display = "";
        // show that the game is waiting for response
        document.getElementById("div_waitingscreen_fancy").style.display = "flex";

        trying_to_join_session = true;
        trying_to_join_session_id = currentsessions[i].sessionid;
        iosocket.emit('iWantToEnterSession', currentsessions[i].sessionid);
      }
		});
		var thisline_passphrase = document.createElement("th");
		// if there exists a passphrase, insert lock-icon
		if (currentsessions[i].bpassphrase) {
			thisline_passphrase.style.padding = "0px";
			var lockimage = document.createElement("img");
			lockimage.src = "img/icons/lockicon.png";
			thisline_passphrase.append(lockimage);
			lockimage.style.maxHeight = "calc(1.5vmin)";
			lockimage.style.paddingLeft = "calc(0.6vmin)";
			lockimage.style.paddingTop = "calc(0.3vmin)";
		} else {
			thisline_passphrase.innerHTML = "";
		}
		var thisline_name = document.createElement("th");
		thisline_name.innerHTML = currentsessions[i].name;
		thisline_name.style.paddingLeft = "calc(1.0vw)";
		var thisline_pieces = document.createElement("th");
		thisline_pieces.innerHTML = currentsessions[i].currentconnections + "/" + currentsessions[i].totalconnections;
		thisline_pieces.style.paddingLeft = "calc(1.0vw)";
		var thisline_players = document.createElement("th");
		thisline_players.innerHTML = currentsessions[i].currentplayers + "/" + currentsessions[i].maxplayers;
		thisline_players.style.paddingLeft = "calc(1.0vw)";
		var thisline_join = document.createElement("th");
		thisline_join.innerHTML = ""; // note: missing..
		thisline.appendChild(thisline_passphrase);
		thisline.appendChild(thisline_name);
		thisline.appendChild(thisline_pieces);
		thisline.appendChild(thisline_players);
		thisline.appendChild(thisline_join);
		table_master.appendChild(thisline);
	}

}

// use this to unlock previously blocked user interface (dblclick on session or play button on new session)
function unlockUserInterface() {
  if (trying_to_create_session) {
    // revert changes to settings menu
    document.getElementById("div_lobby_content_profile_settings_nameinput").style.opacity = "1";
    document.getElementById("div_lobby_content_profile_settings_color").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_back").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_play").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_name").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_passphrase_check_container").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_passphrase").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_piecesperlength").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_maxplayers").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_motiffile").style.opacity = "1";
    document.getElementById("div_lobby_blockerdiv").style.display = "none";
    // remove load icon
    document.getElementById("div_lobby_content_newgame_settings_motiffile_loadericon").style.display = "none";
    document.getElementById("div_lobby_content_newgame_settings_motif_preview").style.opacity = "1";
    trying_to_create_session = false;
  } else {
    // revert join from list of servers
    document.getElementById("div_lobby_content_profile_settings_nameinput").style.opacity = "1";
    document.getElementById("div_lobby_content_profile_settings_color").style.opacity = "1";
    document.getElementById("div_lobby_content_games_refreshlist").style.opacity = "1";
    document.getElementById("div_lobby_content_games_newgame").style.opacity = "1";
    document.getElementById("div_lobby_content_games_list").style.opacity = "1";
    document.getElementById("div_lobby_blockerdiv").style.display = "none";
    // show that the game is waiting for response
    document.getElementById("div_waitingscreen_fancy").style.display = "none";
  }
}

// custom alert dialog
function createAlertDialog(somemsg) {
    document.getElementById("div_alert_fancy_p").innerHTML = somemsg;
    document.getElementById("div_alert_fancy").style.display = "flex";
}

// web socket client-side communication setup
function setupSocketCommunication() {
  // server messages that are shown as alerts
  iosocket.on('alert', ( somemsg ) => {
    createAlertDialog(somemsg);
  });
  // creating or joining blocks interface, this releases it again
  iosocket.on('releaseBlockedInterface', ( ) => {
    unlockUserInterface();
  });
	// receiving verification/correction on id for identification on next reconnect
	iosocket.on('newClientID', ( someid ) => {
		document.cookie = "myID="+someid;
	});
	// receiving actual name from server
	iosocket.on('yourNameIs', ( somename ) => {
		myName = somename;
		document.getElementById("div_lobby_content_profile_settings_nameinput").value = myName;
	});
	// receiving actual color from server
	iosocket.on('yourColorIs', ( somecolorid ) => {
		document.getElementById("div_lobby_content_profile_settings_color_button" + myColorID).style.outline = "none";
		myColorID = somecolorid;
		document.getElementById("div_lobby_content_profile_settings_color_button" + myColorID).style.outline = "calc(0.6vmin) solid #ffffff";
		document.cookie = "myColorID="+myColorID;
	});
	// receiving current list of sessions from server
	iosocket.on('currentListOfSessions', ( listofsessionobjects ) => {
		currentsessions = listofsessionobjects;
		requestedNewList = false;
		div_lobby_content_games_refreshlist.style.opacity = 1.0;
		// renew list
		renewListOfSessions();
	});
  // okay from server that the piece is free to be moved
  iosocket.on('startMovingPiece', ( i, j, z ) => {
    if (try_to_drag_piece) {
      // play sfx
      var thisindex = Math.floor(thisrng.get()*SFX_ASSETS_pickupn);
      playsfx(SFX_ASSETS[SFX_ASSETS_pickup0 + thisindex]);

      try_to_drag_piece = false;
      dragging_piece = true;
      dragged_piece = thispuzzle.pieces[i][j];
      dragged_piece.z = z + dragged_piece.highlight;
      dragged_piece.divcontainer.style.zIndex = dragged_piece.z;
      // apply changes to all pieces within partition
      for (const piece of dragged_piece.partition) {
        piece.z = z + piece.highlight;
        piece.divcontainer.style.zIndex = piece.z;
      }
    } else {
      iosocket.emit('iWantToDropPiece');
    }
  });
  // verification from server that the piece has been dropped
  iosocket.on('stopMovingPiece', ( x, y, z, angle ) => {
    dragged_piece.x = x;
    dragged_piece.y = y;
    dragged_piece.z = z + dragged_piece.highlight;
    dragged_piece.angle = angle;
    dragged_piece = undefined;
    dragging_piece = false;
    try_to_drag_piece = false;
    thispuzzle.updatePiecePositions();
    thispuzzle.updatePieceScale();
  });
  // server-issued update on puzzle piece coordinates
  iosocket.on('updatePieceCoordinates', ( i, j, x, y, z, angle ) => {
    // note: use animate for smooth transition
    thispuzzle.pieces[i][j].x = x;
    thispuzzle.pieces[i][j].y = y;
    thispuzzle.pieces[i][j].z = z + thispuzzle.pieces[i][j].highlight;
    thispuzzle.pieces[i][j].angle = angle;
    // apply changes to all pieces within partition
    for (const piece of thispuzzle.pieces[i][j].partition) {
      // note: pathouter works somewhat better for non-regular shapes but aspect ratio still makes problems..
    //  piece.x =  thispuzzle.pieces[i][j].x + (piece.pathouter[0][0] -  thispuzzle.pieces[i][j].pathouter[0][0]);
    //  piece.y = thispuzzle.pieces[i][j].y + (piece.pathouter[0][1] - thispuzzle.pieces[i][j].pathouter[0][1]);
      piece.x = thispuzzle.pieces[i][j].x + (piece.x0 - thispuzzle.pieces[i][j].x0);
      piece.y = thispuzzle.pieces[i][j].y + (piece.y0 - thispuzzle.pieces[i][j].y0);
      piece.z = z + piece.highlight;
      piece.angle = angle;
    }
    thispuzzle.updatePiecePositions();
  });
  // server-issued update on puzzle partitioning
  iosocket.on('updatePuzzlePartitions', ( data ) => {
    // read partitions
    for (const partition of data.partitions) {
      var newpartition = [];
      // assemble partition "object"
      for (const piece of partition) {
        newpartition.push(thispuzzle.pieces[piece[0]][piece[1]]);
      }
      for (const piece of partition) {
        thispuzzle.pieces[piece[0]][piece[1]].partition = newpartition;
      }
    }
    // read connections
    for (var i = 0; i < thispuzzle.layout[0]; i++) {
      for (var j = 0; j < thispuzzle.layout[1]; j++) {
        thispuzzle.pieces[i][j].connections = data.pieces[i][j].connections;
      }
    }
    thispuzzle.updatePiecePositions();
    thispuzzle.updatePieceScale();
  });
	// receiving confirmation to enter session + necessary info
	iosocket.on('enterThisSession', ( sessionobject ) => {

    console.log(sessionobject.puzzle.pieces);

    unlockUserInterface();

    // get reference to progress screen & bar
    document.getElementById("div_loadingscreen_fancy_bar_inner").style.width = "0%";
    document.getElementById("div_loadingscreen_fancy").style.display = "flex";

    let progressbar = document.getElementById("div_loadingscreen_fancy_bar_inner");

    loadImage_wprogress(sessionobject.puzzle.motif, (ratio) => {
      if (ratio === -1) {
        progressbar.style.width = "0%";
      } else {
        // We have progress ratio; update the bar.
        progressbar.style.width = ratio + "%";
      }
    })
    .then(imgSrc => {
      // has been canceled?
      if (!trying_to_join_session) {
        document.getElementById("div_loadingscreen_fancy").style.display = "none";
        trying_to_join_session = false;
        return;
      }
      // too late to cancel now

      // file loaded, setup of puzzle

      // get references to div's that are required below
      var div_lobby = document.getElementById("div_lobby");
      var div_game = document.getElementById("div_game");

      // create puzzle object
      thispuzzle = new puzzle(sessionobject.puzzle.layout, sessionobject.puzzle.seed, sessionobject.puzzle.style, sessionobject.puzzle.motif, sessionobject.puzzle.dimensions, div_game);

      // update progress indicator
      document.getElementById("div_game_progress_label").innerHTML = sessionobject.currentconnections + "/" + sessionobject.totalconnections;

      // ensure natural dimensions of img motif have been loaded
      var preloadimg = document.createElement('img');
      preloadimg.addEventListener("load", (event) => {
        // fail-safe, if this listener happens to be triggered before that in puzzle-constructor
        thispuzzle.dimensions_px[0] = preloadimg.naturalWidth;
        thispuzzle.dimensions_px[1] = preloadimg.naturalHeight;

        // create camera with appropriate length scale setting
        thiscamera = new camera(thispuzzle.dimensions_px[0]);

        // finalize puzzle setup
        thispuzzle.readPieceShapes(sessionobject.puzzle.pieces);
        thispuzzle.readPieceCoordinates(sessionobject.puzzle.pieces);
        thispuzzle.generatePieceClippaths();
        thispuzzle.updatePiecePositions();
        thispuzzle.updatePieceScale();
        thispuzzle.insertPieces(sessionobject.puzzle.pieces);

        // set up event listeners for puzzle piece dragging
        for (let i = 0; i < thispuzzle.layout[0]; i++) {
          for (let j = 0; j < thispuzzle.layout[1]; j++) {
            // request pick up on mousedown on piece
            thispuzzle.pieces[i][j].img.addEventListener("mousedown", (event) => {
              if (event.which === 1 && !dragging_piece) {
                event.stopPropagation();
                try_to_drag_piece = true;
                // save required properties
                mousedown_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
                piece_mouselocation = [thispuzzle.pieces[i][j].x, thispuzzle.pieces[i][j].y];
                iosocket.emit('iWantToPickUpPiece', i, j);
              }
            });
            // move mouse over game div to send current piece position to server
            div_game.addEventListener("mousemove", (event) => {
              // only message server if actually dragging held piece & sufficient time passed since last emit
              if (dragging_piece && typeof(drag_timeout) === 'undefined') {
                var mousemove_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
                dragged_piece.x = piece_mouselocation[0] + thiscamera.getlength_cam(mousemove_mouselocation[0] - mousedown_mouselocation[0]);
                dragged_piece.y = piece_mouselocation[1] + thiscamera.getlength_cam((mousemove_mouselocation[1] - mousedown_mouselocation[1]));
                for (const piece of dragged_piece.partition) {
                  piece.x = dragged_piece.x + (piece.x0 - dragged_piece.x0);
                  piece.y = dragged_piece.y + (piece.y0 - dragged_piece.y0);
                }
                // note: use animate for smooth transition
                thispuzzle.updatePiecePositions();
                iosocket.emit('iWantToMoveMyPiece', dragged_piece.x, dragged_piece.y, dragged_piece.angle);
                drag_timeout = setTimeout(function () {
                  drag_timeout = undefined;
                }, drag_timeout_time);
              }
            });
            // request stop dragging piece
            div_game.addEventListener("mouseup", (event) => {
              if (dragging_piece && event.which === 1) {
                dragging_piece = false;
                iosocket.emit('iWantToDropPiece');
              }
            });
          }
        }
        // request up-to-date information on current game state
        iosocket.emit('iNeedAnUpdate');

        // make smooth transition to enter game
        fadeto(div_lobby, 1.0, 0.0, 100,
          function(){
            document.getElementById("div_loadingscreen_fancy").style.display = "none";
    				div_lobby.style.display = "none";
    				div_game.style.opacity = 0;
    				div_game.style.display = "";
    				fadeto(div_game, 0.0, 1.0, 100);
    			}
    		);

      });
      preloadimg.src = sessionobject.puzzle.motif;
    }, xhr => {
      createAlertDialog('An unknown error occurred. Try refreshing the page and join again.');
    });
	});
  // sfx
  var playsfx = function(somefile) {
    if (!mute) {
    	var thissfx = new Audio(somefile);
    	thissfx.pause();
    	thissfx.volume = 1;
    	thissfx.loop = false;
    	thissfx.play();
    }
  }
  iosocket.on('playSFX_combine', ( n0 ) => {
    let i = 0, n = n0;
    let sfx_combine_timeout = setInterval(function() {
      var thisindex = Math.floor(thisrng.get()*SFX_ASSETS_combinen);
      playsfx(SFX_ASSETS[SFX_ASSETS_combine0 + thisindex]);
      if (++i > n) {
        clearInterval(sfx_combine_timeout);
      }
    }, 150);
  });
  // highlight/remove highlight from puzzle piece that has been picked up by player
  iosocket.on('highlightPiece', ( i, j, colorID, name ) => {
    thispuzzle.pieces[i][j].highlight = 1;
    thispuzzle.pieces[i][j].divcontainer.style.outline = "calc(0.5vmin) solid " + colorbutton_colors[colorID];
  });
  iosocket.on('unhighlightPiece', ( i, j ) => {
    thispuzzle.pieces[i][j].highlight = 0;
    thispuzzle.pieces[i][j].divcontainer.style.outline = "none";
  });
  iosocket.on('updatePuzzleProgress', ( currentconnections ) => {
    document.getElementById("div_game_progress_label").innerHTML = currentconnections + "/" + thispuzzle.totaledges;
  });
  iosocket.on('youCanLeave', ( ) => {
    // get references to div's that are required below
    var div_lobby = document.getElementById("div_lobby");
    var div_game = document.getElementById("div_game");

    // cleanup game
    for (var i = 0; i < thispuzzle.layout[0]; i++) {
      for (var j = 0; j < thispuzzle.layout[1]; j++) {
        thispuzzle.pieces[i][j].divcontainer.remove();
        thispuzzle.pieces[i][j].divedgeshadowcontainer.remove();
        thispuzzle.pieces[i][j].divedgehighlightcontainer.remove();
      }
    }
    thispuzzle = undefined;

    // fade back to lobby
    fadeto(document.getElementById("div_game"), 1.0, 0.0, 100,
			function(){
				div_game.style.display = "none";
        div_game.style.backgroundSize = 100+"%";
        div_game.style.backgroundPosition = "left " + 0 + "px top " + 0 + "px";
        camerazoom = 1.0;
				div_lobby.style.opacity = 0;
				div_lobby.style.display = "";
				fadeto(div_lobby, 0.0, 1.0, 100);
			}
		);
  });



}

// load assets like graphics and sfx
function loadAssets(somegraphics, somesfx, somecallback) {
	// get reference for updating loading bar
	var loaded_assets = 0;
	var progressbar = document.getElementById("div_loadingscreen_inner");
	var div_loadingscreen_preloadcontainer = document.getElementById("div_loadingscreen_preloadcontainer");

	// load graphical assets
	for (var i = 0; i < somegraphics.length; i++) {
    // add graphical assets to document (but hidden), to keep those loaded
    var img = document.createElement('img');
    img.onload = function () {
      loaded_assets++;
      progressbar.style.width = (Math.floor(100*loaded_assets/(somegraphics.length + somesfx.length)) + 1) + '%';
      if (loaded_assets === somegraphics.length + somesfx.length) {
        // everything loaded, continue with entering lobby
        somecallback();
      }
    }
    img.src = somegraphics[i];
    div_loadingscreen_preloadcontainer.append(img);
	}
	// load sfx
	for (var i = 0; i < somesfx.length; i++) {

    // add sfx assets to document (but hidden), to keep those loaded
    var someaudio = document.createElement('audio');
    someaudio.oncanplaythrough = function () {
      loaded_assets++;
      progressbar.style.width = (Math.floor(100*loaded_assets/(somegraphics.length + somesfx.length)) + 1) + '%';
      if (loaded_assets === somegraphics.length + somesfx.length) {
        // everything loaded, continue with entering lobby
        somecallback();
      }
    }
    someaudio.src = somesfx[i];
	  someaudio.load();
    div_loadingscreen_preloadcontainer.append(someaudio);
	}
}

// finalize lobby setup before reveal
function setup_lobby() {
	// generated with https://cssgradient.io/
	const backgrounds = ["linear-gradient(28deg, rgba(93,242,128,1) 0%, rgba(216,242,93,1) 100%)",
	                     "linear-gradient(28deg, rgba(93,221,242,1) 0%, rgba(93,242,128,1) 100%)",
	                     "linear-gradient(28deg, rgba(133,93,242,1) 0%, rgba(93,221,242,1) 100%)",
	                     "linear-gradient(28deg, rgba(242,93,234,1) 0%, rgba(133,93,242,1) 100%)",
	                     "linear-gradient(28deg, rgba(242,135,93,1) 0%, rgba(242,93,234,1) 100%)",
	                     "linear-gradient(28deg, rgba(219,230,76,1) 0%, rgba(242,135,93,1) 100%)",
	                     "linear-gradient(28deg, rgba(216,242,93,1) 0%, rgba(103,242,93,1) 100%)"];



	//set background
	document.getElementById("div_lobby").style.background = backgrounds[Math.floor(thisrng.get()*backgrounds.length)];

	// #################################################################################################
	// ##################      Cancel Join/Download Button      ########################################
	// #################################################################################################

  document.getElementById("div_loadingscreen_fancy_cancelbutton").addEventListener("click", (event) => {
    if (trying_to_join_session) {
      trying_to_join_session = false;
      document.getElementById("div_loadingscreen_fancy").style.display = "none";
      iosocket.emit('iWantToCancelJoin');
    }
  });

  // #################################################################################################
  // #########################     Alert Dialog       ################################################
  // #################################################################################################
  var div_alert_fancy = document.getElementById("div_alert_fancy");
  div_alert_fancy.addEventListener("click", (event) => {
    div_alert_fancy.style.display = "none";
  });
  document.getElementById("div_alert_fancy_cancelbutton").addEventListener("click", (event) => {
    div_alert_fancy.style.display = "none";
  });




	// #################################################################################################
	// ##################  Player Profile Window Configuration  ########################################
	// #################################################################################################
	// setup name-input
	var nameinput = document.getElementById("div_lobby_content_profile_settings_nameinput");
	if (typeof(myName) !== 'undefined') {
		nameinput.value = myName;
		iosocket.emit('myNameIs', myName);
	}
	nameinput.maxLength = nMaximumCharacters;
	nameinput.addEventListener("keypress", (event) => {
		// prevent problematic characters from appearing
    var lastCharacter = String.fromCharCode(event.which);
    if ("<>&;#".indexOf(lastCharacter) >= 0)
        event.preventDefault();
	});
	nameinput.addEventListener("change", (event) => {
		// remove problematic characters
		nameinput.value = nameinput.value.replace(/<|>|&|;|#/g, "");
		if (nameinput.value !== "") {
			myName = nameinput.value;
			document.cookie = "myName="+myName;
			iosocket.emit('myNameIs', myName);
		}
	});

	// create color-select buttons
	var button_container = document.getElementById("div_lobby_content_profile_settings_color");
	for (var i = 0; i < nColorSelection; i++) {
		var somebutton = document.createElement('button');
		somebutton.id = "div_lobby_content_profile_settings_color_button" + i;
		somebutton.classList.add("colorbutton");
		somebutton.style.margin = "calc(0.5vmin)";
		somebutton.style.background = colorbutton_backgrounds[i];
		if (myColorID === i) somebutton.style.outline = "calc(0.6vmin) solid #ffffff";
		button_container.append(somebutton);
		let index = i;
		somebutton.addEventListener("click", (event) => {
			document.getElementById("div_lobby_content_profile_settings_color_button" + myColorID).style.outline = "none";
			document.getElementById("div_lobby_content_profile_settings_color_button" + index).style.outline = "calc(0.6vmin) solid #ffffff";
			myColorID = index;
			iosocket.emit('myColorIs', myColorID);
		});
	}

	// #################################################################################################
	// ##################  Listed Sessions Window Configuration  #######################################
	// #################################################################################################
	// configure lobby control buttons
	// refresh list
	var div_lobby_content_games_refreshlist = document.getElementById("div_lobby_content_games_refreshlist");
	div_lobby_content_games_refreshlist.addEventListener("click", (event) => {
		if (!requestedNewList) {
			requestedNewList = true;
			div_lobby_content_games_refreshlist.style.opacity = 0.5;
			iosocket.emit('iNeedANewList');
		}
	});

	// new session
	var div_lobby_content_games = document.getElementById("div_lobby_content_games");
	var div_lobby_content_newgame = document.getElementById("div_lobby_content_newgame");
	document.getElementById("div_lobby_content_games_newgame").addEventListener("click", (event) => {
		fadeto(div_lobby_content_games, 1.0, 0.0, 100,
			function(){
				div_lobby_content_games.style.display = "none";
				div_lobby_content_newgame.style.opacity = 0;
				div_lobby_content_newgame.style.display = "";
				fadeto(div_lobby_content_newgame, 0.0, 1.0, 100);
			}
		);
	});

  // make empty list
  currentsessions = [];
  renewListOfSessions();
  iosocket.emit('iNeedANewList');

	// #################################################################################################
	// ####################  New Session Window Configuration  #########################################
	// #################################################################################################
	// back from new session
	document.getElementById("div_lobby_content_newgame_back").addEventListener("click", (event) => {
		if (!requestedNewList) {
			requestedNewList = true;
			div_lobby_content_games_refreshlist.style.opacity = 0.5;
			iosocket.emit('iNeedANewList');
		}
		fadeto(div_lobby_content_newgame, 1.0, 0.0, 100,
			function(){
				div_lobby_content_newgame.style.display = "none";
				div_lobby_content_games.style.opacity = 0;
				div_lobby_content_games.style.display = "";
				fadeto(div_lobby_content_games, 0.0, 1.0, 100);
			}
		);
	});

	// get reference for start play button to have it already available during tests whether session can be started
	var div_lobby_content_newgame_play = document.getElementById("div_lobby_content_newgame_play");
	// returns true if all prerequisites for starting a session are met (client side); enables/disables button for starting game
	var newSessionSettingsValid = function() {
		// check if all prerequisites (client-side) are met to open new session
		var piecesperlength = parseInt(div_lobby_content_newgame_settings_piecesperlength.value);
		if (div_lobby_content_newgame_settings_name.value !== ""
	      && (!div_lobby_content_newgame_settings_passphrase_check.checked || (div_lobby_content_newgame_settings_passphrase_check.checked && div_lobby_content_newgame_settings_passphrase.value !== ""))
			  && typeof(piecesperlength) === 'number' && piecesperlength >= nMinimumPiecesLongDirection && piecesperlength <= nMaximumPiecesPerDirection
			  && typeof(puzzlemotif) === 'string' && typeof(puzzlemotif_width) === 'number' && typeof(puzzlemotif_height) === 'number') {
			div_lobby_content_newgame_play.style.opacity = 1;
			return true;
		} else {
			div_lobby_content_newgame_play.style.opacity = 0.5;
			return false;
		}
	};

	// session name & passphrase maximum character limit + remove unwanted characters from in name
	const nMaximumCharactersSessionName = 20;
	var div_lobby_content_newgame_settings_name = document.getElementById("div_lobby_content_newgame_settings_name");
	div_lobby_content_newgame_settings_name.maxLength = nMaximumCharactersSessionName;
	div_lobby_content_newgame_settings_name.addEventListener("keypress", (event) => {
		// prevent problematic characters from appearing
    var lastCharacter = String.fromCharCode(event.which);
    if ("<>&;#".indexOf(lastCharacter) >= 0)
      event.preventDefault();

	});
	div_lobby_content_newgame_settings_name.addEventListener("keyup", (event) => {
			newSessionSettingsValid();
	});
	div_lobby_content_newgame_settings_name.addEventListener("change", (event) => {
		// remove problematic characters
		div_lobby_content_newgame_settings_name.value = div_lobby_content_newgame_settings_name.value.replace(/<|>|&|;|#/g, "");
		newSessionSettingsValid();
	});
	const nMaximumCharactersSessionPassphrase = 20;
	var div_lobby_content_newgame_settings_passphrase = document.getElementById("div_lobby_content_newgame_settings_passphrase");
	div_lobby_content_newgame_settings_passphrase.maxLength = nMaximumCharactersSessionName;
	div_lobby_content_newgame_settings_passphrase.addEventListener("keyup", (event) => {
			newSessionSettingsValid();
	});

	// checkbox for passphrase
	var div_lobby_content_newgame_settings_passphrase_check = document.getElementById("div_lobby_content_newgame_settings_passphrase_check");
	div_lobby_content_newgame_settings_passphrase_check.addEventListener('change', (event) => {
	  if (event.currentTarget.checked) {
			div_lobby_content_newgame_settings_passphrase.disable = false;
			div_lobby_content_newgame_settings_passphrase.style.opacity = 1.0;
	  } else {
	    div_lobby_content_newgame_settings_passphrase.disable = true;
	    div_lobby_content_newgame_settings_passphrase.style.opacity = 0.5;
	  }
		newSessionSettingsValid();
	});

	// setup piecesperlength-input
	const nMinimumPiecesLongDirection = 5;
	const nMaximumPiecesPerDirection = 50;
	var div_lobby_content_newgame_settings_piecesperlength = document.getElementById("div_lobby_content_newgame_settings_piecesperlength");
	div_lobby_content_newgame_settings_piecesperlength.addEventListener("keypress", (event) => {
		// prevent bad characters from appearing
    var lastCharacter = String.fromCharCode(event.which);
    if ("0123456789".indexOf(lastCharacter) < 0)
        event.preventDefault();

		/*// prevent new number from appearing if too large
		var currentvalue = parseInt(div_lobby_content_newgame_settings_piecesperlength.value + lastCharacter);
    if (currentvalue) {
			if (currentvalue > nMaximumPiecesPerDirection) {
				div_lobby_content_newgame_settings_piecesperlength.value = nMaximumPiecesPerDirection;
				event.preventDefault();
			}
		}*/
	});
	div_lobby_content_newgame_settings_piecesperlength.addEventListener("change", (event) => {
		// check for numbers above/below valid range
		var currentvalue = parseInt(div_lobby_content_newgame_settings_piecesperlength.value);
    if (typeof(currentvalue) === 'number') {
			if (currentvalue > nMaximumPiecesPerDirection) {
				div_lobby_content_newgame_settings_piecesperlength.value = nMaximumPiecesPerDirection;
				event.preventDefault();
			}
			if (currentvalue < nMinimumPiecesLongDirection) div_lobby_content_newgame_settings_piecesperlength.value = nMinimumPiecesLongDirection;
		} else {
			div_lobby_content_newgame_settings_piecesperlength.value = 10;
		}
    newSessionSettingsValid();
	});

	// setup max player-input
	const nMaximumPlayers = 20;
	var div_lobby_content_newgame_settings_maxplayers = document.getElementById("div_lobby_content_newgame_settings_maxplayers");
	div_lobby_content_newgame_settings_maxplayers.addEventListener("keypress", (event) => {
		// prevent bad characters from appearing
    var lastCharacter = String.fromCharCode(event.which);
    if ("0123456789".indexOf(lastCharacter) < 0)
        event.preventDefault();
	});
	div_lobby_content_newgame_settings_maxplayers.addEventListener("change", (event) => {
		// check for numbers above/below valid range
		var currentvalue = parseInt(div_lobby_content_newgame_settings_maxplayers.value);
    if (typeof(currentvalue) === 'number') {
			if (currentvalue > nMaximumPlayers) {
				div_lobby_content_newgame_settings_maxplayers.value = nMaximumPlayers;
				event.preventDefault();
			}
			if (currentvalue < 1) div_lobby_content_newgame_settings_maxplayers.value = 1;
		} else {
			div_lobby_content_newgame_settings_maxplayers.value = 10;
		}
	});

	// setup handling of image upload
	var div_lobby_content_newgame_settings_motiffile = document.getElementById("div_lobby_content_newgame_settings_motiffile");
	var div_lobby_content_newgame_settings_motif_preview = document.getElementById("div_lobby_content_newgame_settings_motif_preview");
	// prevent opening of file drag&dropped file in browser if the file input has been missed
	window.addEventListener("dragover", (event) => {
		event.preventDefault();
	});
	window.addEventListener("drop", (event) => {
		if (event.target !== div_lobby_content_newgame_settings_motiffile) {
			event.preventDefault();
		}
	});
	// handle new file
	var puzzlemotif, puzzlemotif_width, puzzlemotif_height;
	div_lobby_content_newgame_settings_motiffile.addEventListener("change", (event) => {
		if (div_lobby_content_newgame_settings_motiffile.files[0].type.substring(0,6) === "image/") {
			var reader = new FileReader();
			reader.addEventListener("load", (event) => {
				// test whether image file too large
				var estimatedSize = new Blob([event.target.result]).size;
				if (estimatedSize < 3.9e7) { // see limit 'maxHttpBufferSize' in 'index.js'
					puzzlemotif = event.target.result;

          // add listener to fetch image dimensions unpon load
        	div_lobby_content_newgame_settings_motif_preview.addEventListener("load", (event) => {
            puzzlemotif_width = div_lobby_content_newgame_settings_motif_preview.naturalWidth;
            puzzlemotif_height = div_lobby_content_newgame_settings_motif_preview.naturalHeight;
        		newSessionSettingsValid();
        	});
					div_lobby_content_newgame_settings_motif_preview.src = event.target.result;
				//	newSessionSettingsValid();
				} else {
      	   // if too large, revert to placeholder
          puzzlemotif = undefined;
          puzzlemotif_width = undefined;
          puzzlemotif_height = undefined;
					div_lobby_content_newgame_settings_motiffile.value = "";
					div_lobby_content_newgame_settings_motif_preview.src = "img/icons/motif_placeholder.png";
					newSessionSettingsValid();
          createAlertDialog('base64-image file is too large (limit is currently set to ~32MB).');
				}
			});
			reader.readAsDataURL(div_lobby_content_newgame_settings_motiffile.files[0]);
		} else {
       // if file is no image, revert to placeholder
      puzzlemotif = undefined;
      puzzlemotif_width = undefined;
      puzzlemotif_height = undefined;
			div_lobby_content_newgame_settings_motiffile.value = "";
			div_lobby_content_newgame_settings_motif_preview.src = "img/icons/motif_placeholder.png";
			newSessionSettingsValid();
		}
	});

	// start session button
	var div_lobby_content_newgame_play = document.getElementById("div_lobby_content_newgame_play");
	div_lobby_content_newgame_play.addEventListener("click", (event) => {
		if (newSessionSettingsValid()) {
      // make style indicate button pressed + block new input
      document.getElementById("div_lobby_content_profile_settings_nameinput").style.opacity = "0.5";
      document.getElementById("div_lobby_content_profile_settings_color").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_back").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_play").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_settings_name").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_settings_passphrase_check_container").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_settings_passphrase").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_settings_piecesperlength").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_settings_maxplayers").style.opacity = "0.5";
			document.getElementById("div_lobby_content_newgame_settings_motiffile").style.opacity = "0.5";
			document.getElementById("div_lobby_blockerdiv").style.display = "";
      // add load icon
      document.getElementById("div_lobby_content_newgame_settings_motiffile_loadericon").style.display = "";
      document.getElementById("div_lobby_content_newgame_settings_motif_preview").style.opacity = "0.5";
      trying_to_create_session = true;
      trying_to_join_session = true;
			iosocket.emit('iWantToStartNewSession', {"name": div_lobby_content_newgame_settings_name.value,
			                                         "bpassphrase": div_lobby_content_newgame_settings_passphrase_check.checked,
																							 "passphrase": div_lobby_content_newgame_settings_passphrase.value,
																						   "piecesperlength": parseInt(div_lobby_content_newgame_settings_piecesperlength.value),
																							 "maxplayers": parseInt(div_lobby_content_newgame_settings_maxplayers.value),
																						   "motif": puzzlemotif,
																						   "motif_res": [puzzlemotif_width, puzzlemotif_height]});
		}
	});
}

function setup_game() {
  var div_game = document.getElementById("div_game");
	// #################################################################################################
	// ########################          setup gui in game        ######################################
	// #################################################################################################
  var div_game_interface_back = document.getElementById("div_game_interface_back");
	div_game_interface_back.addEventListener("click", (event) => {
		iosocket.emit('iWantToLeaveMySession');
	});
  document.getElementById("div_game_interface_sound").addEventListener("click", (event) => {
    if (mute) {
      mute = false;
      document.cookie = "mute=false";
      document.getElementById("div_game_interface_sound_img").src = "img/icons/soundicon.png";
    } else {
      mute = true;
      document.cookie = "mute=true";
      document.getElementById("div_game_interface_sound_img").src = "img/icons/nosoundicon.png";
    }
	});




	// #################################################################################################
	// ################  setup camera movement functionality in game  ##################################
	// #################################################################################################
  // reference points of initiation
  var mousedown_mouselocation = [0, 0];
  var mousedown_cameralocation = [0, 0];
  // reference position of camera object
  var mousedown_cameralocation_cameraobject = [0, 0];
  // define camera properties (location + zoom)
  var cameralocation = [0, 0];
// now defined globally
//  var camerazoom = 1.0;
  // indicator whether camera is being moved
  var dragging_screen = false;
  var dragging_mousebutton_used;
  // drag with mouse; save reference location on mousedown
  div_game.addEventListener("mousedown", (event) => {
    // use left or middle mouse as drag buttons
    if (!dragging_screen && (event.which === 1 || event.which === 2) && !zoomanimation_running) {
      event.preventDefault();
      dragging_mousebutton_used = event.which;
      mousedown_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
      mousedown_cameralocation = [cameralocation[0], cameralocation[1]];
      mousedown_cameralocation_cameraobject = [thiscamera.x, thiscamera.y];
      dragging_screen = true;
    }
  });
  // reposition camera with moving mouse
  // helper function to reposition puzzle pieces
  var panningcamera_updatepuzzlepiecelocations = function() {
    // reset camera to mousedown-location
    thiscamera.x = mousedown_cameralocation_cameraobject[0];
    thiscamera.y = mousedown_cameralocation_cameraobject[1];
    // actually update via delta in pixel space
    var mousemove_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
    thiscamera.update_camera_position_fromdeltapx(mousedown_mouselocation[0] - mousemove_mouselocation[0],
                                                  mousedown_mouselocation[1] - mousemove_mouselocation[1]);
    // update puzzle pieces
    if (typeof(thispuzzle) !== 'undefined') {
      thispuzzle.updatePiecePositions();
    }
  }
  div_game.addEventListener("mousemove", (event) => {
    if (dragging_screen) {
      cameralocation = [mousedown_cameralocation[0] + (parseInt(event.clientX)-mousedown_mouselocation[0]),
                        mousedown_cameralocation[1] + (parseInt(event.clientY)-mousedown_mouselocation[1])];
      div_game.style.backgroundPosition = "left " + cameralocation[0] + "px top " + cameralocation[1] + "px";

      // handle puzzle piece viewport location change
      panningcamera_updatepuzzlepiecelocations();
    }
  });
  // end drag on mouseup for initial button
  div_game.addEventListener("mouseup", (event) => {
    if (dragging_screen && event.which === dragging_mousebutton_used) {
      // handle puzzle piece viewport location change
      panningcamera_updatepuzzlepiecelocations();

      // end dragging camera
      dragging_screen = false;
    }
  });

  // #################################################################################################
  // ####################  setup zoom functionality in game  #########################################
  // #################################################################################################
  // reference points of initiation
  var wheel_mouselocation = [0, 0];
  var wheel_cameralocation = [0, 0];
  // reference for initial camera space position of mouse
  var cameralocation0 = [0, 0];
  // parameters for how large steps are made + margins for min/max zoom
  const camera_zoom_ratefactor = 0.6;
  const camera_zoom_range_lower = 0.15, camera_zoom_range_upper = 10.0;
  // variables+function for implementation of animated zoom
  var zoomtimer, zoomanimation_running = false, zoom_anim_start, zoom_anim_end, zoom_anim_current;
  var zoomfunction = function(x) {
    // animate with sigmoid-curve
    zoom_anim_current = zoom_anim_start + (zoom_anim_end-zoom_anim_start)*(2.0/(1.0 + Math.exp(-5.0*x))-1.0);
    cameralocation[0] = wheel_mouselocation[0] - zoom_anim_current/zoom_anim_start*(wheel_mouselocation[0] - wheel_cameralocation[0]);
    cameralocation[1] = wheel_mouselocation[1] - zoom_anim_current/zoom_anim_start*(wheel_mouselocation[1] - wheel_cameralocation[1]);
    div_game.style.backgroundSize = zoom_anim_current*100+"%";
    div_game.style.backgroundPosition = "left " + cameralocation[0] + "px top " + cameralocation[1] + "px";

    // handle puzzle piece viewport location change by transforming camera object coordinates
    thiscamera.zoom = zoom_anim_current;
    // from original mouse position in camera space cameralocation0, place camera according to current pixel distance
    thiscamera.x = cameralocation0[0] - thiscamera.getlength_cam(wheel_mouselocation[0]);
    thiscamera.y = cameralocation0[1] - thiscamera.getlength_cam(wheel_mouselocation[1]);
    // update puzzle pieces
    if (typeof(thispuzzle) !== 'undefined') {
      thispuzzle.updatePiecePositions();
      thispuzzle.updatePieceScale();
    }
  };
  // zoom on wheel event
  div_game.addEventListener("wheel", (event) => {
    // only allow zoom if camera is not being dragged around
    if (!dragging_screen) {
      // possibly abort currently running zoom animation
      if (zoomanimation_running) {
        clearInterval(zoomtimer);
        camerazoom = zoom_anim_current;
  			cameralocation[0] = wheel_mouselocation[0] - camerazoom/zoom_anim_start*(wheel_mouselocation[0] - wheel_cameralocation[0]);
  			cameralocation[1] = wheel_mouselocation[1] - camerazoom/zoom_anim_start*(wheel_mouselocation[1] - wheel_cameralocation[1]);
      }
      // save reference points
      wheel_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
      wheel_cameralocation = [cameralocation[0], cameralocation[1]];
      // get camera space position of current mouse position
      cameralocation0 = [thiscamera.getx_cam(wheel_mouselocation[0]),
                         thiscamera.gety_cam(wheel_mouselocation[1])];
      zoom_anim_start = camerazoom;
      // goal of zoom animation
      if (event.deltaY < 0) {
        // zoom in
        zoom_anim_end = Math.min(camera_zoom_range_upper, camerazoom/camera_zoom_ratefactor);
      } else if (event.deltaY > 0) {
        // zoom out
        zoom_anim_end = Math.max(camera_zoom_range_lower, camerazoom*camera_zoom_ratefactor);
      }
      // initiate animation
      zoomanimation_running = true;
      zoomtimer = animate(200, zoomfunction, function(){
        zoomfunction(100);
        camerazoom = zoom_anim_end;
        zoomanimation_running = false;
      });
    }
  });
}

// restores previous settings from cookies
function loadPreviousSettings() {
	myID = getCookie('myID');
	myName = getCookie('myName');
	// test if cookie for color id exists
  myColorID = getCookie('myColorID');
	if (typeof(myColorID) !== 'undefined') {
		// if so, try to parse; otherwise set initial value
		myColorID = parseInt(myColorID);
		if (typeof(myColorID) !== 'number') {
			myColorID = 0;
		}
	} else {
		// otherwise set initial value
		myColorID = 0;
	}
  var mute_cookie = getCookie('mute');
  if (typeof(mute_cookie) !== 'undefined') {
    mute = mute_cookie === "true";
    if (mute) {
      document.getElementById("div_game_interface_sound_img").src = "img/icons/nosoundicon.png";
    } else {
      document.getElementById("div_game_interface_sound_img").src = "img/icons/soundicon.png";
    }
  }
}
