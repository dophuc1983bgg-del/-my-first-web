const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const players = {};
const monsters = [
    { id: 1, hp: 100, maxHp: 100, x: 8, y: 0, z: 8 },
    { id: 2, hp: 250, maxHp: 250, x: -12, y: 0, z: -15, type: 'boss' }
];

io.on('connection', (socket) => {
    // Tạo nhân vật mới khi có kết nối
    players[socket.id] = {
        id: socket.id,
        name: 'Tu Sĩ ' + Math.floor(Math.random() * 899 + 100),
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: (Math.random() - 0.5) * 10,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    // Gửi dữ liệu thế giới cho người chơi mới
    socket.emit('initGame', { myId: socket.id, players, monsters });
    
    // Thông báo cho các người chơi khác
    socket.broadcast.emit('playerJoined', players[socket.id]);

    // Đồng bộ di chuyển
    socket.on('move', (pos) => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].z = pos.z;
            players[socket.id].rot = pos.rot;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Đồng bộ chiêu thức
    socket.on('castSkill', (data) => {
        io.emit('skillEffect', { id: socket.id, x: data.x, z: data.z });
    });

    // Ngắt kết nối
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
