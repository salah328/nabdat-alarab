const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تعديل المسار هنا ليقرأ من مجلد "عام" المتواجد في مستودعك بالملي
app.use(express.static(path.join(__dirname, 'عام')));

const users = {};

io.on('connection', (socket) => {
    
    // تسجيل الزائر وتحديد الرتبة تلقائياً
    socket.on('registerUser', (data) => {
        users[socket.id] = { id: socket.id, name: data.name, rank: data.rank || 'زائر' };
        io.emit('updateUserList', users);
        console.log(`${data.name} انضم للشات الصوتي والكتابي.`);
    });

    // استقبال الرسائل وإعادة بثها فورياً في الغرفة
    socket.on('sendMessage', (data) => {
        const userObj = users[socket.id] || { name: 'زائر' };
        io.emit('receiveMessage', {
            id: socket.id,
            user: userObj.name,
            text: data.text
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', users);
    });
});

// التشغيل التلقائي على بورت سيرفر Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`سيرفر الشات الكودي المطور يعمل بنجاح على بورت ${PORT}`);
});
