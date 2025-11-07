const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server); 

const port = 3000; 

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.get('/', (req, res) => {
   
    res.render('index');
});

io.on('connection', (socket) => {
    console.log(`Novo usuário conectado: ${socket.id}`);

    socket.on('sendMessage', (post) => {
        console.log('Novo post recebido (via socket):', post.titulo);
        
        io.emit('receivedMessage', post);
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});