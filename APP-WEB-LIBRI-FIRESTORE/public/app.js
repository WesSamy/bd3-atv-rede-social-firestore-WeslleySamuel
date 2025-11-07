const postList = document.querySelector('#post-list'); // Lista UL de posts
const addPostForm = document.querySelector('#add-post-form'); // Formulário de post

function formatarData(timestamp) {
    if (!timestamp) {
        return 'Data Desconhecida';
    }
    
    let date;
    
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } 
    else {
        date = new Date(timestamp);
    }

    return date.toLocaleDateString('pt-BR') + ' - ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
}

function renderPost(data, id, isNew = false) {
   
    let li = document.createElement('li');
    let titulo = document.createElement('span');
    let conteudo = document.createElement('p');
    let dataPost = document.createElement('span');
    
    li.setAttribute('data-id', id);
    li.classList.add(isNew ? 'new-post' : 'existing-post'); 

    titulo.textContent = data.titulo;
    conteudo.textContent = data.conteudo;
    dataPost.textContent = formatarData(data.data);
    
    li.appendChild(titulo);
    li.appendChild(conteudo);
    li.appendChild(dataPost);
    
    if (isNew) {
        postList.prepend(li);
    } else {
        postList.appendChild(li);
    }
}

db.collection('new-app-libri') // Nome da coleção conforme o Firebase
    .orderBy('data', 'desc') 
    .get()
    .then(
        (snapshot)=>{
            snapshot.docs.forEach(doc => {
                renderPost(doc.data(), doc.id); 
            });
        }
    )
    .catch(error => {
        console.error("Erro ao carregar posts iniciais: ", error);
    });

addPostForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const postData = {
        titulo: addPostForm.tituloPost.value,
        conteudo: addPostForm.conteudoPost.value,
        data: firebase.firestore.FieldValue.serverTimestamp() 
    };

    db.collection('new-app-libri').add(postData) 
        .then((docRef) => {
            console.log("Documento escrito com ID: ", docRef.id);
            
            const socketData = {
                titulo: postData.titulo,
                conteudo: postData.conteudo,
                data: new Date().toISOString()
            };
            socket.emit('sendMessage', socketData); 
            
            addPostForm.reset();
        })
        .catch((error) => {
            console.error("Erro ao adicionar documento: ", error);
        });
});

// 3. RECEBER POSTS EM TEMPO REAL
socket.on('receivedMessage', (data) => {
    renderPost(data, 'socket-new', true); 
});
