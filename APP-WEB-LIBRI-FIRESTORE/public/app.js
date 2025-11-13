// public/app.js - CÓDIGO COMPLETO REVISADO COM MODAL

const postList = document.querySelector('#post-list'); 
const addPostForm = document.querySelector('#add-post-form'); 
const modal = document.querySelector('#confirmation-modal'); // NOVO: Captura o modal
const confirmDeleteBtn = document.querySelector('#confirm-delete-btn'); // NOVO: Botão de confirmar
const cancelBtn = document.querySelector('#cancel-btn'); // NOVO: Botão de cancelar
let postIdToDelete = null; // NOVO: Variável para armazenar temporariamente o ID

// Variáveis globais 'db' e 'socket' vêm do index.ejs

/* FUNÇÃO PARA FORMATAR DATA/HORA */
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

/* FUNÇÃO QUE VAI RENDERIZAR OS POSTS NA LISTA */
function renderPost(data, id, isNew = false) {
   
    let li = document.createElement('li');
    let titulo = document.createElement('h4'); 
    let conteudo = document.createElement('p');
    let dataPost = document.createElement('span');
    let deleteBtn = document.createElement('div');
    
    li.setAttribute('data-id', id);
    li.classList.add(isNew ? 'new-post' : 'existing-post'); 

    titulo.textContent = data.titulo;
    conteudo.textContent = data.conteudo;
    dataPost.textContent = formatarData(data.data);
    dataPost.classList.add('post-meta'); 
    
    deleteBtn.textContent = 'x'; 
    deleteBtn.classList.add('delete-btn'); 
    
    // ADICIONANDO OS DADOS AO LI
    li.appendChild(titulo);
    li.appendChild(conteudo);
    li.appendChild(dataPost);
    li.appendChild(deleteBtn);
    
    // NOVO FLUXO: Ao clicar no 'X', apenas EXIBE O MODAL
    deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        postIdToDelete = event.target.parentElement.getAttribute('data-id'); // Armazena o ID
        modal.style.display = 'flex'; // Exibe o modal
        modal.classList.add('is-active');
    });
    
    // INSERÇÃO NA LISTA
    if (isNew) {
        postList.prepend(li);
    } else {
        postList.appendChild(li);
    }
}

// LÓGICA DO MODAL (NOVA SEÇÃO)

// Ação de CONFIRMAR EXCLUSÃO
confirmDeleteBtn.addEventListener('click', () => {
    if (postIdToDelete) {
        // Encontra o item <li> para remoção visual após o sucesso
        const liToRemove = document.querySelector(`li[data-id="${postIdToDelete}"]`);

        db.collection('new-app-libri').doc(postIdToDelete).delete()
            .then(() => {
                console.log("Documento excluído com ID:", postIdToDelete);
                if (liToRemove) {
                    liToRemove.remove(); // Remove o elemento da tela
                }
            })
            .catch((error) => {
                console.error("Erro ao remover documento: ", error);
            });
    }
    
    // Fecha o modal e reseta a variável, independentemente do sucesso/falha
    modal.style.display = 'none';
    modal.classList.remove('is-active');
    postIdToDelete = null; 
});

// Ação de CANCELAR EXCLUSÃO
cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.classList.remove('is-active');
    postIdToDelete = null; // Reseta a variável
});

// FIM DA NOVA LÓGICA DO MODAL

// 1. CARREGAR POSTS EXISTENTES (BUSCA INICIAL)
db.collection('new-app-libri') 
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


// 2. ENVIAR NOVO POST
addPostForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const postData = {
        titulo: addPostForm.tituloPost.value,
        conteudo: addPostForm.conteudoPost.value,
        data: firebase.firestore.FieldValue.serverTimestamp() 
    };

    db.collection('new-app-libri').add(postData) 
        .then(() => {
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