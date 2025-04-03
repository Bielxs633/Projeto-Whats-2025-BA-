'use strict';

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const sidebar = document.getElementById('sidebar');
    const chat = document.getElementById('chat');
    const profile = document.getElementById('profile');
    const contactsContainer = document.getElementById('contacts');
    const messagesContainer = document.getElementById('messages');
    const currentContactName = document.getElementById('current-contact-name');
    const currentContactAvatar = document.getElementById('current-contact-avatar');
    const currentContactStatus = document.getElementById('current-contact-status');
    const profileName = document.getElementById('profile-name');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileStatus = document.getElementById('profile-status');
    const profileAbout = document.getElementById('profile-about');
    const profilePhone = document.getElementById('profile-phone');
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const searchInput = document.querySelector('.search-input');
    const userSwitcher = document.getElementById('user-switcher');
    const searchMessagesBtn = document.getElementById('search-messages');
    const menuToggle = document.getElementById('menu-toggle');

    // Adiciona o botão de modo escuro
    const darkModeToggle = document.createElement('div');
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.title = 'Alternar modo escuro';
    document.querySelector('.header-icons').prepend(darkModeToggle);

    // Variáveis de estado
    let currentUser = null;
    let currentContact = null;
    let allContacts = [];
    let filteredContacts = [];
    let currentUserPhone = '11987876567';
    let isDarkMode = localStorage.getItem('whatsappDarkMode') === 'true';
    let isSearchActive = false;

    // Aplica o modo escuro se necessário
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Função para mostrar a tela inicial
    function showWelcomeScreen() {
        messagesContainer.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h2>WhatsApp Web</h2>
                <p>Selecione uma conversa para começar a enviar mensagens</p>
                <div class="welcome-hint">
                    <small>Clique em qualquer área vazia para voltar a esta tela</small>
                </div>
            </div>
        `;
        currentContactName.textContent = 'WhatsApp';
        currentContactAvatar.textContent = 'W';
        currentContactStatus.textContent = 'Selecione um contato';
    }

    // Funções para consumir a API
    async function fetchUserData(phone) {
        try {
            const response = await fetch(`http://localhost:3030/v1/whatsapp/user/${phone}`);
            if (!response.ok) throw new Error('Erro ao carregar dados do usuário');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchUserData:', error);
            return null;
        }
    }

    async function fetchUserProfile(phone) {
        try {
            const response = await fetch(`http://localhost:3030/v1/whatsapp/user/profile/${phone}`);
            if (!response.ok) throw new Error('Erro ao carregar perfil');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchUserProfile:', error);
            return null;
        }
    }

    async function fetchUserContacts(phone) {
        try {
            const response = await fetch(`http://localhost:3030/v1/whatsapp/contatos/${phone}`);
            if (!response.ok) throw new Error('Erro ao carregar contatos');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchUserContacts:', error);
            return null;
        }
    }

    async function fetchConversation(phone, contactName) {
        try {
            const response = await fetch(`http://localhost:3030/v1/whatsapp/conversas/usuario?numeroTelefone=${phone}&contato=${encodeURIComponent(contactName)}`);
            if (!response.ok) throw new Error('Erro ao carregar conversa');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchConversation:', error);
            return null;
        }
    }

    async function searchInMessages(phone, contactName, keyword) {
        try {
            const response = await fetch(`http://localhost:3030/v1/whatsapp/conversas?numeroTelefone=${phone}&nomeContato=${encodeURIComponent(contactName)}&palavraChave=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error('Erro na pesquisa');
            const data = await response.json();
            
            if (data && data.mensagem) {
                const highlightedMessages = data.mensagem.map(msg => {
                    const highlightedContent = msg.content.replace(
                        new RegExp(keyword, 'gi'),
                        match => `<span class="highlight">${match}</span>`
                    );
                    return { ...msg, content: highlightedContent };
                });
                return { ...data, mensagem: highlightedMessages };
            }
            return data;
        } catch (error) {
            console.error('Erro searchInMessages:', error);
            return null;
        }
    }

    // Função para alternar o modo escuro
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('whatsappDarkMode', isDarkMode);
    }

    // Função principal para carregar um usuário
    async function loadUser(phone) {
        try {
            contactsContainer.innerHTML = '<div class="loading">Carregando...</div>';
            showWelcomeScreen();
            currentContact = null;
            currentUserPhone = phone;
            isSearchActive = false;
            
            const [userData, userProfile] = await Promise.all([
                fetchUserData(phone),
                fetchUserProfile(phone)
            ]);
            
            if (!userData || !userProfile) throw new Error('Dados do usuário não encontrados');
            
            currentUser = { ...userData, ...userProfile };
            updateProfileInfo(currentUser);
            await loadContacts();
            
        } catch (error) {
            console.error('Erro loadUser:', error);
            contactsContainer.innerHTML = '<div class="error">Erro ao carregar usuário</div>';
        }
    }

    // Carregar contatos do usuário atual
    async function loadContacts() {
        try {
            const contacts = await fetchUserContacts(currentUserPhone);
            if (!contacts || !Array.isArray(contacts)) throw new Error('Contatos inválidos');
            
            allContacts = contacts;
            filteredContacts = [...contacts];
            renderContacts(filteredContacts);
            
        } catch (error) {
            console.error('Erro loadContacts:', error);
            contactsContainer.innerHTML = '<div class="error">Erro ao carregar contatos</div>';
        }
    }

    // Carregar conversa com um contato específico
    async function loadConversation(contactName) {
        try {
            currentContact = allContacts.find(c => c.name === contactName);
            if (!currentContact) throw new Error('Contato não encontrado');
            
            updateCurrentContactInfo(currentContact);
            
            const conversation = await fetchConversation(currentUserPhone, contactName);
            if (!conversation) throw new Error('Conversa não encontrada');
            
            isSearchActive = false;
            renderMessages(conversation.mensagens || []);
            
        } catch (error) {
            console.error('Erro loadConversation:', error);
            messagesContainer.innerHTML = '<div class="error">Erro ao carregar conversa</div>';
        }
    }

    // Renderizar lista de contatos
    function renderContacts(contacts) {
        contactsContainer.innerHTML = '';
        
        if (contacts.length === 0) {
            contactsContainer.innerHTML = '<div class="empty">Nenhum contato encontrado</div>';
            return;
        }
        
        contacts.forEach(contact => {
            const lastMessage = contact.messages && contact.messages.length > 0 
                ? contact.messages[contact.messages.length - 1].content 
                : contact.description || 'Sem mensagens';
            
            const lastMessageTime = contact.messages && contact.messages.length > 0 
                ? contact.messages[contact.messages.length - 1].time 
                : '';
            
            const contactElement = document.createElement('div');
            contactElement.className = `contact ${currentContact?.name === contact.name ? 'active' : ''}`;
            contactElement.innerHTML = `
                <div class="contact-avatar">${contact.name.charAt(0)}</div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-last-msg">${lastMessage}</div>
                </div>
                <div class="contact-time">${lastMessageTime}</div>
            `;
            
            contactElement.addEventListener('click', async () => {
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
                contactElement.classList.add('active');
                await loadConversation(contact.name);
                
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    chat.classList.add('active');
                }
            });
            
            contactsContainer.appendChild(contactElement);
        });
    }

    // Renderizar mensagens
    function renderMessages(messages, isSearchResult = false) {
        messagesContainer.innerHTML = '';
        isSearchActive = isSearchResult;
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="empty">Nenhuma mensagem encontrada</div>';
            return;
        }
        
        if (isSearchResult) {
            const searchHeader = document.createElement('div');
            searchHeader.className = 'search-results-header';
            searchHeader.textContent = `Resultados da pesquisa (${messages.length})`;
            messagesContainer.appendChild(searchHeader);
            
            const backButton = document.createElement('div');
            backButton.className = 'back-button';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar para conversa';
            backButton.addEventListener('click', () => {
                if (currentContact) loadConversation(currentContact.name);
            });
            messagesContainer.appendChild(backButton);
        }
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            messageElement.innerHTML = `
                <div class="message-bubble">${msg.content}</div>
                <div class="message-time">
                    ${msg.time} ${msg.sender === 'me' ? '✓✓' : ''}
                </div>
            `;
            messagesContainer.appendChild(messageElement);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Atualizar informações do contato atual
    function updateCurrentContactInfo(contact) {
        currentContactName.textContent = contact.name;
        currentContactAvatar.textContent = contact.name.charAt(0);
        currentContactStatus.textContent = contact.description || 'Online';
    }

    // Atualizar perfil do usuário
    function updateProfileInfo(user) {
        profileName.textContent = user.account || user.nickname || 'Usuário';
        profileAvatar.textContent = (user.account || user.nickname || 'U').charAt(0);
        profileStatus.textContent = user.nickname || 'Online';
        profileAbout.textContent = user.inicio ? `Usuário desde ${user.inicio}` : 'Sem informação';
        profilePhone.textContent = user.contato || user.number || 'Número não disponível';
    }

    // Enviar mensagem (simulação)
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText || !currentContact || isSearchActive) return;
        
        const newMessage = {
            sender: 'me',
            content: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';
        messageElement.innerHTML = `
            <div class="message-bubble">${messageText}</div>
            <div class="message-time">${newMessage.time} ✓✓</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messageInput.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Função para renderizar resultados de busca
    function renderSearchResults(messages, container) {
        container.innerHTML = '';
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="empty">Nenhum resultado encontrado</div>';
            return;
        }
        
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'search-results-header';
        resultsHeader.textContent = `Resultados encontrados: ${messages.length}`;
        container.appendChild(resultsHeader);
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `search-result ${msg.sender === 'me' ? 'sent' : 'received'}`;
            messageElement.innerHTML = `
                <div class="message-bubble">${msg.content}</div>
                <div class="message-time">
                    ${msg.time} ${msg.sender === 'me' ? '✓✓' : ''}
                </div>
            `;
            container.appendChild(messageElement);
        });
    }

    // Event Listeners
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    userSwitcher.addEventListener('change', (e) => loadUser(e.target.value));
    
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
    
    searchMessagesBtn.addEventListener('click', async () => {
        if (!currentContact) {
            // Cria um elemento de aviso na página em vez de usar alert
            const warning = document.createElement('div');
            warning.className = 'empty';
            warning.textContent = 'Selecione um contato primeiro';
            messagesContainer.innerHTML = '';
            messagesContainer.appendChild(warning);
            return;
        }
        
        // Cria um elemento de busca na página
        messagesContainer.innerHTML = '';
        
        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        searchBox.innerHTML = `
            <div class="search-header">
                <i class="fas fa-arrow-left back-button"></i>
                <input type="text" class="search-keyword-input" placeholder="Digite a palavra-chave...">
                <button class="search-button">Buscar</button>
            </div>
            <div class="search-results-container"></div>
        `;
        
        messagesContainer.appendChild(searchBox);
        
        const backButton = searchBox.querySelector('.back-button');
        const searchInput = searchBox.querySelector('.search-keyword-input');
        const searchButton = searchBox.querySelector('.search-button');
        const resultsContainer = searchBox.querySelector('.search-results-container');
        
        backButton.addEventListener('click', () => {
            if (currentContact) loadConversation(currentContact.name);
        });
        
        const performSearch = async () => {
            const keyword = searchInput.value.trim();
            if (!keyword) return;
            
            const results = await searchInMessages(currentUserPhone, currentContact.name, keyword);
            if (results && results.mensagem) {
                renderSearchResults(results.mensagem, resultsContainer);
            } else {
                resultsContainer.innerHTML = '<div class="empty">Nenhum resultado encontrado</div>';
            }
        };
        
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());
    });
    
    menuToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            profile.classList.toggle('active');
            chat.classList.toggle('active');
        }
    });

    // Inicialização
    loadUser(currentUserPhone);
});