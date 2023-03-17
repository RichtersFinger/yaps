# yaps - „Yet Another Puzzle Sim"
„Yet Another Puzzle Sim" is a simple Node.js-based engine to host and play jigsaw puzzles in a browser.
This project features a lobby system and different options to play together or individually.
Once the server is running and accessible (possibly check settings for port forwarding) anyone can join and create new sessions.
Most components of this project have been finished, some more will be implemented soon.

## Contents

* [Setup](#setup)

## Setup
The host of the game, i.e. the person running the server, has to install Node.js (server software) and a few small packages. Here is a detailed description of what the host has to do to set up yaps:

1. Install `Node.js` including `npm` from [here](https://nodejs.org/).

   (Optional: I recommend to add the binary directory of Node.js to your path variable<sup>a</sup>.)
2. Download the contents of this repository and move them into a clean directory.
3. Open a shell in the newly created yaps directory<sup>b</sup>. Execute `npm` to install the components `express` and `socket.io` using the command
   ```console
   $ <path-to-npm>/npm install express socket.io
   ```
4. Test the server by issuing
   ```console
   $ <path-to-node>/node index.js
   ```
   in the shell. If no errors occured, a message appears showing on which port the server is listening. Furthermore, your public IP-address/the server's url is shown in the format XXX.XXX.XXX.XXX:8080 . Paste this address (or simply localhost:8080 if you are on the same machine) into your browser address bar and connect to the server. You can easily change the local port by editing the line `const port = 8080;` in the file `index.js`.
5. In order to give other people access to your server, you possibly have to configure your router to forward/map the port accordingly (TCP). Other players can then join your game using the IP-address from above.

<sup>a</sup> The Windows-installer offers to do so automatically. Alternatively, see the instructions for Windows [here](https://stackoverflow.com/a/9546345).

<sup>b</sup> On Windows use Shift+Right Click in the directory then select the shell option from the context menu (see explanation for Windows [here](https://stackoverflow.com/a/60914)).
