const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {};
let gameActive = false;
let luckyNumber = 0;

io.on('connection', (socket) => {
    
    // تسجيل الزائر عند دخوله
    socket.on('registerUser', (data) => {
        users[socket.id] = { id: socket.id, name: data.name, rank: data.rank, style: data.style };
        io.emit('updateUserList', users);
        console.log(`${data.name} دخل الشات بكامل تصميمه.`);
    });

    // تحديث الرتب من متجر التيجان
    socket.on('updateRank', (data) => {
        if(users[socket.id]) {
            users[socket.id].rank = data.rank;
            users[socket.id].style = data.style;
            io.emit('updateUserList', users);
        }
    });

    // بث المحادثة العامة
    socket.on('sendMessage', (data) => {
        const userObj = users[socket.id] || { name: 'زائر', style: 'black' };
        io.emit('receiveMessage', {
            id: socket.id,
            user: userObj.name,
            style: userObj.style,
            text: data.text
        });
    });

    // نظام المحادثات الخاصة المشفرة
    socket.on('sendPrivateMessage', (data) => {
        const targetId = data.targetId;
        if (io.sockets.sockets.get(targetId)) {
            socket.to(targetId).emit('receivePrivateMessage', {
                senderId: socket.id,
                senderName: users[socket.id]?.name || 'زائر',
                text: data.text
            });
        }
    });

    // نظام ألعاب المراقب الآلي الفورية
    socket.on('startBotGame', () => {
        if(!gameActive) {
            gameActive = true;
            luckyNumber = Math.floor(Math.random() * 10) + 1;
            io.emit('receiveBotMessage', { text: "🤖 تم إطلاق لعبة التخمين! قمت باختيار رقم سري من 1 إلى 10. اكتب في صندوق الإدخال: (/تخمين الرقم) لمعرفة الفائز!" });
        }
    });

    socket.on('sendBotGameAnswer', (data) => {
        if(gameActive) {
            const userAnswer = parseInt(data.answer);
            if(userAnswer === luckyNumber) {
                gameActive = false;
                io.emit('receiveBotMessage', { text: `🎉 الفائز هو العضو [ ${users[socket.id]?.name || 'زائر'} ]! الرقم الصحيح كان: ${luckyNumber}. مبروك بالملي!` });
            } else {
                socket.emit('receiveBotMessage', { text: "❌ الرقم خاطئ! حاول تخمين رقم آخر بسرعة." });
            }
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', users);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`سيرفر شات دِكرى المطور يعمل بالكامل على بورت ${PORT}`);
});
