var http=require('http');
var fs = require('fs');
var express = require('express');


var app = express();
app.use(express.static('public'));
app.set('port','8080');

var server = http.createServer(app);
server.on('listening', ()=>{
    console.log('Listening on port 8080');

});

var soc_io = require('socket.io')(server, {
    allowEIO3:true,
    "upgrades": ["websocket"],
    "pingInterval": 60000,
    "pingTimeout": 1000
    
});




// reply to request with "Hello World!"
/*app.get('/', function (req, res) {
  res.render('index.html');
});*/




/*transports: ['websocket'],
pingInterval: 1000 * 60 * 5,
pingTimeout: 1000 * 60 * 3*/
var Raspi = require("raspi-io").RaspiIO;

var five = require("johnny-five");
const { Accelerometer, Board } = require("johnny-five");
var board = new five.Board({
    io: new Raspi()
});




/*function handler(req, res){
    fs.readFile('./public/index.html', function(err, data){

        if(err){
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end('404 Not Found');
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });

}*/

server.listen(8080,'192.168.1.8')

soc_io.sockets.on('connection', function(socket){

    console.log('Client connected: ' + socket.id)

	
	socket.on('disconnect', () => console.log('Client has disconnected'))
    
    console.log(socket.connected);
    
    console.log("Board: ");
    
});




board.on("ready", ()=>{
    const accelerometer = new Accelerometer({
        controller: "LIS3DH",
    });

    console.log("defined piezo");

    var piezo = new five.Piezo("P1-13");

    // Injects the piezo into the repl
    board.repl.inject({
      piezo: piezo
    });
    //If placed here it only plays once
    piezo.play({
        // song is composed by an array of pairs of notes and beats
        // The first argument is the note (null means "no note")
        // The second argument is the length of time (beat) of the note (or non-note)
        song: [
          ["C4", 1 / 4],
          ["D4", 1 / 4],
          ["F4", 1 / 4],
          ["D4", 1 / 4],
          ["A4", 1 / 4],
          [null, 1 / 4],
          ["A4", 1],
          ["G4", 1],
          [null, 1 / 2],
          ["C4", 1 / 4],
          ["D4", 1 / 4],
          ["F4", 1 / 4],
          ["D4", 1 / 4],
          ["G4", 1 / 4],
          [null, 1 / 4],
          ["G4", 1],
          ["F4", 1],
          [null, 1 / 2]
        ],
        tempo: 100
      });
    // Plays a song
       
    accelerometer.on("change", ()=>{
        const {acceleration, inclination, orientation, pitch, roll, x,y,z} =accelerometer;
    
        soc_io.sockets.emit('accel', acceleration);
        soc_io.sockets.emit('incl', inclination);
        soc_io.sockets.emit('orient', orientation);
        soc_io.sockets.emit('pitch', pitch);
        soc_io.sockets.emit('roll', roll);
        soc_io.sockets.emit('xPos', x);
        soc_io.sockets.emit('yPos', y);
        soc_io.sockets.emit('zPos', z);

        //placing it over here makes it play multiple times. But long songs do not get played fully for
        //some reason. Not entirely sure why. But I am okay with this I think. 
        piezo.play({
            // song is composed by an array of pairs of notes and beats
            // The first argument is the note (null means "no note")
            // The second argument is the length of time (beat) of the note (or non-note)
            song: [
              
              ["G4", 1 ],
             
            ],
            tempo: 100
          });
        // Plays a song
        
    
    

    });
    
 
    

  

    

    //Set up stuff for piezo here. Just have it running, no need to have it react to anything just yet.
    //There is no reason for it to be the accelerometer function 
              
    board.on("exit", () =>{
            accelerometer.off();
    });

});

   

process.on('SIGING', function (){
 
    process.exit();
});
