'use strict'

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const contactsContainer = document.getElementById('contacts');
    const messagesContainer = document.getElementById('messages');
    const currentContactName = document.getElementById('current-contact-name');
    const currentContactAvatar = document.getElementById('current-contact-avatar');
    const currentContactStatus = document.getElementById('current-contact-status');
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const searchInput = document.querySelector('.search-input');

    // Variáveis de estado
    let currentUser = null;
    let currentContact = null;
    let allContacts = [];
    let filteredContacts = [];

    // 1. Carrega os dados do usuário principal
    async function loadInitialData() {
        try {
            // Carrega o usuário principal (Ricardo da Silva como exemplo)
            const userResponse = await fetch('http://localhost:3030/v1/whatsapp/user/11987876567');
            const userData = await userResponse.json();
            
            // Carrega o perfil do usuário
            const profileResponse = await fetch('http://localhost:3030/v1/whatsapp/user/profile/11987876567');
            const profileData = await profileResponse.json();
            
            currentUser = {
                ...userData,
                ...profileData
            };
            
            updateProfileInfo(currentUser);
            loadContacts();
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            alert('Erro ao carregar dados. Verifique o console para detalhes.');
        }
    }

    // 2. Carrega a lista de contatos
    async function loadContacts() {
        try {
            const response = await fetch('http://localhost:3030/v1/whatsapp/contatos/11987876567');
            const contacts = await response.json();
            
            allContacts = contacts;
            filteredContacts = [...contacts];
            
            renderContacts(filteredContacts);
            
            // Carrega a primeira conversa por padrão
            if (filteredContacts.length > 0) {
                loadConversation(filteredContacts[0].name);
            }
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
        }
    }

    // 3. Carrega as mensagens de um contato específico
    async function loadConversation(contactName) {
        try {
            const response = await fetch(`http://localhost:3030/v1/whatsapp/conversas/usuario?numeroTelefone=11987876567&contato=${encodeURIComponent(contactName)}`);
            const conversationData = await response.json();
            
            // Encontra o contato completo na lista
            currentContact = allContacts.find(c => c.name === contactName);
            
            if (currentContact && conversationData) {
                updateCurrentContactInfo(currentContact);
                renderMessages(conversationData.mensagens || []);
            }
            
        } catch (error) {
            console.error('Erro ao carregar conversa:', error);
        }
    }

    // 4. Renderiza a lista de contatos
    function renderContacts(contacts) {
        contactsContainer.innerHTML = '';
        
        contacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = 'contact';
            
            // Ínicio do conteúdo do contato
            let contactHTML = `
                <div class="contact-avatar">${contact.name.charAt(0)}</div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-last-msg">${contact.description || 'Sem descrição'}</div>
                </div>
            `;
            
            // Se tiver mensagens, mostra a última e o horário
            if (contact.messages && contact.messages.length > 0) {
                const lastMsg = contact.messages[contact.messages.length - 1];
                contactHTML = contactHTML.replace('Sem descrição', lastMsg.content);
                contactHTML += `<div class="contact-time">${lastMsg.time}</div>`;
            } else {
                contactHTML += '<div class="contact-time"></div>';
            }
            
            contactElement.innerHTML = contactHTML;
            
            // Evento de clique no contato
            contactElement.addEventListener('click', () => {
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
                contactElement.classList.add('active');
                loadConversation(contact.name);
            });
            
            contactsContainer.appendChild(contactElement);
        });
    }

    // 5. Renderiza as mensagens
    function renderMessages(messages) {
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            
            messageElement.innerHTML = `
                <div class="message-bubble">${msg.content}</div>
                <div class="message-time">${msg.time}</div>
            `;
            
            messagesContainer.appendChild(messageElement);
        });
        
        // Rolagem para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 6. Atualiza as informações do contato atual
    function updateCurrentContactInfo(contact) {
        currentContactName.textContent = contact.name;
        currentContactAvatar.textContent = contact.name.charAt(0);
        currentContactStatus.textContent = contact.description || 'Online';
    }

    // 7. Atualiza o perfil do usuário
    function updateProfileInfo(user) {
        document.getElementById('profile-name').textContent = user.account || 'Usuário';
        document.getElementById('profile-avatar').textContent = (user.account || 'U').charAt(0);
        document.getElementById('profile-status').textContent = user.nickname || 'Online';
        document.getElementById('profile-about').textContent = user.inicio ? `Usuário desde ${user.inicio}` : 'Sem informação';
        document.getElementById('profile-phone').textContent = user.contato || 'Número não disponível';
    }

    // 8. Função para enviar mensagem (simulada)
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText && currentContact) {
            const newMessage = {
                sender: 'me',
                content: messageText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            // Adiciona a mensagem na UI (em uma aplicação real, enviaria para a API)
            const messageElement = document.createElement('div');
            messageElement.className = 'message sent';
            messageElement.innerHTML = `
                <div class="message-bubble">${messageText}</div>
                <div class="message-time">${newMessage.time}</div>
            `;
            
            messagesContainer.appendChild(messageElement);
            messageInput.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredContacts = allContacts.filter(contact => 
            contact.name.toLowerCase().includes(term) || 
            (contact.description && contact.description.toLowerCase().includes(term))
        );
        renderContacts(filteredContacts);
    });

    // Inicializa o app
    loadInitialData();
});