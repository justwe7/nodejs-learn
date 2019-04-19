var socket = require('socket.io');
var io;
var guesrNum = 1;
var nickNames = {};
var namesUsed = [];
var currRoom = {};

/**
 *聊天程序主体入口
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} server
 */
function socketServer(server) {
  io = socket.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', function (socket) {
    /* 
      聊天程序需要处理下面这些场景和事件：  分配昵称；  房间更换请求；  昵称更换请求；  发送聊天消息；  房间创建；  用户断开连接。 
    */
    guesrNum = assignGuestName(socket, guesrNum, nickNames, namesUsed);//给一个
    joinRoom(socket, '狂拽炫酷群'); //连接上把用户放进 聊天室
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', function () {//用农户发出请求 提供已经占用聊天室列表
      socket.emit('rooms', io.sockets.manager.rooms);
    })
    handleClientDisconnection(socket, nickNames, namesUsed);//用户离开删除历史
  })
}

exports.listen = socketServer;


/**
 *创建用户昵称
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} socket 
 * @param {*} guesrNum
 * @param {*} nickNames  关联用户昵称
 * @param {*} namesUsed
 * @returns
 */
function assignGuestName(socket, guesrNum, nickNames, namesUsed) {
  var name = '匿名用户'+ guesrNum;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  namesUsed.push(name);
  return guesrNum+1;
}

/**
 *进入 聊天室
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} socket
 * @param {*} room
 */
function joinRoom(socket, room) {
  socket.join(room);
  currRoom[socket.id] = room;
  socket.emit('joinResult', {room: room});
  
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id]+'进入房间'+room+'.'
  });
  var usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = '房间里还有' + room + ':';
    usersInRoom.forEach((el, index) => {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id && index > 0) {
        usersInRoomSummary += ', ';       
      }
      usersInRoomSummary += nickNames[userSocketId];
    });
  }
  usersInRoomSummary += '.';
  socket.emit('message', {text: usersInRoomSummary});
}

/**
 *改名
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} socket
 * @param {*} nickNames
 * @param {*} namesUsed
 */
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function (name) {
    console.log(name);
    
    if (name.indexOf('guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: '名字不能以guest开头'
      })
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        namesUsed.push(name);
        nickNames[socket.io] = name;
        delete namesUsed[previousNameIndex]; //删掉就昵称 别人能用
        socket.emit('nameResult', {
          success: true,
          name: name
        })
        socket.broadcast.to(currRoom[socket.id]).emit('message', {
          text: previousName+ '名字改为了:'+name+'.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: '昵称被占用'
        })
      }
    }
  })
}


/**
 *用户发送消息
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} socket
 */
function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ':' + message.text
    })
  })
}

/**
 *加入房间 或者 新创建房间
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} socket
 */
function handleRoomJoining(socket) {
  socket.on('join', function (room) {
    socket.leave(currRoom[socket.id]);
    joinRoom(socket, room.newRoom)
  })
}

/**
 *用户断开连接
 *
 * @author huaxi.li
 * @date 2019-04-19
 * @param {*} socket
 */
function handleClientDisconnection(socket) {
  socket.on('disconnect', function () {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  })
}