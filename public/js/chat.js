function Chat(socket) {
  this.socket = socket
}

Chat.prototype.sendMessage = function (room, text) {
  var message = {
    room: room,
    text: text
  }
  this.socket.emit('message', message);
}

Chat.prototype.changeRoom = function (room) {
  this.socket.emit('join', {
    newRoom: room
  })
}

Chat.prototype.proccessCommand = function (command) {
  var words = command.split(' ');
  var command = words[0].subsring(1, words[0].length).toLowerCase();
  var message = false;

  switch (command) {
    case 'join':
      words.shift();
      var room = words.join(' ');
      this.changeRoom(room);
      break;
    case 'nick':
      words.shift();
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;
  
    default:
      message = '你在干啥';
      break;
  }
  return message;
}