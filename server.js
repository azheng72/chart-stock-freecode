
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'node_modules')));
router.use(express.static(path.resolve(__dirname, 'client')));

var sockets = [];
var series=["YHOO","AAPL","GOOG","MSFT"];//default value

io.on('connection', function (socket) {
    
    socket.emit('message', series);

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;
        
      broadcast('message', msg);
      series=msg;

    });
  });

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
