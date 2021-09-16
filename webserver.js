var http=require('http');
var fs = require('fs');
var express = require('express');

//set up the server to listen to port 8080
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
    "pingInterval": 30000,
    "pingTimeout": 1000
    
});

//this variable will be used to store the speed information coming from the client
let new_speed =0;

//use this to access the raspi-io library
var Raspi = require("raspi-io").RaspiIO;

//use this to access the johnny-five library
var five = require("johnny-five");

//use the acceleremoter library from johnny five
const { Accelerometer, Board } = require("johnny-five");

//establish what kind of board you are using, in this case it is a Raspberry Pi
var board = new five.Board({
    io: new Raspi()
});

//calling the server and making it listen to your device's local ip address on port 8080
server.listen(8080,'your.devices.local.ip')

//the websocket is accepting data coming in from the client
soc_io.sockets.on('connection', function(socket){

    console.log('Client connected: ' + socket.id)

	
	socket.on('disconnect', () => console.log('Client has disconnected'))
    
    console.log(socket.connected);
    
    //the socket is taking in speed data which is being sent from the client
    socket.on('speed',function(speed){
        //store the speed data in the new_speed variable
        new_speed = speed;
    });
    
});

//establishing the connection to the Raspberry Pi and its GPIO pins
board.on("ready", ()=>{
    //declare the new acceleremoter
    const accelerometer = new Accelerometer({
        controller: "LIS3DH",
    });

    //assign GPIO pins to each piezo
    //This controller uses vibration motors instead of piezos. Treating them as piezos allows them to have more nuanced vibration patterns
    var piezo = new five.Piezo("P1-13");
    var piezo2 = new five.Piezo("P1-40");

    // Injects the piezo into the repl
    board.repl.inject({
      piezo: piezo,
      piezo2:piezo2
    });
    //If placed here, the piezo only plays once it only plays once
    piezo.play({
        // song is composed by an array of pairs of notes and beats
     
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

    //accelerometer.on is an infinite loop. If any code is placed after this loop, it will not be accessed because this loop never ends.
    //This is why I chose to play the piezos inside of this loop, as well    
    accelerometer.on("change", ()=>{
        const {acceleration, inclination, orientation, pitch, roll, x,y,z} =accelerometer;
        let basic_coors = [x,y,z];
        soc_io.sockets.emit('coors', basic_coors);
        soc_io.sockets.emit('accel', acceleration);
        soc_io.sockets.emit('incl', inclination);
        soc_io.sockets.emit('orient', orientation);
        soc_io.sockets.emit('pitch', pitch);
        soc_io.sockets.emit('roll', roll);
        soc_io.sockets.emit('xPos', x);
        soc_io.sockets.emit('yPos', y);
        soc_io.sockets.emit('zPos', z);

        //placing it over here makes it play multiple times. But long songs do not get played fully for
        //some reason. Not entirely sure why. But I am okay with this because it still serves the purposes of my game. 

        //the new_speed variable which stores the speed data coming in from the client determines what kind of "note" the vibration motors will play
        if(new_speed >0.08){
            piezo.play({
                // song is composed by an array of pairs of notes and beats
      
                song: [
                  
                  ["G4", 1 ],
                 
                ],
                tempo: 100
              });
            piezo2.play({
                // song is composed by an array of pairs of notes and beats

                song: [
                  
                  ["F4", 2 ],
                 
                ],
                tempo: 100
              });

        }

        if(new_speed <0.06){
            piezo.play({
                // song is composed by an array of pairs of notes and beats

                song: [
                  
                  ["A4", 1 ],
                 
                ],
                tempo: 100
              });
            piezo2.play({
                // song is composed by an array of pairs of notes and beats
      
                song: [
                  
                  ["C4", 1/4 ],
                 
                ],
                tempo: 100
              });

        }
        
    });
    
              
    board.on("exit", () =>{
            accelerometer.off();
    });

});

   

process.on('SIGING', function (){
 
    process.exit();
});
