/* Copyright (c) 2023 Steffen Richters-Finger */
// web socket for communication with server
var iosocket;

// identifier mostly used for remembering an already known player after a connection loss
var myID;
// name displayed for others
var myName;
var myColorID = 0;

// note: every asset in preload?
const GRAPHICAL_ASSETS = ["img/logo.png",
                          "img/icons/addicon.png", "img/icons/backicon.png", "img/icons/gearicon.png", "img/icons/helpicon.png", "img/icons/listicon.png", "img/icons/lockicon.png", "img/icons/motif_placeholder.png", "img/icons/playicon.png", "img/icons/reloadicon.png", "img/icons/timesicon.png", "img/icons/nosoundicon.png", "img/icons/soundicon.png", "img/icons/confirmicon.png", "img/icons/aborticon.png", "img/icons/motificon.png", "img/icons/crownicon.png", "img/icons/maximizeicon.png",
                          "img/icons/minimizeicon.png", "img/icons/tileicon.png", "img/icons/tileicon2.png",
                          "img/back/abstract_seamless.jpeg", "img/back/leather_seamless.jpeg", "img/back/marble_seamless.jpeg", "img/back/wood_seamless.jpeg"];
const SFX_ASSETS = ["sfx/combine01.mp3", "sfx/combine02.mp3", "sfx/combine03.mp3", "sfx/combine04.mp3", "sfx/combine05.mp3", "sfx/combine06.mp3", "sfx/combine07.mp3", "sfx/combine08.mp3", "sfx/combine09.mp3", "sfx/combine10.mp3", "sfx/combine11.mp3",
                    "sfx/pickup01.mp3", "sfx/pickup02.mp3", "sfx/pickup03.mp3", "sfx/pickup04.mp3", "sfx/pickup05.mp3", "sfx/pickup06.mp3", "sfx/pickup07.mp3", "sfx/pickup08.mp3", "sfx/pickup09.mp3"];
const SFX_ASSETS_combine0 = 0, SFX_ASSETS_combinen = 11;
const SFX_ASSETS_pickup0 = 11, SFX_ASSETS_pickupn = 9;
var mute = false;

const background_images = ["img/back/wood_seamless.jpeg", "img/back/marble_seamless.jpeg", "img/back/leather_seamless.jpeg", "img/back/abstract_seamless.jpeg"];
var myBackground = 0;


// const for clipping a generic piece (used for icons)
const generic_puzzlepiece_shape = "polygon(0% 7%, 0% 8%, 0% 9%, 0% 10%, 0% 10%, 0% 11%, 0% 12%, 0% 13%, 0% 14%, 0% 15%, 0% 16%, 0% 17%, 0% 18%, 0% 19%, 0% 20%, 0% 21%, 0% 22%, 0% 23%, 0% 24%, 0% 24%, 0% 25%, 0% 26%, 0% 27%, 0% 28%, 0% 29%, 0% 30%, 0% 31%, 0% 32%, 0% 33%, 0% 34%, 0% 35%, 0% 36%, 0% 37%, 1% 39%, 1% 42%, 2% 45%, 3% 47%, 4% 48%, 6% 48%, 7% 48%, 9% 47%, 11% 45%, 13% 44%, 15% 43%, 17% 42%, 19% 42%, 20% 43%, 21% 45%, 22% 47%, 23% 50%, 23% 53%, 23% 57%, 22% 60%, 21% 62%, 20% 64%, 19% 64%, 17% 64%, 15% 64%, 14% 63%, 12% 61%, 10% 60%, 8% 59%, 6% 59%, 4% 59%, 3% 60%, 2% 62%, 1% 65%, 1% 68%, 1% 70%, 1% 71%, 1% 72%, 1% 73%, 1% 74%, 1% 75%, 1% 76%, 1% 77%, 1% 78%, 1% 79%, 1% 79%, 1% 80%, 1% 81%, 1% 82%, 1% 83%, 1% 84%, 1% 85%, 1% 86%, 1% 87%, 1% 88%, 1% 89%, 1% 90%, 1% 91%, 1% 92%, 1% 93%, 1% 93%, 1% 94%, 1% 95%, 1% 96%, 2% 97%, 2% 98%, 2% 99%, 2% 100%, 2% 100%, 76% 100%, 76% 100%, 76% 99%, 76% 98%, 76% 97%, 76% 96%, 76% 95%, 76% 94%, 76% 93%, 76% 92%, 76% 91%, 76% 90%, 76% 89%, 76% 88%, 76% 87%, 76% 86%, 76% 85%, 76% 84%, 76% 83%, 76% 82%, 76% 81%, 76% 80%, 76% 79%, 76% 78%, 76% 77%, 76% 76%, 76% 75%, 76% 74%, 76% 73%, 76% 72%, 76% 71%, 76% 70%, 76% 69%, 76% 68%, 76% 66%, 76% 62%, 77% 59%, 78% 57%, 80% 56%, 81% 56%, 83% 56%, 85% 57%, 88% 58%, 90% 60%, 92% 61%, 94% 62%, 95% 62%, 97% 61%, 98% 59%, 99% 57%, 100% 53%, 100% 50%, 100% 47%, 99% 43%, 98% 41%, 97% 39%, 96% 38%, 94% 38%, 92% 39%, 90% 40%, 88% 42%, 86% 43%, 84% 44%, 82% 44%, 80% 44%, 79% 43%, 77% 41%, 77% 38%, 76% 34%, 76% 32%, 76% 31%, 76% 30%, 76% 29%, 76% 28%, 76% 27%, 76% 26%, 76% 25%, 76% 24%, 76% 23%, 76% 22%, 76% 21%, 76% 20%, 76% 19%, 76% 18%, 76% 17%, 76% 16%, 76% 15%, 76% 14%, 76% 13%, 76% 12%, 76% 11%, 76% 10%, 76% 9%, 76% 8%, 76% 7%, 76% 6%, 77% 5%, 77% 4%, 77% 3%, 77% 2%, 77% 1%, 77% 0%, 77% 0%, 76% 0%, 75% 0%, 74% 0%, 73% 0%, 73% 0%, 72% 0%, 71% 0%, 70% 1%, 70% 1%, 69% 1%, 68% 1%, 67% 1%, 67% 1%, 66% 1%, 65% 1%, 64% 1%, 64% 1%, 63% 1%, 62% 1%, 61% 1%, 60% 1%, 60% 1%, 59% 2%, 58% 2%, 57% 2%, 57% 2%, 56% 2%, 55% 2%, 54% 2%, 54% 2%, 53% 2%, 52% 2%, 50% 2%, 48% 3%, 46% 4%, 44% 6%, 43% 8%, 43% 10%, 43% 13%, 44% 16%, 45% 19%, 46% 22%, 47% 25%, 47% 28%, 47% 31%, 47% 33%, 45% 35%, 43% 36%, 41% 37%, 38% 37%, 36% 37%, 33% 36%, 31% 35%, 30% 33%, 29% 31%, 29% 29%, 30% 26%, 31% 23%, 32% 20%, 33% 17%, 34% 14%, 34% 12%, 34% 10%, 33% 8%, 31% 6%, 29% 5%, 26% 5%, 24% 5%, 24% 5%, 23% 5%, 22% 5%, 21% 5%, 21% 5%, 20% 5%, 19% 5%, 18% 5%, 18% 5%, 17% 5%, 16% 5%, 15% 5%, 15% 5%, 14% 6%, 13% 6%, 12% 6%, 11% 6%, 11% 6%, 10% 6%, 9% 6%, 8% 6%, 8% 6%, 7% 6%, 6% 6%, 5% 6%, 5% 6%, 4% 6%, 3% 6%, 2% 7%, 2% 7%, 1% 7%, 0% 7%, 0% 7%)";

// lobby settings properties
const nDifficultySelection = 4;
var difficultySelection = -1;
const difficultybutton_backgrounds = ["radial-gradient(circle at 90% 0%, #ff9a75 0%, #ff8b60 100%)", // copper
                                      "radial-gradient(circle at 90% 0%, #ffffff 0%, #cbcbcb 100%)", // silver
                                      "radial-gradient(circle at 90% 0%, #faff68 0%, #f9ff53 100%)", // gold
                                      "radial-gradient(circle at 90% 0%, #a5f9ff 0%, #60f5ff 100%)", // diamond
                                      ];
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
var zoomanimation_running = false;
var moved_mouse_during_zoom = false;
var backgroundposition;

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
var userotation = false;
var competitive = false;

// variables used to handle dragging of puzzle pieces
var try_to_drag_piece = false;
var dragging_piece = false;
var dragged_piece;
var dragging_piece_mousedown_mouselocation = [0, 0], dragging_piece_mousemove_mouselocation;
var piece_mouselocation = [0, 0];
// this is used to limit the piece position updates to a certain rate
var drag_timeout;
const drag_timeout_time = 16;

// setting decides whether the screen can be dragged with left mouse button
var uselmbscreendrag = true;

// camera panning while dragging piece
// fraction of edge of page where auto-panning with held piece begins
// setting decides whether the screen can be shifted by moving a piece close to one edge
var pancameraclosetoscreenedges = true;
const autopan_camera_margin = 0.05;
// rate of camera panning while holding piece close to screen edge
const autopan_camera_rate_px = 15;
var autopan_camera_delta_px = [0, 0];
var autopan_camera_timer = undefined;
// used to handle picking up piece close to screen's edge without immediately starting to pan
var autopan_camera_onlyjustpickedup = true;

// marker for border of usable area in game; given in camera coordinates
const game_boundary_baserange = 2.0;
var game_boundary_left, game_boundary_right, game_boundary_top, game_boundary_bottom;
var div_game_boundaryoverlay_left, div_game_boundaryoverlay_right, div_game_boundaryoverlay_top, div_game_boundaryoverlay_bottom, div_game_boundaryoverlay_border;

// session shutdown timer
var session_shutdown_timer;
var session_shutdown_timer_remaining = 0;


// variables for handling of highlighted pieces
// list of highlight objects (with {"piece": .., "player": {"color": colorID, "name": name}, "divcontainer": ..})
var currenthighlights = [];

window.onload = function () {
  document.title = "yaps";

	// restore settings from cookies
	loadPreviousSettings();

	// connect to server via web socket
	iosocket = io.connect();
	// setup socket communication
	setupSocketCommunication();

	// register as old/new user
	if (typeof(myID) !== 'undefined') {
		console.log('trying to register as', myID);
		iosocket.emit('iamaknownclient', myID);
	} else {
		iosocket.emit('iamanewclient');
	}

  // set current name
  iosocket.emit('myNameIs', myName);


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
	tableheader_name.innerHTML = "Session";
	tableheader_name.style.width = "min(calc(22.5vw), calc(25vh))";
	tableheader_name.style.paddingLeft = "calc(0.5vw)";
	var tableheader_pieces = document.createElement("th");
	tableheader_pieces.innerHTML = "Progress";
	tableheader_pieces.style.width = "min(calc(7.5vw), calc(8.3vh))"
	tableheader_pieces.style.paddingLeft = "calc(0.5vw)";
	var tableheader_players = document.createElement("th");
	tableheader_players.innerHTML = "Players";
	tableheader_players.style.width = "min(calc(6vw), calc(6.6vh))";
	tableheader_players.style.paddingLeft = "calc(0.5vw)";
	tableheader.append(tableheader_passphrase);
	tableheader.append(tableheader_name);
	tableheader.append(tableheader_pieces);
	tableheader.append(tableheader_players);
	table_master.append(tableheader);

	// iterate over sessions and fill table
	for (let i = 0; i < currentsessions.length; i++) {
		let thisline = document.createElement("tr");
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
    // make indicator for difficulty
		var thisline_difficulty_indicator = document.createElement("div");
    thisline_difficulty_indicator.style.padding = "0px";
    thisline_difficulty_indicator.style.display = "inline-block";
    thisline_difficulty_indicator.style.height = "calc(1.25vmin)";
    thisline_difficulty_indicator.style.width = "calc(1.5vmin)";
    thisline_difficulty_indicator.style.padding = "0";
    thisline_difficulty_indicator.style.margin = "0";
    thisline_difficulty_indicator.style.paddingLeft = "calc(0.3vmin)";
    thisline_difficulty_indicator.style.paddingTop = "calc(0.3vmin)";
    thisline_difficulty_indicator.style.marginRight = "calc(1.0vmin)";
    thisline_difficulty_indicator.style.clipPath = generic_puzzlepiece_shape;
    thisline_difficulty_indicator.style.background = difficultybutton_backgrounds[currentsessions[i].difficulty];

    // uses rotation for pieces
    var rotationimage;
    if (currentsessions[i].userotation) {
      rotationimage = document.createElement("img");
      rotationimage.src = "img/icons/reloadicon.png";
      rotationimage.style.maxHeight = "calc(1.5vmin)";
      rotationimage.style.paddingLeft = "calc(0.0vmin)";
      rotationimage.style.marginLeft = "calc(-0.3vmin)";
      rotationimage.style.paddingTop = "calc(0.3vmin)";
      rotationimage.style.paddingRight = "calc(0.6vmin)";
    }

    // name
    var thisline_name = document.createElement("th");
		thisline_name.append(thisline_difficulty_indicator);
    if (currentsessions[i].userotation) {
		  thisline_name.append(rotationimage);
    } else {
      thisline_difficulty_indicator.style.marginRight = "calc(2.7vmin)";
    }
    thisline_name.style.paddingLeft = "calc(0.5vmin)";
		thisline_name.append(currentsessions[i].name);

    // progress
    var thisline_pieces = document.createElement("th");
    thisline_pieces.innerHTML = currentsessions[i].currentconnections + "/" + currentsessions[i].totalconnections;
    thisline_pieces.style.paddingLeft = "calc(1.0vw)";

    // players
    var thisline_players = document.createElement("th");
    thisline_players.innerHTML = currentsessions[i].currentplayers + "/" + currentsessions[i].maxplayers;
    thisline_players.style.paddingLeft = "calc(1.0vw)";
    thisline.append(thisline_passphrase);
    thisline.append(thisline_name);
    thisline.append(thisline_pieces);
    thisline.append(thisline_players);
    table_master.append(thisline);

    // highlighting of entry that mouse is pointing at
    thisline.addEventListener("mouseenter", (event) => {
    	thisline.style.outline = "calc(0.3vmin) solid rgba(255,255,255,0.5)";
    });
    thisline.addEventListener("mouseleave", (event) => {
    	thisline.style.outline = "none";
    });
    // enter session on dblclick with left mousebutton
    thisline.addEventListener("dblclick", (event) => {
        if (event.which === 1) {
            trying_to_join_session = true;
            trying_to_join_session_id = currentsessions[i].sessionid;
            // check if passphrase is required; open dialog if necessary
            if (currentsessions[i].bpassphrase) {
              // place dialog
              var boundingbox = thisline.getBoundingClientRect();
              document.getElementById("div_passphrase_fancy_background").style.left = boundingbox.left + "px";
              document.getElementById("div_passphrase_fancy_background").style.top = "calc(0.3vmin + " + boundingbox.bottom + "px)";

              // add noblur focus
              div_passphrase_fancy_noblurfocuscontainer = document.getElementById("div_passphrase_fancy_noblurfocuscontainer");
              // remove previous contents
              div_passphrase_fancy_noblurfocuscontainer.textContent = "";
              // add copy of current table
              var boundingbox = table_master.getBoundingClientRect();
              var table_master_copy = table_master.cloneNode(true);
              div_passphrase_fancy_noblurfocuscontainer.style.left = boundingbox.left + "px";
              div_passphrase_fancy_noblurfocuscontainer.style.top = boundingbox.top + "px";
              div_passphrase_fancy_noblurfocuscontainer.append(table_master_copy);

              // reset text input field
              document.getElementById("div_passphrase_fancy_input").value = "";

              document.getElementById("div_passphrase_fancy").style.display = "";
            } else {
              // disable controls
              document.getElementById("div_lobby_content_profile_settings_nameinput").style.opacity = "0.5";
              document.getElementById("div_lobby_content_profile_settings_color").style.opacity = "0.5";
              document.getElementById("div_lobby_content_games_refreshlist").style.opacity = "0.5";
              document.getElementById("div_lobby_content_games_newgame").style.opacity = "0.5";
              document.getElementById("div_lobby_content_games_list").style.opacity = "0.5";
              document.getElementById("div_lobby_blockerdiv").style.display = "";
              // show that the game is waiting for response
              document.getElementById("div_waitingscreen_fancy").style.display = "flex";

              iosocket.emit('iWantToEnterSession', trying_to_join_session_id);
            }
        }
    });
	}
}

// update placement of highlights for picked up pieces
function updateHighlightPositioning() {
    for (const highlight of currenthighlights) {
        highlight.divcontainer.style.left = thiscamera.getx_px(highlight.piece.x) + "px";
        highlight.divcontainer.style.top = thiscamera.gety_px(highlight.piece.y) + "px";
    }
}

// update placement of highlights for picked up pieces
function updateBorderPositioning() {
    var left_px = (Math.floor(thiscamera.getx_px(game_boundary_left)) + 1);
    var right_px = (Math.floor(thiscamera.getx_px(game_boundary_right)) + 1);
    var top_px = (Math.floor(thiscamera.gety_px(game_boundary_top)) + 1);
    var bottom_px = (Math.floor(thiscamera.gety_px(game_boundary_bottom)) + 1);
    var topbottomwidth_px = right_px - left_px;
    var height_px = bottom_px - top_px;

    div_game_boundaryoverlay_left.style.left = "calc(" + left_px + "px - 100%)";
    div_game_boundaryoverlay_right.style.left = right_px + "px";
    div_game_boundaryoverlay_top.style.top = "calc(" + top_px + "px - 100%)";
    div_game_boundaryoverlay_top.style.left = left_px + "px";
    div_game_boundaryoverlay_top.style.width = topbottomwidth_px + "px";
    div_game_boundaryoverlay_bottom.style.top = bottom_px + "px";
    div_game_boundaryoverlay_bottom.style.left = left_px + "px";
    div_game_boundaryoverlay_bottom.style.width = topbottomwidth_px + "px";

    div_game_boundaryoverlay_border.style.width = topbottomwidth_px + "px";
    div_game_boundaryoverlay_border.style.height = height_px + "px";
    div_game_boundaryoverlay_border.style.top = top_px + "px";
    div_game_boundaryoverlay_border.style.left = left_px + "px";
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
    document.getElementById("div_lobby_content_newgame_settings_use_rotation_check").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_competitive_check").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_passphrase").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_piecesperlength_container").style.opacity = "1";
    document.getElementById("div_lobby_content_newgame_settings_maxplayers_container").style.opacity = "1";
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

// custom confirm dialog
function createConfirmDialog(somemsg, somecallback) {
    var div_confirm_fancy_p = document.getElementById("div_confirm_fancy_p");
    div_confirm_fancy_p.innerHTML = somemsg;

    // set action on confirm by creating a copy of the template button with eventlistener
    // clear previous
    div_confirm_fancy_p.remove();
    var div_confirm_fancy_confirmbutton_old = document.getElementById("div_confirm_fancy_confirmbutton_copy");
    if (div_confirm_fancy_confirmbutton_old !== null) div_confirm_fancy_confirmbutton_old.remove();
    var div_confirm_fancy_cancelbutton = document.getElementById("div_confirm_fancy_cancelbutton");
    div_confirm_fancy_cancelbutton.remove();
    document.getElementById("div_confirm_fancy_background_p_container").innerHTML = "";

    // make new
    var div_confirm_fancy_confirmbutton_copy = document.getElementById("div_confirm_fancy_confirmbutton");
    div_confirm_fancy_confirmbutton_copy = div_confirm_fancy_confirmbutton_copy.cloneNode(true);
    div_confirm_fancy_confirmbutton_copy.id = "div_confirm_fancy_confirmbutton_copy";
    div_confirm_fancy_confirmbutton_copy.style.display = "grid";
    document.getElementById("div_confirm_fancy_background_p_container").append(div_confirm_fancy_p, div_confirm_fancy_confirmbutton_copy, div_confirm_fancy_cancelbutton);

    div_confirm_fancy_confirmbutton_copy.addEventListener("click", (event) => {
        somecallback();
        document.getElementById("div_alert_fancy").style.display = "none";
    });

    document.getElementById("div_confirm_fancy").style.display = "flex";
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
            dragged_piece.z = z;
            dragged_piece.divcontainer.style.zIndex = dragged_piece.z;
            dragged_piece.divedgeshadowcontainer_bg.style.backgroundColor = colorbutton_colors[myColorID];
            dragged_piece.divedgehighlightcontainer_bg.style.backgroundColor = colorbutton_colors[myColorID];
            autopan_camera_onlyjustpickedup = true;
            // apply changes to all pieces within partition
            for (const piece of dragged_piece.partition) {
                piece.z = z;
                piece.divcontainer.style.zIndex = piece.z;
                piece.divedgeshadowcontainer_bg.style.backgroundColor = colorbutton_colors[myColorID];
                piece.divedgehighlightcontainer_bg.style.backgroundColor = colorbutton_colors[myColorID];
            }
        } else {
            iosocket.emit('iWantToDropPiece');
        }
    });
    // verification from server that the piece has been dropped
    iosocket.on('stopMovingPiece', ( x, y, z, angle ) => {
        if (dragged_piece) {
            dragged_piece.x = x;
            dragged_piece.y = y;
            dragged_piece.z = z;
            dragged_piece.angle = angle;
            dragged_piece.divedgeshadowcontainer_bg.style.backgroundColor = puzzlepiece_shadowcolor;
            dragged_piece.divedgehighlightcontainer_bg.style.backgroundColor = puzzlepiece_highlightcolor;
            for (const piece of dragged_piece.partition) {
                piece.z = z;
                piece.divcontainer.style.zIndex = piece.z;
                piece.divedgeshadowcontainer_bg.style.backgroundColor = puzzlepiece_shadowcolor;
                piece.divedgehighlightcontainer_bg.style.backgroundColor = puzzlepiece_highlightcolor;
            }
            dragged_piece = undefined;
            thispuzzle.updatePiecePositions();
            thispuzzle.updatePieceTransformation();
        }
        dragging_piece = false;
        try_to_drag_piece = false;
    });
    // server-issued update on puzzle piece coordinates
    iosocket.on('updatePieceCoordinates', ( i, j, x, y, z, angle ) => {
        // note: use animate for smooth transition
        thispuzzle.pieces[i][j].x = x;
        thispuzzle.pieces[i][j].y = y;
        thispuzzle.pieces[i][j].z = z;

        // handle updated angle if necessary
        if (!userotation || (thispuzzle.pieces[i][j].angle === angle && typeof(thispuzzle.pieces[i][j].rotation_timer) === 'undefined')) {
            // apply changes to all pieces within partition
            var cosangle = Math.cos(thispuzzle.pieces[i][j].angle*Math.PI/2);
            var sinangle = Math.sin(thispuzzle.pieces[i][j].angle*Math.PI/2);
            for (const piece of thispuzzle.pieces[i][j].partition) {
                // get coordinates
                var deltax = (piece.x0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].x0[thispuzzle.pieces[i][j].angle]) * cosangle
                              - (piece.y0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].y0[thispuzzle.pieces[i][j].angle]) * sinangle;
                var deltay = (piece.x0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].x0[thispuzzle.pieces[i][j].angle]) * sinangle
                              + (piece.y0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].y0[thispuzzle.pieces[i][j].angle]) * cosangle;
                piece.x = thispuzzle.pieces[i][j].x + deltax;
                piece.y = thispuzzle.pieces[i][j].y + deltay;
                piece.z = z;
            }

            thispuzzle.updatePiecePositions();
            // update placement of highlights for picked up pieces
            updateHighlightPositioning();
        } else {
            // check if this partition is already animated
            if (thispuzzle.pieces[i][j].angle === angle) {
                return;
            } else {
                if (typeof(thispuzzle.pieces[i][j].rotation_timer) === 'undefined') {
                    clearInterval(thispuzzle.pieces[i][j].rotation_timer);
                    for (const piece of thispuzzle.pieces[i][j].partition) {
                        piece.rotation_timer = undefined;
                    }
                    // apply changes to all pieces within partition
                    var cosangle = Math.cos(thispuzzle.pieces[i][j].angle*Math.PI/2);
                    var sinangle = Math.sin(thispuzzle.pieces[i][j].angle*Math.PI/2);
                    for (const piece of thispuzzle.pieces[i][j].partition) {
                        // get coordinates
                        var deltax = (piece.x0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].x0[thispuzzle.pieces[i][j].angle]) * cosangle
                                      - (piece.y0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].y0[thispuzzle.pieces[i][j].angle]) * sinangle;
                        var deltay = (piece.x0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].x0[thispuzzle.pieces[i][j].angle]) * sinangle
                                      + (piece.y0[thispuzzle.pieces[i][j].angle] - thispuzzle.pieces[i][j].y0[thispuzzle.pieces[i][j].angle]) * cosangle;
                        piece.x = thispuzzle.pieces[i][j].x + deltax;
                        piece.y = thispuzzle.pieces[i][j].y + deltay;
                    }
                }
            }
            for (const piece of thispuzzle.pieces[i][j].partition) {
                piece.angle = angle;
            }

            thispuzzle.pieces[i][j].rotate_anim_start = (angle - 1 + 4)%4;
            thispuzzle.pieces[i][j].rotate_anim_end = (angle - 1 + 4)%4 + 1;

            // helper that is repeatedly called during animation
            var rotatefunction = function(x) {
                // animate with sigmoid-curve (from 0 to 1)
                var rotate_anim_current0 = 0 + (2.0/(1.0 + Math.exp(-5.0*x))-1.0);

                // loop entire partition
                for (const piece of thispuzzle.pieces[i][j].partition) {
                    piece.rotate_anim_current = rotate_anim_current0;
                    piece.animation_angle = piece.rotate_anim_start + (piece.rotate_anim_end - piece.rotate_anim_start) * rotate_anim_current0;
                    // calculate transformation for individual pieces (translation)
                    var translateX_current = piece.rotate_anim_current * thiscamera.getlength_px(piece.angleoffset[piece.rotate_anim_end%4][0])
                                             + (1 - piece.rotate_anim_current) * thiscamera.getlength_px(piece.angleoffset[piece.rotate_anim_start%4][0]);
                    var translateY_current = piece.rotate_anim_current * thiscamera.getlength_px(piece.angleoffset[piece.rotate_anim_end%4][1])
                                             + (1 - piece.rotate_anim_current) * thiscamera.getlength_px(piece.angleoffset[piece.rotate_anim_start%4][1]);

                    var transformstring = "rotate(" + piece.animation_angle*90 + "deg) translateX(" + translateX_current + "px) translateY(" + translateY_current + "px) scale(" + thiscamera.zoom + ")";

                    // apply that transformation
                    piece.divcontainer.style.transform = transformstring;
                    piece.divedgeshadowcontainer.style.transform = transformstring;
                    piece.divedgehighlightcontainer.style.transform = transformstring;

                    // calculate the relative shift for pieces in partition (other than that of the piece that is being rotated)
                    if (piece.i !== i || piece.j !== j) {
                        // entries of rotation matrix
                        var cosangle = Math.cos(piece.animation_angle*Math.PI/2);
                        var sinangle = Math.sin(piece.animation_angle*Math.PI/2);
                        // get interpolated relative vector for correct positioning (changing corner of reference)
                        var interpolatedx = piece.rotate_anim_current * (piece.x0[piece.rotate_anim_end%4] - thispuzzle.pieces[i][j].x0[piece.rotate_anim_end%4])
                                            + (1 - piece.rotate_anim_current) * (piece.x0[piece.rotate_anim_start%4] - thispuzzle.pieces[i][j].x0[piece.rotate_anim_start%4]);
                        var interpolatedy = piece.rotate_anim_current * (piece.y0[piece.rotate_anim_end%4] - thispuzzle.pieces[i][j].y0[piece.rotate_anim_end%4])
                                            + (1 - piece.rotate_anim_current) * (piece.y0[piece.rotate_anim_start%4] - thispuzzle.pieces[i][j].y0[piece.rotate_anim_start%4]);
                        // transform relative position
                        var deltax = interpolatedx*cosangle - interpolatedy*sinangle;
                        var deltay = interpolatedx*sinangle + interpolatedy*cosangle;

                        // position piece accordingly
                        piece.x = thispuzzle.pieces[i][j].x + deltax;
                        piece.y = thispuzzle.pieces[i][j].y + deltay;
                    }

                    // update div positioning
                    piece.divcontainer.style.left = thiscamera.getx_px(piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
                    piece.divcontainer.style.top = thiscamera.gety_px((piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
                    // position shadows & highlights of piece
                    piece.divedgeshadowcontainer.style.left = thiscamera.getx_px(-puzzlepiece_shadows_highlights_offset*piece.parentpuzzle.averagetilesize + piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
                    piece.divedgeshadowcontainer.style.top = thiscamera.gety_px(( puzzlepiece_shadows_highlights_offset*piece.parentpuzzle.averagetilesize + piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
                    // position shadows & highlights of piece
                    piece.divedgehighlightcontainer.style.left = thiscamera.getx_px( puzzlepiece_shadows_highlights_offset*piece.parentpuzzle.averagetilesize + piece.x - (piece.x0[0] - piece.pathouter[0][0])) + "px";
                    piece.divedgehighlightcontainer.style.top = thiscamera.gety_px((-puzzlepiece_shadows_highlights_offset*piece.parentpuzzle.averagetilesize + piece.y - (piece.y0[0] - piece.pathouter[0][1]))) + "px";
                }
                updateHighlightPositioning();
            };

            thispuzzle.pieces[i][j].rotation_timer = animate(200, rotatefunction, function() {
                rotatefunction(100);

                for (const piece of thispuzzle.pieces[i][j].partition) {
                    // remove reference timer (signal that animation is done)
                    piece.rotation_timer = undefined;
                }
            });
            // save that reference in other piece of same partition to detect rotation if issued on another tile
            for (const piece of thispuzzle.pieces[i][j].partition) {
                piece.rotation_timer = thispuzzle.pieces[i][j].rotation_timer;
                piece.rotate_anim_start = thispuzzle.pieces[i][j].rotate_anim_start;
                piece.rotate_anim_end = thispuzzle.pieces[i][j].rotate_anim_end;
            }

        }
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
        thispuzzle.updatePieceTransformation();
    });
	// receiving confirmation to enter session + necessary info
	iosocket.on('enterThisSession', ( sessionobject ) => {


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

            userotation = sessionobject.userotation;
            competitive = sessionobject.competitive;
            if (competitive) {
                // show max- and minimize buttons for scores
                document.getElementById("div_game_stats_fancy_minimizebutton").style.display = "";
                document.getElementById("div_game_stats_minimized_fancy_maximizebutton").style.display = "";
            } else {
                // hide those buttons
                document.getElementById("div_game_stats_fancy_minimizebutton").style.display = "none";
                document.getElementById("div_game_stats_minimized_fancy_maximizebutton").style.display = "none";
            }

            game_boundary_left = 0.5 - sessionobject.puzzle.dimensions[0] * game_boundary_baserange;
            game_boundary_right = 0.5 + sessionobject.puzzle.dimensions[0] * game_boundary_baserange;
            game_boundary_top = 0.5 - sessionobject.puzzle.dimensions[1] * game_boundary_baserange;
            game_boundary_bottom = 0.5 + sessionobject.puzzle.dimensions[1] * game_boundary_baserange;


            // update progress indicator
            document.getElementById("div_game_progress_label").innerHTML = sessionobject.currentconnections + "/" + sessionobject.totalconnections;

            // ensure natural dimensions of img motif have been loaded
            var preloadimg = document.createElement('img');
            preloadimg.addEventListener("load", (event) => {
                // fail-safe, if this listener happens to be triggered before that in puzzle-constructor
                thispuzzle.dimensions_px[0] = preloadimg.naturalWidth;
                thispuzzle.dimensions_px[1] = preloadimg.naturalHeight;

                // create camera with appropriate length scale setting
                thiscamera = new camera(thispuzzle.dimensions_px[0]/thispuzzle.dimensions[0]);
                backgroundposition = [0, 0];

                // finalize puzzle setup
                thispuzzle.readPieceCoordinates(sessionobject.puzzle.pieces);
                thispuzzle.readPieceShapes(sessionobject.puzzle.pieces);
                thispuzzle.make_puzzlepiece_tiling(sessionobject.difficulty, thisrng);
                thispuzzle.generatePieceClippaths();
                thispuzzle.updatePiecePositions();
                thispuzzle.updatePieceTransformation();
                thispuzzle.insertPieces(sessionobject.puzzle.pieces);
                updateBorderPositioning();

                // set up event listeners for picking up puzzle piece
                // see setup_game() for remaining logic on moving pieces
                for (let i = 0; i < thispuzzle.layout[0]; i++) {
                    for (let j = 0; j < thispuzzle.layout[1]; j++) {
                        // request pick up on mousedown on piece
                        thispuzzle.pieces[i][j].img.addEventListener("mousedown", (event) => {
                            if (event.which === 1 && !dragging_piece) {
                                event.stopPropagation();
                                try_to_drag_piece = true;
                                // save required properties
                                dragging_piece_mousedown_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
                                piece_mouselocation = [thispuzzle.pieces[i][j].x, thispuzzle.pieces[i][j].y];
                                iosocket.emit('iWantToPickUpPiece', i, j);
                            }
                        });
                        thispuzzle.pieces[i][j].img.addEventListener("contextmenu", (event) => {
                            if (userotation) {
                                if (!dragging_piece && !try_to_drag_piece) {
                                    iosocket.emit('iWantToTurnAPiece', i, j);

                                    event.stopPropagation();
                                    event.preventDefault();
                                }
                                if (dragging_piece) {
                                    iosocket.emit('iWantToMoveMyPiece', dragged_piece.x, dragged_piece.y, dragged_piece.angle + 1);

                                    event.stopPropagation();
                                    event.preventDefault();
                                }
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
                        // update page title
                        document.title = "yaps • " + sessionobject.name;

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
        // style and setting up div with nameplate
        var highlightcontainer = document.createElement('div');
        highlightcontainer.style.position = "absolute";
        var left = thispuzzle.pieces[i][j].divcontainer.offsetLeft;
        var top = thispuzzle.pieces[i][j].divcontainer.offsetTop;
        highlightcontainer.style.left = left + "px";
        highlightcontainer.style.top = top + "px";
        highlightcontainer.style.zIndex = 2147483639;

        var highlightcontainer_marker = document.createElement('div');
        var highlightcontainer_name = document.createElement('div');
        highlightcontainer.append(highlightcontainer_marker);
        highlightcontainer.append(highlightcontainer_name);
        highlightcontainer_marker.style.position = "absolute";
        highlightcontainer_marker.style.width = "calc(2.5vmin)";
        highlightcontainer_marker.style.height = "calc(2.5vmin)";
        highlightcontainer_marker.style.borderRadius = "50%";
        highlightcontainer_marker.style.outline = "calc(0.25vmin) solid #ffffff";
        highlightcontainer_marker.style.background = colorbutton_backgrounds[colorID];
        highlightcontainer_marker.style.zIndex = 1;
        highlightcontainer_marker.style.top = "0px";
        highlightcontainer_name.style.position = "absolute";
        highlightcontainer_name.innerHTML = name;
        highlightcontainer_name.style.padding = "calc(0.25vmin)";
        highlightcontainer_name.style.paddingRight = "calc(1vmin)";
        highlightcontainer_name.style.paddingLeft = "calc(4vmin)";
        highlightcontainer_name.style.fontFamily = "Arial, sans-serif";
        highlightcontainer_name.style.color = "#ffffff";
        highlightcontainer_name.style.fontSize = "calc(2.5vmin)";
        highlightcontainer_name.style.height = "calc(2.5vmin)";
        highlightcontainer_name.style.borderRadius = "10px";
        highlightcontainer_name.style.backgroundColor = "rgba(50,50,50,0.5)";
        highlightcontainer_name.style.zIndex = 0;
        highlightcontainer_name.style.top = "calc(-0.25vmin)";

        // make object out of this
        currenthighlights.push({"piece": thispuzzle.pieces[i][j], "player": {"color": colorID, "name": name}, "divcontainer": highlightcontainer});

        // do transition
        highlightcontainer.style.opacity = 0;
        document.getElementById("div_game").append(highlightcontainer);
        fadeto(highlightcontainer, 0.0, 1.0, 100);
    });
    iosocket.on('unhighlightPiece', ( i, j ) => {
        // check if corresponding highlight exists
        for (var k = 0; k < currenthighlights.length; k++) {
            if (currenthighlights[k].piece.i === i && currenthighlights[k].piece.j === j) {
                // fade out the correct one
                fadeto(currenthighlights[k].divcontainer, 1.0, 0.0, 100,
                    function() {
                        // check again, to make sure nothing has changed
                        for (var k = 0; k < currenthighlights.length; k++) {
                            if (currenthighlights[k].piece.i === i && currenthighlights[k].piece.j === j) {
                                currenthighlights[k].divcontainer.remove();
                                currenthighlights.splice(k, 1);
                            }
                        }
                    }
                );
            }
        }
    });
    iosocket.on('updatePuzzleProgress', ( currentconnections ) => {
        document.getElementById("div_game_progress_label").innerHTML = currentconnections + "/" + thispuzzle.totaledges;
    });
    iosocket.on('confirmKickPlayer', ( somename ) => {
        createConfirmDialog("Do you really want to permanently exclude player '" + somename + "' from this session?", function(){
            iosocket.emit('iWantToConfirmKickPlayer');
        });
    });
    // prepare/update table in the current player list window
    iosocket.on('currentStats', ( currentStats, iAmTheHost ) => {
        // create table and place empty table into corresponding div
        var table_master = document.createElement("table");
        table_master.classList.add('sessionlist');

        // create header
        var tableheader = document.createElement("tr");
        tableheader.style.fontSize = "calc(3.0vmin)";
        var tableheader_color = document.createElement("th");
        tableheader_color.innerHTML = "";
        tableheader_color.style.width = "calc(4vmin)";
        tableheader.append(tableheader_color);
        // if competitive game make room for made connections column
        if (competitive) {
            var tableheader_name = document.createElement("th");
            tableheader_name.innerHTML = "Name";
            tableheader_name.style.width = "calc(25vmin)";
            tableheader_name.style.paddingLeft = "calc(1vmin)";
            tableheader.append(tableheader_name);
            var tableheader_connections = document.createElement("th");
            tableheader_connections.innerHTML = "Connections";
            tableheader_connections.style.width = "calc(25vmin)"
            tableheader_connections.style.paddingLeft = "calc(1vmin)";
            tableheader.append(tableheader_connections);
        } else {
            var tableheader_name = document.createElement("th");
            tableheader_name.innerHTML = "Name";
            tableheader_name.style.width = "calc(50vmin)";
            tableheader_name.style.paddingLeft = "calc(1vmin)";
            tableheader.append(tableheader_name);
        }
        if (iAmTheHost) {
            var tableheader_kickplayer = document.createElement("th");
            tableheader_kickplayer.innerHTML = "";
            tableheader_kickplayer.style.width = "calc(4vmin)";
            tableheader.append(tableheader_kickplayer);
        }
        table_master.append(tableheader);
        for (let i = 0; i < currentStats.length; i++) {
            let thisline = document.createElement("tr");
            thisline.style.fontSize = "calc(2.5vmin)";

            // make colorID indicator
            var thisline_color = document.createElement("th");
            var thisline_color_indicator = document.createElement("div");
            thisline_color_indicator.style.width = "calc(2.5vmin)";
            thisline_color_indicator.style.height = "calc(2.5vmin)";
            thisline_color_indicator.style.borderRadius = "50%";
            thisline_color_indicator.style.outline = "calc(0.25vmin) solid #ffffff";
            thisline_color_indicator.style.background = colorbutton_backgrounds[currentStats[i].colorID];
            thisline_color_indicator.style.marginLeft = "calc(0.75vmin)";
            thisline_color.append(thisline_color_indicator);
            thisline.append(thisline_color);

            var thisline_name = document.createElement("th");
            if (currentStats[i].isHost) {
                var lockimage = document.createElement("img");
                lockimage.src = "img/icons/crownicon.png";
                lockimage.style.maxHeight = "calc(3.0vmin)";
                lockimage.style.paddingLeft = "calc(0.6vmin)";
                lockimage.style.paddingRight = "calc(0.6vmin)";
                lockimage.style.marginBottom = "calc(-0.5vmin)";
                thisline_name.style.paddingLeft = "calc(0.2vmin)";
            } else {
                var lockimage = "";
                thisline_name.style.paddingLeft = "calc(1vmin)";
            }
            thisline_name.append(lockimage);
            thisline_name.append(currentStats[i].name);
            thisline.append(thisline_name);

            if (competitive) {
                var thisline_connections = document.createElement("th");
                thisline_connections.style.paddingLeft = "calc(1vmin)";
                thisline_connections.append(currentStats[i].sessionConnectionCounter + " (Player Total: " + currentStats[i].connectionCounter + ")");
                thisline.append(thisline_connections);
            }

            if (iAmTheHost) {
                var thisline_kickplayer = document.createElement("th");
                thisline_kickplayer.innerHTML = "";

                if (!currentStats[i].isHost) {
                    var thisline_kickplayer_button = document.createElement("button");
                    thisline_kickplayer_button.classList.add("fancybutton");
                    thisline_kickplayer_button.style.margin = "calc(0.2vmin)";
                    thisline_kickplayer_button.style.display = "grid";
                    thisline_kickplayer_button.style.alignItems = "center";

                    var thisline_kickplayer_button_img = document.createElement("img");
                    thisline_kickplayer_button_img.setAttribute("width", "95%");
                    thisline_kickplayer_button_img.setAttribute("draggable", "false");
                    thisline_kickplayer_button_img.style.position = "relative";
                    thisline_kickplayer_button_img.style.left = "2.5%";
                    thisline_kickplayer_button_img.src = "img/icons/aborticon.png";
                    thisline_kickplayer_button.append(thisline_kickplayer_button_img);
                    thisline_kickplayer.append(thisline_kickplayer_button);

                    thisline_kickplayer_button.addEventListener("click", (event) => {
                        iosocket.emit('iWantToKickPlayer', i);
                        event.stopPropagation();
                    });
                }
                thisline.append(thisline_kickplayer);
            }
            table_master.append(thisline);
        }

        var div_game_stats_fancy_background = document.getElementById("div_game_stats_fancy_background");
        div_game_stats_fancy_background.innerHTML = '';
        div_game_stats_fancy_background.append(table_master);

        if (competitive) {
            // update scores for minimized window
            var sortedscores = currentStats.sort(function(a, b){return b.sessionConnectionCounter - a.sessionConnectionCounter});

            var table_master_mini = document.createElement("table");
            table_master_mini.classList.add('scorelist');
            for (var i = 0; i < sortedscores.length; i++) {
                var thisline = document.createElement("tr");
                thisline.style.fontSize = "calc(2.5vmin)";

                var thisline_color = document.createElement("th");
                var thisline_color_indicator = document.createElement("div");
                thisline_color_indicator.style.width = "calc(1.5vmin)";
                thisline_color_indicator.style.height = "calc(1.5vmin)";
                thisline_color_indicator.style.borderRadius = "50%";
                thisline_color_indicator.style.outline = "calc(0.15vmin) solid #ffffff";
                thisline_color_indicator.style.background = colorbutton_backgrounds[sortedscores[i].colorID];
                thisline_color_indicator.style.marginRight = "calc(1.0vmin)";
                thisline_color_indicator.style.width = "calc(1.5vmin)";
                thisline_color.append(thisline_color_indicator);
                thisline.append(thisline_color);

                var thisline_name = document.createElement("th");
                thisline_name.style.width = "calc(15vmin)";
                thisline_name.append(sortedscores[i].name);
                thisline.append(thisline_name);

                var thisline_score = document.createElement("th");
                thisline_score.style.width = "calc(5vmin)";
                thisline_score.append(sortedscores[i].sessionConnectionCounter);
                thisline.append(thisline_score);

                table_master_mini.append(thisline);
            }
            var div_game_stats_minimized_fancy_background = document.getElementById("div_game_stats_minimized_fancy_background");
            div_game_stats_minimized_fancy_background.innerHTML = '';
            div_game_stats_minimized_fancy_background.append(table_master_mini);
        }
    });
    iosocket.on('youCanLeave', ( ) => {
        // get references to div's that are required below
        var div_lobby = document.getElementById("div_lobby");
        var div_game = document.getElementById("div_game");

        // drop held piece/partition
        dragging_piece = false;
        if (typeof(autopan_camera_timer) !== 'undefined') {
            clearInterval(autopan_camera_timer);
            autopan_camera_timer = undefined;
            autopan_camera_delta_px = [0, 0];
        }

        // cleanup game
        for (var i = 0; i < thispuzzle.layout[0]; i++) {
            for (var j = 0; j < thispuzzle.layout[1]; j++) {
                thispuzzle.pieces[i][j].divcontainer.remove();
                thispuzzle.pieces[i][j].divedgeshadowcontainer.remove();
                thispuzzle.pieces[i][j].divedgehighlightcontainer.remove();
            }
        }
        thispuzzle = undefined;

        // close all dialogs
        document.getElementById("div_game_stats_fancy").style.display = "none";
        document.getElementById("div_game_stats_minimized_fancy").style.display = "none";
        document.getElementById("div_game_settings_fancy").style.display = "none";
        document.getElementById("div_game_closingsoon").style.display = "none";
        if (typeof(session_shutdown_timer) !== 'undefined') {
            clearInterval(session_shutdown_timer);
            session_shutdown_timer = undefined;
        }

        // fade back to lobby
        fadeto(document.getElementById("div_game"), 1.0, 0.0, 100,
            function(){
                // reset document title
                document.title = "yaps";

                div_game.style.display = "none";
                div_game.style.backgroundSize = 100+"%";
                div_game.style.backgroundPosition = "left " + 0 + "px top " + 0 + "px";
                div_lobby.style.opacity = 0;
                div_lobby.style.display = "";
                fadeto(div_lobby, 0.0, 1.0, 100);
            }
        );
    });
    // create small window showing time until timeout of session
    iosocket.on('startSessionTimeout', ( timeout0, reason ) => {
        // show timer window
        document.getElementById("div_game_closingsoon_label").innerHTML = Math.floor(timeout0/60) + ':' + (timeout0%60 < 10 ? '0' : '') + timeout0%60;
        document.getElementById("div_game_closingsoon").style.opacity = "0";
        document.getElementById("div_game_closingsoon").style.display = "";
        fadeto(document.getElementById("div_game_closingsoon"), 0.0, 1.0, 100);

        // show dialog if reason is given
        if (typeof(reason) === 'string') createAlertDialog('This session will be closed soon (' + reason + ').');

        // remove previous timer
        if (typeof(session_shutdown_timer) !== 'undefined') {
            clearInterval(session_shutdown_timer);
            session_shutdown_timer = undefined;
        }

        // setup new timer
        session_shutdown_timer_remaining = timeout0;
        session_shutdown_timer = setInterval(function() {
            document.getElementById("div_game_closingsoon_label").innerHTML = Math.floor(session_shutdown_timer_remaining/60) + ':' + (session_shutdown_timer_remaining%60 < 10 ? '0' : '') + session_shutdown_timer_remaining%60;
            if (session_shutdown_timer_remaining === 0) {
                clearInterval(session_shutdown_timer);
                session_shutdown_timer = undefined;
            } else {
                session_shutdown_timer_remaining--;
            }
        }, 1000);
    });
    // remove small window showing time until timeout of session
    iosocket.on('stopSessionTimeout', ( ) => {
        if (typeof(session_shutdown_timer) !== 'undefined') {
            clearInterval(session_shutdown_timer);
            session_shutdown_timer = undefined;
        }
        fadeto(document.getElementById("div_game_closingsoon"), 1.0, 0.0, 100,
            function(){
                document.getElementById("div_game_closingsoon").style.display = "none";
                document.getElementById("div_game_closingsoon").style.opacity = "1";
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
	// ##################          Help Window              ############################################
	// #################################################################################################

    var helpwindow_current_frame = -1;
    var helpwindow_open = false;
    const helpwindow_number_of_frames = 23;
    const helpwindow_frame_files = ["helpA1", "helpA2",
                                    "helpB1", "helpB3", "helpB4", "helpB5", "helpB6", "helpB7", "helpB8", "helpB2",
                                    "helpC2", "helpC3", "helpC4", "helpC5", "helpC6", "helpC7", "helpC8", "helpC1",
                                    "helpD1", "helpD2", "helpD4", "helpD3",
                                    "helpF1"];
    var helpwindow_preloaded_frames = [];
    var helpwindow_navigation_buttons = [];
    const helpwindow_frame_descriptions = ["Profile Setup: Enter your name at the top. This name will be shown to other players.", "Profile Setup: Select a color at the bottom. This color identifier will be displayed alongside your name.",
                                           "These are the currently listed sessions. You can join a session by double-clicking.", "The lock-icon idicates the requirement for a passphrase to enter the session.", "The tile-icon represents the tile shape difficulty, i.e. how recognizable the edges of the pieces are. The difficulty is ranked from copper over silver and gold to diamond.", "Here an icon is shown if the puzzle pieces can and have to be rotated to solve the puzzle. Otherwise, all tiles are already in their correct orientation.", "Those icons are followed by the name of the session.", "This column shows the current progress of the game. The first number corresponds to the number of already established connections whereas the second is the total number of connections needed for a completed puzzle.", "The last column shows the current and maximum number of players in a session.", "These buttons allow you to refresh the currently listed sessions or begin setting up your own.",
                                           "When creating your own session, there are several settings you can choose from. In the highlighted box you can enter the session's name.", "If you like, you can enable the passphrase-requirement and enter the respective passphrase in the corresponding box.", "This setting determines the number of pieces into which your motif will be cut. Note that the value is given in relation to the motif's longer edge, i.e. horizontally for an image in landscape format or vertically for one in a portrait format, respectively.", "Here you can select the maximum number of players you want to allow into your session.", "Here you can select the difficulty. Copper through gold correspond to the well-known characteristic shape of jigsaw puzzle pieces but with decreasingly distinctive features, whereas the diamond setting yields flat edges for all pieces.", "Here you can select whether rotation of tiles is required and whether or not to keep track of connections made per player (which will be visible to all players in a session).", "Use the file selection dialog or simply drag an image from your disk onto the respective button to select an image as puzzle motif. After the file has been selected, you will see a small preview.", "Finally, these buttons can either start the currently configured session or get you back to the list of already running sessions.",
                                           "The in-game controls used in yaps mostly rely on mouse. You can use the shift-key to adjust the zoom more precisely.", "In the bottom right there is a list of buttons which give you quick access to several additional features. For example, the toggle button for shadows of puzzle pieces can be used to find pieces that are hidden behind others.", "The top right contains a progress counter which displays the currently made connections between pieces and the number required for completion of the puzzle.", "The button at the top left lets you return to the lobby screen.",
                                           "In the list of players you can also see additional information: The host is marked by a crown symbol. If you are in a competitive session you can also see the score by player. Lastly, the current host can (permanently) kick players from this session."];

    var helpwindow_load_frame = function(index) {
        // remove old highlight
        if (helpwindow_current_frame >= 0) {
            helpwindow_navigation_buttons[helpwindow_current_frame].classList.replace('helpbuttons_active', 'helpbuttons_inactive');
        }

        // make new highlight + load image
        helpwindow_navigation_buttons[index].classList.add('helpbuttons_inactive', 'helpbuttons_active');
        div_help_fancy_img.src = "img/help/" + helpwindow_frame_files[index] + ".jpg";
        div_help_fancy_p.innerHTML = helpwindow_frame_descriptions[index];
        helpwindow_current_frame = index;
    }

    // preload images and create navigation buttons
    var div_help_fancy_navigation = document.getElementById("div_help_fancy_navigation");
    var div_help_fancy_img = document.getElementById("div_help_fancy_img");
    for (let i = 0; i < helpwindow_number_of_frames; i++) {
        // preload
        helpwindow_preloaded_frames[i] = document.createElement('img');
        helpwindow_preloaded_frames[i].src = "img/help/" + helpwindow_frame_files[i] + ".jpg";

        // create navigation buttons
        helpwindow_navigation_buttons[i] = document.createElement('div');
        helpwindow_navigation_buttons[i].classList.add('helpbuttons_inactive');
        div_help_fancy_navigation.append(helpwindow_navigation_buttons[i]);
        helpwindow_navigation_buttons[i].addEventListener("click", (event) => {
            helpwindow_load_frame(i);
            event.stopPropagation();
        });
    }

    // open window
    var div_help_fancy = document.getElementById("div_help_fancy");
    document.getElementById("div_lobby_help").addEventListener("click", (event) => {
        if (helpwindow_current_frame < 0) helpwindow_load_frame(0);
        div_help_fancy.style.display = "flex";
        helpwindow_open = true;
    });
    document.getElementById("div_game_interface_help").addEventListener("click", (event) => {
        if (helpwindow_current_frame < 0) helpwindow_load_frame(18);
        div_help_fancy.style.display = "flex";
        helpwindow_open = true;
    });
    // close window
    document.getElementById("div_help_fancy_cancelbutton").addEventListener("click", (event) => {
        div_help_fancy.style.display = "none";
        helpwindow_open = false;
    });
    document.getElementById("div_help_fancy").addEventListener("click", (event) => {
        div_help_fancy.style.display = "none";
        helpwindow_open = false;
    });
    // next frame
    document.getElementById("div_help_fancy_next").addEventListener("click", (event) => {
        helpwindow_load_frame((helpwindow_current_frame + 1)%helpwindow_number_of_frames);
        event.stopPropagation();
    });
    document.getElementById("div_help_fancy_previous").addEventListener("click", (event) => {
        helpwindow_load_frame((helpwindow_current_frame - 1 + helpwindow_number_of_frames)%helpwindow_number_of_frames);
        event.stopPropagation();
    });
    div_help_fancy.addEventListener("wheel", (event) => {
        if (event.deltaY < 0) {
          // previous
          helpwindow_load_frame((helpwindow_current_frame - 1 + helpwindow_number_of_frames)%helpwindow_number_of_frames);
        } else if (event.deltaY > 0) {
          // next
          helpwindow_load_frame((helpwindow_current_frame + 1)%helpwindow_number_of_frames);
        }
        event.stopPropagation();
    });



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
    // #########################    Confirm Dialog      ################################################
    // #################################################################################################
    var div_confirm_fancy = document.getElementById("div_confirm_fancy");
    div_confirm_fancy.addEventListener("click", (event) => {
        div_confirm_fancy.style.display = "none";
    });
    document.getElementById("div_confirm_fancy_cancelbutton").addEventListener("click", (event) => {
        div_confirm_fancy.style.display = "none";
    });

    // #################################################################################################
    // ######################     Passphrase Dialog      ###############################################
    // #################################################################################################
    var div_passphrase_fancy = document.getElementById("div_passphrase_fancy");
    div_passphrase_fancy.addEventListener("click", (event) => {
        trying_to_join_session = false;
        div_passphrase_fancy.style.display = "none";
        unlockUserInterface();
    });
    document.getElementById("div_passphrase_fancy_confirmbutton").addEventListener("click", (event) => {
        trying_to_join_session_id;
        if (trying_to_join_session && typeof(trying_to_join_session_id) === 'string') {

            // disable controls
            document.getElementById("div_lobby_content_profile_settings_nameinput").style.opacity = "0.5";
            document.getElementById("div_lobby_content_profile_settings_color").style.opacity = "0.5";
            document.getElementById("div_lobby_content_games_refreshlist").style.opacity = "0.5";
            document.getElementById("div_lobby_content_games_newgame").style.opacity = "0.5";
            document.getElementById("div_lobby_content_games_list").style.opacity = "0.5";
            document.getElementById("div_lobby_blockerdiv").style.display = "";
            // show that the game is waiting for response
            document.getElementById("div_waitingscreen_fancy").style.display = "flex";

            iosocket.emit('iWantToEnterSession', trying_to_join_session_id, document.getElementById("div_passphrase_fancy_input").value);
        }
    });
    document.getElementById("div_passphrase_fancy_input").addEventListener("click", (event) => {
        event.stopPropagation();
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
	var div_lobby_content_profile_settings_color = document.getElementById("div_lobby_content_profile_settings_color");
    var colorSelectionButtons = [];
	for (let i = 0; i < nColorSelection; i++) {
		colorSelectionButtons[i] = document.createElement('button');
		colorSelectionButtons[i].id = "div_lobby_content_profile_settings_color_button" + i;
		colorSelectionButtons[i].classList.add("colorbutton");
		colorSelectionButtons[i].style.margin = "calc(0.5vmin)";
		colorSelectionButtons[i].style.background = colorbutton_backgrounds[i];
		if (myColorID === i) colorSelectionButtons[i].style.outline = "calc(0.6vmin) solid #ffffff";
		div_lobby_content_profile_settings_color.append(colorSelectionButtons[i]);
		colorSelectionButtons[i].addEventListener("click", (event) => {
			colorSelectionButtons[myColorID].style.outline = "none";
			colorSelectionButtons[i].style.outline = "calc(0.6vmin) solid #ffffff";
			myColorID = i;
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
              && Number.isInteger(difficultySelection) && difficultySelection > -1 && difficultySelection < nDifficultySelection
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
	const nMaximumPiecesPerDirection = 30;
	var div_lobby_content_newgame_settings_piecesperlength = document.getElementById("div_lobby_content_newgame_settings_piecesperlength");
	div_lobby_content_newgame_settings_piecesperlength.addEventListener("keypress", (event) => {
		// prevent bad characters from appearing
		var lastCharacter = String.fromCharCode(event.which);
		if ("0123456789".indexOf(lastCharacter) < 0)
			event.preventDefault();
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
    // set up buttons
    document.getElementById("div_lobby_content_newgame_settings_piecesperlength_down").addEventListener("click", (event) => {
        // change value
        div_lobby_content_newgame_settings_piecesperlength.stepDown();
        // trigger event in number input
        var event = new Event('change');
        div_lobby_content_newgame_settings_piecesperlength.dispatchEvent(event);
    });
    document.getElementById("div_lobby_content_newgame_settings_piecesperlength_up").addEventListener("click", (event) => {
        // change value
        div_lobby_content_newgame_settings_piecesperlength.stepUp();
        // trigger event in number input
        var event = new Event('change');
        div_lobby_content_newgame_settings_piecesperlength.dispatchEvent(event);
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
    document.getElementById("div_lobby_content_newgame_settings_maxplayers_down").addEventListener("click", (event) => {
        // change value
        div_lobby_content_newgame_settings_maxplayers.stepDown();
        // trigger event in number input
        var event = new Event('change');
        div_lobby_content_newgame_settings_maxplayers.dispatchEvent(event);
    });
    document.getElementById("div_lobby_content_newgame_settings_maxplayers_up").addEventListener("click", (event) => {
        // change value
        div_lobby_content_newgame_settings_maxplayers.stepUp();
        // trigger event in number input
        var event = new Event('change');
        div_lobby_content_newgame_settings_maxplayers.dispatchEvent(event);
    });


	// create difficulty-select buttons
	var div_lobby_content_newgame_settings_difficulty = document.getElementById("div_lobby_content_newgame_settings_difficulty");
    var difficultySelectionbuttons = [];
	for (let i = 0; i < nDifficultySelection; i++) {
		difficultySelectionbuttons[i] = document.createElement('button');
		difficultySelectionbuttons[i].id = "div_lobby_content_newgame_settings_difficulty_button" + i;
		difficultySelectionbuttons[i].classList.add("difficultybutton");
		difficultySelectionbuttons[i].style.margin = "calc(0.5vmin)";
		difficultySelectionbuttons[i].style.background = difficultybutton_backgrounds[i];

		div_lobby_content_newgame_settings_difficulty.append(difficultySelectionbuttons[i]);
		difficultySelectionbuttons[i].addEventListener("click", (event) => {
            if (difficultySelection >= 0) {
                difficultySelectionbuttons[difficultySelection].style.outline = "none";
            }
            for (var j = 0; j < nDifficultySelection; j++) {
                if (j === i)
                    difficultySelectionbuttons[j].style.opacity = "1";
                else
                    difficultySelectionbuttons[j].style.opacity = "0.5";
            }
            difficultySelectionbuttons[i].style.outline = "calc(0.6vmin) solid #ffffff";
            difficultySelection = i;
            newSessionSettingsValid();
		});
	}


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
    // do nothing if no file has been selected
    if (typeof(div_lobby_content_newgame_settings_motiffile.files[0]) === 'undefined') {
       // if too large, revert to placeholder
      puzzlemotif = undefined;
      puzzlemotif_width = undefined;
      puzzlemotif_height = undefined;
      div_lobby_content_newgame_settings_motiffile.value = "";
      div_lobby_content_newgame_settings_motif_preview.src = "img/icons/motif_placeholder.png";
      newSessionSettingsValid();
      return;
    }
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
            document.getElementById("div_lobby_content_newgame_settings_use_rotation_check").style.opacity = "0.5";
            document.getElementById("div_lobby_content_newgame_settings_competitive_check").style.opacity = "0.5";
            document.getElementById("div_lobby_content_newgame_settings_passphrase").style.opacity = "0.5";
            document.getElementById("div_lobby_content_newgame_settings_piecesperlength_container").style.opacity = "0.5";
            document.getElementById("div_lobby_content_newgame_settings_maxplayers_container").style.opacity = "0.5";
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
                                                     "difficulty": difficultySelection,
                                                     "userotation": document.getElementById("div_lobby_content_newgame_settings_use_rotation_check").checked,
                                                     "competitive": document.getElementById("div_lobby_content_newgame_settings_competitive_check").checked,
			                                         "motif": puzzlemotif,
			                                         "motif_res": [puzzlemotif_width, puzzlemotif_height]});
		}
	});
}

function setup_game() {
    var div_game = document.getElementById("div_game");
    div_game_boundaryoverlay_left = document.getElementById("div_game_boundaryoverlay_left");
    div_game_boundaryoverlay_right = document.getElementById("div_game_boundaryoverlay_right");
    div_game_boundaryoverlay_top = document.getElementById("div_game_boundaryoverlay_top");
    div_game_boundaryoverlay_bottom = document.getElementById("div_game_boundaryoverlay_bottom");
    div_game_boundaryoverlay_border = document.getElementById("div_game_boundaryoverlay_border");
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

  // current statistics window
    document.getElementById("div_game_interface_list").addEventListener("click", (event) => {
        iosocket.emit('iNeedCurrentStats');
        document.getElementById("div_game_stats_fancy").style.display = "flex";
        document.getElementById("div_game_stats_minimized_fancy").style.display = "none";
    });
    document.getElementById("div_game_stats_fancy").addEventListener("click", (event) => {
        document.getElementById("div_game_stats_fancy").style.display = "none";
    });
    document.getElementById("div_game_stats_fancy_cancelbutton").addEventListener("click", (event) => {
        document.getElementById("div_game_stats_fancy").style.display = "none";
    });
    document.getElementById("div_game_stats_fancy_background_container").addEventListener("click", (event) => {
        document.getElementById("div_game_stats_fancy").style.display = "none";
    });
    document.getElementById("div_game_stats_fancy_minimizebutton").addEventListener("click", (event) => {
        document.getElementById("div_game_stats_fancy").style.display = "none";
        document.getElementById("div_game_stats_minimized_fancy").style.display = "";
    });
    // and for minimized version
    document.getElementById("div_game_stats_minimized_fancy_maximizebutton").addEventListener("click", (event) => {
        document.getElementById("div_game_stats_fancy").style.display = "flex";
        document.getElementById("div_game_stats_minimized_fancy").style.display = "none";
    });
    document.getElementById("div_game_stats_minimized_fancy_cancelbutton").addEventListener("click", (event) => {
        document.getElementById("div_game_stats_minimized_fancy").style.display = "none";
    });

    // user settings
    div_game_settings_fancy = document.getElementById("div_game_settings_fancy");
    document.getElementById("div_game_interface_settings").addEventListener("click", (event) => {
        div_game_settings_fancy.style.display = "flex";
    });
    document.getElementById("div_game_settings_fancy").addEventListener("click", (event) => {
        div_game_settings_fancy.style.display = "none";
    });
    document.getElementById("div_game_settings_fancy_cancelbutton").addEventListener("click", (event) => {
        div_game_settings_fancy.style.display = "none";
    });
    document.getElementById("div_game_settings_fancy_background").addEventListener("click", (event) => {
        event.stopPropagation();
    });
    document.getElementById("div_game_settings_fancy").addEventListener("wheel", (event) => {
        event.stopPropagation();
    });
    // background buttons
    for (let i = 0; i < background_images.length; i++) {
        document.getElementById("div_game_settings_fancy_backgrounds_button" + i).addEventListener("click", (event) => {
            document.getElementById("div_game_settings_fancy_backgrounds_button" + myBackground).style.outline = "";
            document.getElementById("div_game_settings_fancy_backgrounds_button" + i).style.outline = "calc(0.6vmin) solid #ffffff";
            myBackground = i;
            div_game.style.backgroundImage = "url(" + background_images[myBackground] + ")";
            document.cookie = "myBackground=" + myBackground;
        });
    }
    // controls
	var div_game_settings_fancy_controls_table_movecamera_check = document.getElementById("div_game_settings_fancy_controls_table_movecamera_check");
	div_game_settings_fancy_controls_table_movecamera_check.addEventListener('change', (event) => {
    pancameraclosetoscreenedges = div_game_settings_fancy_controls_table_movecamera_check.checked;
    document.cookie = "movecamera=" + div_game_settings_fancy_controls_table_movecamera_check.checked;
	});
	var div_game_settings_fancy_controls_table_lmbdrag_check = document.getElementById("div_game_settings_fancy_controls_table_lmbdrag_check");
	div_game_settings_fancy_controls_table_lmbdrag_check.addEventListener('change', (event) => {
    uselmbscreendrag = div_game_settings_fancy_controls_table_lmbdrag_check.checked;
    document.cookie = "lmbscreendrag=" + div_game_settings_fancy_controls_table_lmbdrag_check.checked;
	});

    document.getElementById("div_game_settings_fancy_background").addEventListener("click", (event) => {
        event.stopPropagation();
    });

    // toggle transparency of pieces
    var div_game_interface_transparency = document.getElementById("div_game_interface_transparency");
    var tiletransparencytoggle = false;
    div_game_interface_transparency.addEventListener("click", (event) => {
        if (tiletransparencytoggle) {
            tiletransparencytoggle = false;
            // make opaque
            document.getElementById("div_game_interface_transparency_img").src = "img/icons/tileicon.png";
            for (var i = 0; i < thispuzzle.layout[0]; i++) {
                for (var j = 0; j < thispuzzle.layout[1]; j++) {
                    thispuzzle.pieces[i][j].divcontainer.style.opacity = "1.0";
                    thispuzzle.pieces[i][j].divedgeshadowcontainer.style.opacity = "1.0";
                    thispuzzle.pieces[i][j].divedgehighlightcontainer.style.opacity = "1.0";
                }
            }
        } else {
            tiletransparencytoggle = true;
            // make transparent
            document.getElementById("div_game_interface_transparency_img").src = "img/icons/tileicon2.png";
            for (var i = 0; i < thispuzzle.layout[0]; i++) {
                for (var j = 0; j < thispuzzle.layout[1]; j++) {
                    thispuzzle.pieces[i][j].divcontainer.style.opacity = "0.0";
                    thispuzzle.pieces[i][j].divedgeshadowcontainer.style.opacity = "0.5";
                    thispuzzle.pieces[i][j].divedgehighlightcontainer.style.opacity = "0.0";
                }
            }
        }
    });

    // motif preview
    var div_game_preview = document.getElementById("div_game_preview");
    var div_game_preview_image = document.getElementById("div_game_preview_image");
    div_game_preview.addEventListener("click", (event) => {
        div_game_preview.style.display = "none";
    });
    document.getElementById("div_game_interface_preview").addEventListener("click", (event) => {
        div_game_preview.style.display = "";
        div_game_preview_image.src = thispuzzle.motif;
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (thispuzzle.dimensions_px[0]/w > thispuzzle.dimensions_px[1]/h) {
            div_game_preview_image.style.width = "90%";
            div_game_preview_image.style.height = (div_game_preview_image.offsetWidth*thispuzzle.dimensions_px[1]/thispuzzle.dimensions_px[0]) + "px";
            div_game_preview_image.style.left = w/2 - div_game_preview_image.offsetWidth/2 + "px";
            div_game_preview_image.style.top = h/2 - div_game_preview_image.offsetHeight/2 + "px";
        } else {
            div_game_preview_image.style.height = "90%";
            div_game_preview_image.style.width = (div_game_preview_image.offsetHeight*thispuzzle.dimensions_px[0]/thispuzzle.dimensions_px[1]) + "px";
            div_game_preview_image.style.left = w/2 - div_game_preview_image.offsetWidth/2 + "px";
            div_game_preview_image.style.top = h/2 - div_game_preview_image.offsetHeight/2 + "px";
        }
    });
    div_game_preview.addEventListener("wheel", (event) => {
        event.stopPropagation();
    });

	// #################################################################################################
	// ################  setup piece movement functionality in game   ##################################
	// #################################################################################################
    // do not allow to move pieces over game boundary
    var enforce_game_boundary = function(somepiece) {
    var result = false;
    // find boundary of partition
    var leftmost = somepiece;
    var rightmost = somepiece;
    var topmost = somepiece;
    var bottommost = somepiece;
    // note: this needs to be adjusted..
    switch (somepiece.angle) {
        case 0:
            for (const piece of somepiece.partition) {
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
            for (const piece of somepiece.partition) {
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
            for (const piece of somepiece.partition) {
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
            for (const piece of somepiece.partition) {
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
    // update all pieces in partition
    var updatefromref = function(somepiece) {
        var cosangle = Math.cos(somepiece.angle*Math.PI/2);
        var sinangle = Math.sin(somepiece.angle*Math.PI/2);
        for (const piece of somepiece.partition) {
            // get coordinates
            var deltax = (piece.x0[somepiece.angle] - somepiece.x0[somepiece.angle]) * cosangle
                         - (piece.y0[somepiece.angle] - somepiece.y0[somepiece.angle]) * sinangle;
            var deltay = (piece.x0[somepiece.angle] - somepiece.x0[somepiece.angle]) * sinangle
                         + (piece.y0[somepiece.angle] - somepiece.y0[somepiece.angle]) * cosangle;
            piece.x = somepiece.x + deltax;
            piece.y = somepiece.y + deltay;
        }
    }
    updatefromref(somepiece);
    // check individual directions and shift partition accordingly..
    if (leftmost.x < game_boundary_left) {
        leftmost.x = game_boundary_left;
        result = true;
        updatefromref(leftmost);
    }
    if (rightmost.x + rightmost.w > game_boundary_right) {
        rightmost.x = game_boundary_right - rightmost.w;
        result = true;
        updatefromref(rightmost);
    }
    if (topmost.y < game_boundary_top) {
        topmost.y = game_boundary_top;
        result = true;
        updatefromref(topmost);
    }
    if (bottommost.y + bottommost.h > game_boundary_bottom) {
        bottommost.y = game_boundary_bottom - bottommost.h;
        result = true;
        updatefromref(bottommost);
    }
        return result;
    }
    // move mouse over game div to send current piece position to server
    div_game.addEventListener("mousemove", (event) => {
        // move piece during zoom if actually holding piece & sufficient time passed since last emit
        if (dragging_piece && typeof(drag_timeout) === 'undefined' && zoomanimation_running) {
            moved_mouse_during_zoom = true;
            dragging_piece_mousedown_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
            dragged_piece.x = thiscamera.getx_cam(dragging_piece_mousedown_mouselocation[0]) - dragged_piece.w/2.0;
            dragged_piece.y = thiscamera.gety_cam(dragging_piece_mousedown_mouselocation[1]) - dragged_piece.h/2.0;
            enforce_game_boundary(dragged_piece);
            iosocket.emit('iWantToMoveMyPiece', dragged_piece.x, dragged_piece.y, dragged_piece.angle);
            piece_mouselocation = [dragged_piece.x, dragged_piece.y];
            thispuzzle.updatePiecePositions();

            // limit number of triggers to rate defined by drag_timeout_time
            drag_timeout = setTimeout(function () {
                clearTimeout(drag_timeout);
                drag_timeout = undefined;
            }, drag_timeout_time);
        }

        // only message server if actually dragging held piece & sufficient time passed since last emit
        if (dragging_piece && typeof(drag_timeout) === 'undefined' && !zoomanimation_running) {
            // get current position and apply to piece as a first guess
            dragging_piece_mousemove_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
            dragged_piece.x = piece_mouselocation[0] + thiscamera.getlength_cam(dragging_piece_mousemove_mouselocation[0] - dragging_piece_mousedown_mouselocation[0]);
            dragged_piece.y = piece_mouselocation[1] + thiscamera.getlength_cam((dragging_piece_mousemove_mouselocation[1] - dragging_piece_mousedown_mouselocation[1]));
            // make corrections
            enforce_game_boundary(dragged_piece);
            // note: use animate for smooth transition
            thispuzzle.updatePiecePositions();
            iosocket.emit('iWantToMoveMyPiece', dragged_piece.x, dragged_piece.y, dragged_piece.angle);

            // limit number of triggers to rate defined by drag_timeout_time
            drag_timeout = setTimeout(function () {
                clearTimeout(drag_timeout);
                drag_timeout = undefined;
            }, drag_timeout_time);

            // camera panning while dragging piece
            var w = window.innerWidth;
            var h = window.innerHeight;
            // decide if at all and in what direction
            autopan_camera_delta_px = [0, 0];
            if (pancameraclosetoscreenedges) {
                // limit to game's boundary
                dragging_piece_mousemove_mouselocation_inbound = [Math.max(thiscamera.getx_px(game_boundary_left), Math.min(thiscamera.getx_px(game_boundary_right), dragging_piece_mousemove_mouselocation[0])),
                                                                  Math.max(thiscamera.gety_px(game_boundary_top), Math.min(thiscamera.gety_px(game_boundary_bottom), dragging_piece_mousemove_mouselocation[1]))];
                dragging_piece_mousemove_mouselocation_relative = [dragging_piece_mousemove_mouselocation_inbound[0] - w/2.0,
                                                                   (dragging_piece_mousemove_mouselocation_inbound[1] - h/2.0)*w/h];
                dragging_piece_mousemove_mouselocation_relative_r = Math.sqrt(dragging_piece_mousemove_mouselocation_relative[0]**2
                                                                              + dragging_piece_mousemove_mouselocation_relative[1]**2);
                if (dragging_piece_mousemove_mouselocation_relative_r > 0.0) {
                    var autopan_camera_delta_px_r = 0.0;
                    if (dragging_piece_mousemove_mouselocation_relative_r > (1.0 - autopan_camera_margin)*w/2.0) {
                        autopan_camera_delta_px_r = (1.0 - (w/2.0 - dragging_piece_mousemove_mouselocation_relative_r)/autopan_camera_margin/w*2.0) * autopan_camera_rate_px;
                    }
                    autopan_camera_delta_px = [dragging_piece_mousemove_mouselocation_relative[0]/dragging_piece_mousemove_mouselocation_relative_r*autopan_camera_delta_px_r,
                    dragging_piece_mousemove_mouselocation_relative[1]/dragging_piece_mousemove_mouselocation_relative_r*autopan_camera_delta_px_r];
                }
            }
            if (autopan_camera_delta_px[0] !== 0 || autopan_camera_delta_px[1] !== 0) {
            // if timer is not already running, start timer
            if (typeof(autopan_camera_timer) === 'undefined') {
                autopan_camera_timer = setInterval(function () {
                    // move only if either not picked up close to edge of screen or piece has been moved away from there already
                    if (!autopan_camera_onlyjustpickedup) {
                        // cancel if stopped dragging
                        if (!dragging_piece) { // or pan direction is zero || (autopan_camera_delta_px[0] === 0 && autopan_camera_delta_px[1] === 0)
                            clearInterval(autopan_camera_timer);
                            autopan_camera_timer = undefined;
                            return;
                        }

                        // move camera and dragged piece(s)
                        thiscamera.update_camera_position_fromdeltapx(autopan_camera_delta_px[0], autopan_camera_delta_px[1]);
                        dragged_piece.x += thiscamera.getlength_cam(autopan_camera_delta_px[0]);
                        dragged_piece.y += thiscamera.getlength_cam(autopan_camera_delta_px[1]);
                        var enforced_game_boundary = enforce_game_boundary(dragged_piece);
                        // update display puzzle pieces
                        thispuzzle.updatePiecePositions();
                        iosocket.emit('iWantToMoveMyPiece', dragged_piece.x, dragged_piece.y, dragged_piece.angle);

                        // update variables for actual mousemove dragging of piece
                        dragging_piece_mousedown_mouselocation = [dragging_piece_mousemove_mouselocation_inbound[0], dragging_piece_mousemove_mouselocation_inbound[1]];
                        piece_mouselocation = [dragged_piece.x, dragged_piece.y];

                        // update background
                        backgroundposition = [backgroundposition[0] - autopan_camera_delta_px[0],
                        backgroundposition[1] - autopan_camera_delta_px[1]];
                        div_game.style.backgroundPosition = "left " + backgroundposition[0] + "px top " + backgroundposition[1] + "px";

                        // update placement of highlights for picked up pieces
                        updateHighlightPositioning();
                        // update placement of the indicator for the game's border
                        updateBorderPositioning();

                        // stop moving camera if dragged_piece touches the boundary
                        if (enforced_game_boundary) {
                            autopan_camera_onlyjustpickedup = true;
                        }
                    }
                }, drag_timeout_time);
            }
            } else {
                autopan_camera_onlyjustpickedup = false;
                if (typeof(autopan_camera_timer) !== 'undefined') {
                    clearInterval(autopan_camera_timer);
                    autopan_camera_timer = undefined;
                }
            }
        }
    });
    // request stop dragging piece
    div_game.addEventListener("mouseup", (event) => {
        if (dragging_piece && event.which === 1) {
            dragging_piece = false;
            if (typeof(autopan_camera_timer) !== 'undefined') {
                clearInterval(autopan_camera_timer);
                autopan_camera_timer = undefined;
                autopan_camera_delta_px = [0, 0];
            }
            iosocket.emit('iWantToDropPiece');
        }
    });
    // repeat this listener but rotate only if client has picked up a piece
    div_game.addEventListener("contextmenu", (event) => {
        if (dragging_piece && userotation) {
            iosocket.emit('iWantToMoveMyPiece', dragged_piece.x, dragged_piece.y, dragged_piece.angle + 1);
        }
        event.stopPropagation();
        event.preventDefault();
    });
    // disable context menu globally
    window.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
	// #################################################################################################
	// ################  setup camera movement functionality in game  ##################################
	// #################################################################################################
    // reference points of initiation
    var drag_camera_mousedown_mouselocation = [0, 0];
    var mousedown_cameralocation = [0, 0];
    // reference position of camera object
    var mousedown_cameralocation_cameraobject = [0, 0];
    // define camera properties location
    backgroundposition = [0, 0];
    // indicator whether camera is being moved
    var dragging_screen = false;
    var dragging_mousebutton_used;
    // drag with mouse; save reference location on mousedown
    div_game.addEventListener("mousedown", (event) => {
        // use left or middle mouse as drag buttons
        if (!try_to_drag_piece && !dragging_screen && ((uselmbscreendrag && event.which === 1) || event.which === 2) && !zoomanimation_running) {
            event.preventDefault();
            dragging_mousebutton_used = event.which;
            drag_camera_mousedown_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
            mousedown_cameralocation = [backgroundposition[0], backgroundposition[1]];
            mousedown_cameralocation_cameraobject = [thiscamera.x, thiscamera.y];
            dragging_screen = true;
        }
    });
    // reposition camera with moving mouse
    // helper function to reposition puzzle pieces
    var panningcamera_updatepuzzlepiecelocations = function(event) {
        // reset camera to mousedown-location
        thiscamera.x = mousedown_cameralocation_cameraobject[0];
        thiscamera.y = mousedown_cameralocation_cameraobject[1];
        // actually update via delta in pixel space
        var mousemove_mouselocation = [parseInt(event.clientX), parseInt(event.clientY)];
        thiscamera.update_camera_position_fromdeltapx(drag_camera_mousedown_mouselocation[0] - mousemove_mouselocation[0],
                                                      drag_camera_mousedown_mouselocation[1] - mousemove_mouselocation[1]);

        // restrict camera movement to valid area
        // get cursor position in camera coordinates:
        var thisx = thiscamera.getx_cam(window.innerWidth/2);
        var thisy = thiscamera.gety_cam(window.innerHeight/2);
        if (thisx < game_boundary_left || thisx > game_boundary_right) {
            // map back into allowed domain
            var newx = Math.max(game_boundary_left, Math.min(game_boundary_right, thisx));
            // position camera accordingly
            thiscamera.x += newx - thisx;
            // update points of reference for dragging camera
            drag_camera_mousedown_mouselocation[0] = mousemove_mouselocation[0];
            mousedown_cameralocation_cameraobject[0] = thiscamera.x;
            mousedown_cameralocation[0] = backgroundposition[0];
        } else {
            backgroundposition[0] = mousedown_cameralocation[0] + (parseInt(event.clientX) - drag_camera_mousedown_mouselocation[0]);
        }
        // repeat for y-dir
        if (thisy < game_boundary_top || thisy > game_boundary_bottom) {
            var newy = Math.max(game_boundary_top, Math.min(game_boundary_bottom, thisy));
            thiscamera.y += newy - thisy;
            drag_camera_mousedown_mouselocation[1] = mousemove_mouselocation[1];
            mousedown_cameralocation_cameraobject[1] = thiscamera.y;
            mousedown_cameralocation[1] = backgroundposition[1];
        } else {
            backgroundposition[1] = mousedown_cameralocation[1] + (parseInt(event.clientY) - drag_camera_mousedown_mouselocation[1]);
        }

        // update background
        div_game.style.backgroundPosition = "left " + backgroundposition[0] + "px top " + backgroundposition[1] + "px";

        // update puzzle pieces
        thispuzzle.updatePiecePositions();
        // update placement of highlights for picked up pieces
        updateHighlightPositioning();
        // update placement of the indicator for the game's border
        updateBorderPositioning();
    }
    div_game.addEventListener("mousemove", (event) => {
        if (dragging_screen) {
            // handle puzzle piece viewport location change
            panningcamera_updatepuzzlepiecelocations(event);
        }
    });
    // end drag on mouseup for initial button
    div_game.addEventListener("mouseup", (event) => {
        if (dragging_screen && event.which === dragging_mousebutton_used) {
            // handle puzzle piece viewport location change
            panningcamera_updatepuzzlepiecelocations(event);

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
    const camera_zoom_range_lower = 0.10, camera_zoom_range_upper = 10.0;
    // variables+function for implementation of animated zoom
    var zoomtimer, zoom_anim_start, zoom_anim_end, zoom_anim_current;
    zoomanimation_running = false
    var zoomfunction = function(x) {
        // animate with sigmoid-curve
        zoom_anim_current = zoom_anim_start + (zoom_anim_end-zoom_anim_start)*(2.0/(1.0 + Math.exp(-5.0*x))-1.0);
        backgroundposition[0] = wheel_mouselocation[0] - zoom_anim_current/zoom_anim_start*(wheel_mouselocation[0] - wheel_cameralocation[0]);
        backgroundposition[1] = wheel_mouselocation[1] - zoom_anim_current/zoom_anim_start*(wheel_mouselocation[1] - wheel_cameralocation[1]);
        div_game.style.backgroundSize = zoom_anim_current*100+"%";
        div_game.style.backgroundPosition = "left " + backgroundposition[0] + "px top " + backgroundposition[1] + "px";

        // handle puzzle piece viewport location change by transforming camera object coordinates
        thiscamera.zoom = zoom_anim_current;
        // from original mouse position in camera space cameralocation0, place camera according to current pixel distance
        thiscamera.x = cameralocation0[0] - thiscamera.getlength_cam(wheel_mouselocation[0]);
        thiscamera.y = cameralocation0[1] - thiscamera.getlength_cam(wheel_mouselocation[1]);

        // update puzzle pieces
        thispuzzle.updatePiecePositions();
        thispuzzle.updatePieceTransformation();

        // update placement of highlights for picked up pieces
        updateHighlightPositioning();
        // update placement of the indicator for the game's border
        updateBorderPositioning();
    };
    // zoom on wheel event
    div_game.addEventListener("wheel", (event) => {
        // only allow zoom if camera is not being dragged around
        if (!dragging_screen) {
            // possibly abort currently running zoom animation
            if (zoomanimation_running) {
                clearInterval(zoomtimer);
                thiscamera.zoom = zoom_anim_current;
                backgroundposition[0] = wheel_mouselocation[0] - thiscamera.zoom/zoom_anim_start*(wheel_mouselocation[0] - wheel_cameralocation[0]);
                backgroundposition[1] = wheel_mouselocation[1] - thiscamera.zoom/zoom_anim_start*(wheel_mouselocation[1] - wheel_cameralocation[1]);
            }

            // save reference (mouse focus point wheel_mouselocation is limited to valid region of this game)
            wheel_mouselocation = [Math.max(thiscamera.getx_px(game_boundary_left), Math.min(thiscamera.getx_px(game_boundary_right), parseInt(event.clientX))),
                                   Math.max(thiscamera.gety_px(game_boundary_top), Math.min(thiscamera.gety_px(game_boundary_bottom), parseInt(event.clientY)))];
            wheel_cameralocation = [backgroundposition[0], backgroundposition[1]];
            // get camera space position of current mouse position
            cameralocation0 = [thiscamera.getx_cam(wheel_mouselocation[0]),
            thiscamera.gety_cam(wheel_mouselocation[1])];
            zoom_anim_start = thiscamera.zoom;
            zoom_anim_current = thiscamera.zoom;
            // goal of zoom animation
            var thiszoomfactor = camera_zoom_ratefactor;
            if (event.shiftKey) {
                thiszoomfactor += 0.3;
            }
            if (event.deltaY < 0) {
                // zoom in
                zoom_anim_end = Math.min(camera_zoom_range_upper, thiscamera.zoom/thiszoomfactor);
            } else if (event.deltaY > 0) {
                // zoom out
                zoom_anim_end = Math.max(camera_zoom_range_lower, thiscamera.zoom*thiszoomfactor);
            }
            // initiate animation
            zoomanimation_running = true;
            moved_mouse_during_zoom = false;
            zoomtimer = animate(200, zoomfunction, function(){
                zoomfunction(100);
                thiscamera.zoom = zoom_anim_end;
                zoomanimation_running = false;

                // adjust coordinates if zoomed while dragging a piece
                if (dragging_piece) {
                    if (!moved_mouse_during_zoom) {
                        piece_mouselocation = [dragged_piece.x, dragged_piece.y];
                        dragging_piece_mousedown_mouselocation = [wheel_mouselocation[0], wheel_mouselocation[1]];
                    }
                }
            });
        }
  });
}

// restores previous settings from cookies
function loadPreviousSettings() {
    myID = getCookie('myID');
    myName = getCookie('myName');
    if (typeof(myName) === 'undefined') {
        myName = "Anonymous";
        document.getElementById("div_lobby_content_profile_settings_nameinput").value = myName;
    }
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
    // test for cookie of background
    myBackground = getCookie('myBackground');
    if (typeof(myBackground) !== 'undefined') {
        // if so, try to parse; otherwise set initial value
        myBackground = parseInt(myBackground);
        if (typeof(myBackground) !== 'number') {
            myBackground = 0;
        }
    } else {
        // otherwise set initial value
        myBackground = 0;
    }
    document.getElementById("div_game").style.backgroundImage = "url(" + background_images[myBackground] + ")";
    document.getElementById("div_game_settings_fancy_backgrounds_button" + myBackground).style.outline = "calc(0.6vmin) solid #ffffff";
    // read and apply previous audio setting (if existent)
    var mute_cookie = getCookie('mute');
    if (typeof(mute_cookie) !== 'undefined') {
        mute = mute_cookie === "true";
        if (mute) {
            document.getElementById("div_game_interface_sound_img").src = "img/icons/nosoundicon.png";
        } else {
            document.getElementById("div_game_interface_sound_img").src = "img/icons/soundicon.png";
        }
    }
    // load previous control settings
    var uselmbscreendrag_cookie = getCookie('lmbscreendrag');
    if (typeof(uselmbscreendrag_cookie) !== 'undefined') {
        uselmbscreendrag = uselmbscreendrag_cookie === "true";
        document.getElementById("div_game_settings_fancy_controls_table_lmbdrag_check").checked = uselmbscreendrag;
    }
    var pancameraclosetoscreenedges_cookie = getCookie('movecamera');
    if (typeof(pancameraclosetoscreenedges_cookie) !== 'undefined') {
        pancameraclosetoscreenedges = pancameraclosetoscreenedges_cookie === "true";
        document.getElementById("div_game_settings_fancy_controls_table_movecamera_check").checked = pancameraclosetoscreenedges;
    }
}
