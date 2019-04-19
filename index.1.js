var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    cache = {};
    var url = require("url");

function send404(res) {
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.write('404 \n 页面未找到');
  res.end();
}

function resolve(dir) {
  return path.join(__dirname, dir);
}

function sendFile(res, filePath, fileCon) {
  res.writeHead(404, {'Content-Type': mime.getType(path.basename(filePath))});
  // https://www.npmjs.com/package/mime   lookup => getType api更改
  // res.writeHead(404, {'Content-Type': mime.lookup(path.basename(filePath))});
  res.end(fileCon);
}

function serverStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath])
  } else {
    fs.exists(absPath, function (exists) {
      if (exists) {
        fs.readFile(absPath, function (err, data) { 
          if (err) {
            send404(res)
          } else {
            cache[absPath] = data;//缓存文件的data数据
            sendFile(res, absPath, data);
          }
        })
      } else {
        send404(res)
      }
    })
  }
}

var server = http.createServer(function (req, res) {
  var filePath = false;
  var pathname = url.parse(req.url).pathname;
  
  if (pathname === '/favicon.ico') {
    return;
  }
  if (req.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public'+ req.url;
  }
  var absPath = './'+ filePath;
  serverStatic(res, cache, absPath);
})
server.listen(9527, function () {
  console.log('启动 http://localhost:9527/');
})