var express = require('express');
var app = express();
var _findIndex = require('lodash/findIndex') // npm install lodash --save
var server = require('http').Server(app);
var port = (process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 6969);
var io = require('socket.io')(server);
server.listen(port, () => console.log('Server running in port ' + port));

var userOnline = []; //danh sách user dang online
var userTyping = []; //danh sách user dang gõ bàn phím

io.on('connection', function(socket) {

    console.log(socket.id + ': connected');

    //lắng nghe khi người dùng thoát
    socket.on('disconnect', function() {
        console.log(socket.id + ': disconnected')
        $index = _findIndex(userOnline, ['id', socket.id]);
        userOnline.splice($index, 1);
        io.sockets.emit('updateUserList', userOnline);
    })

    //lắng nghe khi có người gửi tin nhắn
    socket.on('newMessage', data => {
        //gửi lại tin nhắn cho tất cả các user dang online
        io.sockets.emit('newMessage', {
            data: data.data,
            user: data.user
        });
    })

    //lắng nghe khi có người login
    socket.on('login', data => {
        // kiểm tra xem tên đã tồn tại hay chưa
        if (userOnline.findIndex(i => i.name === data) >= 0) {
            socket.emit('loginFail'); //nếu tồn tại rồi thì gửi socket fail
        } else {
            // nếu chưa tồn tại thì gửi socket login thành công
            socket.emit('loginSuccess', data);
            userOnline.push({
                id: socket.id,
                name: data
            })
            io.sockets.emit('updateUserList', userOnline);// gửi danh sách user dang online
        }
    })

    //lắng nghe khi có người gõ tin nhắn
    socket.on('typing', data => {
        // kiểm tra khi người dùng gõ trên 1 ký tự mới thêm người dùng vào List
        if (data.data.length >= 2) {
            if(!(userTyping.findIndex(i => i.name === data.user.name) >= 0)) userTyping.push(data.user);
        } else {
            $index = userTyping.findIndex(i => i.name === data.user.name);
            if($index >= 0)userTyping.splice($index, 1);
        }
        console.log(userTyping);
        console.log(userTyping.findIndex(i => i.name === data.user.name));
        io.sockets.emit('updateUserTypingList', userTyping);
    })


});

app.get('/', (req, res) => {
    res.send("Home page. Server running okay.");
})
