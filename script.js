'use strict';

// Quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos importantes da página
    const sidebar = document.getElementById('sidebar');
    const chat = document.getElementById('chat');
    const contactsContainer = document.getElementById('contacts');
    const messagesContainer = document.getElementById('messages');
    const currentContactName = document.getElementById('current-contact-name');
    const currentContactAvatar = document.getElementById('current-contact-avatar');
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const searchInput = document.querySelector('.search-input');
    const userSwitcher = document.getElementById('user-switcher');
    const searchMessagesBtn = document.getElementById('search-messages');

    // Adiciona o botão para alternar entre tema claro e escuro
    const darkModeToggle = document.createElement('div');
    const darkModeIcon = document.createElement('i');
    darkModeIcon.className = 'fas fa-moon';
    darkModeToggle.appendChild(darkModeIcon);
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.title = 'Alternar modo escuro';
    document.querySelector('.header-icons').prepend(darkModeToggle);

    // Variáveis para controlar o estado do aplicativo
    let currentUser = null;
    let currentContact = null;
    let allContacts = [];
    let filteredContacts = [];
    let currentUserPhone = '11987876567';
    let isDarkMode = false;

    // Mostra a tela inicial quando não há conversa selecionada
    function showWelcomeScreen() {
        // Limpa as mensagens atuais
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        // Cria os elementos da tela de boas-vindas
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen';
        
        // Adiciona ícone, título e mensagem
        const welcomeIcon = document.createElement('div');
        welcomeIcon.className = 'welcome-icon';
        const icon = document.createElement('i');
        icon.className = 'fas fa-comments';
        welcomeIcon.appendChild(icon);
        
        const title = document.createElement('h2');
        title.textContent = 'WhatsApp Web';
        
        const message = document.createElement('p');
        message.textContent = 'Selecione uma conversa para começar a enviar mensagens';
        
        welcomeScreen.appendChild(welcomeIcon);
        welcomeScreen.appendChild(title);
        welcomeScreen.appendChild(message);
        
        messagesContainer.appendChild(welcomeScreen);
        
        // Atualiza informações do contato (padrão)
        currentContactName.textContent = 'WhatsApp';
        currentContactAvatar.textContent = 'W';
    }

    // Carrega os dados de um usuário específico
    async function loadUser(phone) {
        try {
            // Mostra mensagem de carregamento
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.textContent = 'Carregando...';
            contactsContainer.appendChild(loadingDiv);
            
            // Mostra tela inicial
            showWelcomeScreen();
            currentContact = null;
            currentUserPhone = phone;
            
            // Simula carregamento de dados do usuário
            currentUser = { name: "Usuário", phone: phone };
            
            // Carrega os contatos do usuário
            await loadContacts();
            
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            
            // Mostra mensagem de erro
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Erro ao carregar usuário';
            contactsContainer.appendChild(errorDiv);
        }
    }

    // Carrega a lista de contatos do usuário atual
    async function loadContacts() {
        try {
            // Simula uma lista de contatos (em um app real, viria de uma API)
            const contacts = [
                { name: "Maria Silva", messages: [] },
                { name: "João Santos", messages: [] },
                { name: "Ana Oliveira", messages: [] }
            ];
            
            allContacts = contacts;
            filteredContacts = [...contacts];
            
            // Mostra os contatos na tela
            renderContacts(filteredContacts);
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            
            // Mostra mensagem de erro
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Erro ao carregar contatos';
            contactsContainer.appendChild(errorDiv);
        }
    }

    // Mostra os contatos na tela
    function renderContacts(contacts) {
        // Limpa a lista de contatos
        while (contactsContainer.firstChild) {
            contactsContainer.removeChild(contactsContainer.firstChild);
        }
        
        // Se não houver contatos, mostra mensagem
        if (contacts.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Nenhum contato encontrado';
            contactsContainer.appendChild(emptyDiv);
            return;
        }
        
        // Para cada contato, cria um elemento na lista
        contacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = `contact ${currentContact?.name === contact.name ? 'active' : ''}`;
            
            // Avatar do contato (inicial do nome)
            const contactAvatar = document.createElement('div');
            contactAvatar.className = 'contact-avatar';
            contactAvatar.textContent = contact.name.charAt(0);
            
            // Informações do contato (nome e última mensagem)
            const contactInfo = document.createElement('div');
            contactInfo.className = 'contact-info';
            
            const contactName = document.createElement('div');
            contactName.className = 'contact-name';
            contactName.textContent = contact.name;
            
            const contactLastMsg = document.createElement('div');
            contactLastMsg.className = 'contact-last-msg';
            contactLastMsg.textContent = 'Sem mensagens';
            
            contactInfo.appendChild(contactName);
            contactInfo.appendChild(contactLastMsg);
            
            contactElement.appendChild(contactAvatar);
            contactElement.appendChild(contactInfo);
            
            // Quando clicar no contato, carrega a conversa
            contactElement.addEventListener('click', async () => {
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
                contactElement.classList.add('active');
                await loadConversation(contact.name);
            });
            
            contactsContainer.appendChild(contactElement);
        });
    }

    // Carrega a conversa com um contato específico
    async function loadConversation(contactName) {
        try {
            // Encontra o contato na lista
            currentContact = allContacts.find(c => c.name === contactName);
            
            // Atualiza o cabeçalho do chat
            currentContactName.textContent = currentContact.name;
            currentContactAvatar.textContent = currentContact.name.charAt(0);
            
            // Simula mensagens da conversa
            const messages = [
                { sender: 'them', content: 'Olá! Como você está?', time: '10:30' },
                { sender: 'me', content: 'Estou bem, obrigado!', time: '10:32' }
            ];
            
            // Mostra as mensagens na tela
            renderMessages(messages);
            
        } catch (error) {
            console.error('Erro ao carregar conversa:', error);
            
            // Mostra mensagem de erro
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Erro ao carregar conversa';
            messagesContainer.appendChild(errorDiv);
        }
    }

    // Mostra as mensagens na tela
    function renderMessages(messages) {
        // Limpa as mensagens atuais
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        // Se não houver mensagens, mostra aviso
        if (messages.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Nenhuma mensagem encontrada';
            messagesContainer.appendChild(emptyDiv);
            return;
        }
        
        // Para cada mensagem, cria um elemento na tela
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            
            // Balão da mensagem
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';
            messageBubble.textContent = msg.content;
            
            // Hora da mensagem
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = msg.time;
            
            messageElement.appendChild(messageBubble);
            messageElement.appendChild(messageTime);
            
            messagesContainer.appendChild(messageElement);
        });
        
        // Rolagem automática para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Envia uma nova mensagem
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText || !currentContact) return;
        
        // Cria a nova mensagem
        const newMessage = {
            sender: 'me',
            content: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // Mostra a mensagem na tela
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        messageBubble.textContent = messageText;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = `${newMessage.time} ✓✓`;
        
        messageElement.appendChild(messageBubble);
        messageElement.appendChild(messageTime);
        
        messagesContainer.appendChild(messageElement);
        messageInput.value = '';
        
        // Rolagem automática para a nova mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Alterna entre tema claro e escuro
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        darkModeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('whatsappDarkMode', isDarkMode);
    }

    // Configura os eventos/interações
    darkModeToggle.addEventListener('click', toggleDarkMode);
    userSwitcher.addEventListener('change', (e) => loadUser(e.target.value));
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
    
    // Filtra contatos quando digitar na barra de pesquisa
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredContacts = allContacts.filter(contact => 
            contact.name.toLowerCase().includes(term)
        );
        renderContacts(filteredContacts);
    });

    // Inicia o aplicativo carregando o primeiro usuário
    loadUser(currentUserPhone);
});