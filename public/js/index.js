
function divEscapedContentElement(message, noClass) {
 
  return noClass ? $('<div></div>').text(message) : $('<div class="list-group-item list-group-item-action"></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  var message = $('#send-message').val()
    , systemMessage;

    console.log(message);
    

  // 以 / 开头 是聊天命令
  if (message[0] == '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }

  // 其他非 命令的 广播到其余用户
  } else {
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message, true));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}


/* 初始化 客户端聊天程序 */
var socket = io.connect();

$(document).ready(function() {
  var chatApp = new Chat(socket);

  // Display the results of a name change attempt
  socket.on('nameResult', function(result) {
    var message;

    if (result.success) {
      message = '你在房间昵称是 ' + result.name + '.';
    } else {
      message = result.message;
    }

    $('#messages').append(divSystemContentElement(message));
  });

  // Display the results of a room change
  socket.on('joinResult', function(result) {
    $('#room').text('当前聊天室：'+result.room);
    $('#messages').append(divSystemContentElement('切换房间.'));
  });

  // Display received messages
  socket.on('message', function (message) {
    var newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);
  });

  // Display list of rooms available
  socket.on('rooms', function(rooms) {
    $('#room-list').empty();
    for(var room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    // Allow the click of a room name to change to that room
    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  // Request list of rooms available intermittantly
  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  // Allow clicking the send button to send a chat message
  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});