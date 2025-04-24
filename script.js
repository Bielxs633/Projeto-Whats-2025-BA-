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
    const darkModeIcon = document.createElement('i');
    darkModeIcon.className = 'fas fa-moon';
    darkModeToggle.appendChild(darkModeIcon);
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
        darkModeIcon.className = 'fas fa-sun';
    }

    // Função para mostrar a tela inicial
    function showWelcomeScreen() {
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen';
        
        const welcomeIcon = document.createElement('div');
        welcomeIcon.className = 'welcome-icon';
        const icon = document.createElement('i');
        icon.className = 'fas fa-comments';
        welcomeIcon.appendChild(icon);
        
        const title = document.createElement('h2');
        title.textContent = 'WhatsApp Web';
        
        const message = document.createElement('p');
        message.textContent = 'Selecione uma conversa para começar a enviar mensagens';
        
        const hint = document.createElement('div');
        hint.className = 'welcome-hint';
        const hintText = document.createElement('small');
        hintText.textContent = 'Clique em qualquer área vazia para voltar a esta tela';
        hint.appendChild(hintText);
        
        welcomeScreen.appendChild(welcomeIcon);
        welcomeScreen.appendChild(title);
        welcomeScreen.appendChild(message);
        welcomeScreen.appendChild(hint);
        
        messagesContainer.appendChild(welcomeScreen);
        
        currentContactName.textContent = 'WhatsApp';
        currentContactAvatar.textContent = 'W';
        currentContactStatus.textContent = 'Selecione um contato';
    }

    // Funções para consumir a API
    async function fetchUserData(phone) {
        try {
            const response = await fetch(`https://api-whatsapp-2fhu.onrender.com/v1/whatsapp/user/${phone}`);
            if (!response.ok) throw new Error('Erro ao carregar dados do usuário');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchUserData:', error);
            return null;
        }
    }

    async function fetchUserProfile(phone) {
        try {
            const response = await fetch(`https://api-whatsapp-2fhu.onrender.com/v1/whatsapp/user/profile/${phone}`);
            if (!response.ok) throw new Error('Erro ao carregar perfil');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchUserProfile:', error);
            return null;
        }
    }

    async function fetchUserContacts(phone) {
        try {
            const response = await fetch(`https://api-whatsapp-2fhu.onrender.com/v1/whatsapp/contatos/${phone}`);
            if (!response.ok) throw new Error('Erro ao carregar contatos');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchUserContacts:', error);
            return null;
        }
    }

    async function fetchConversation(phone, contactName) {
        try {
            const response = await fetch(`https://api-whatsapp-2fhu.onrender.com/v1/whatsapp/conversas/usuario?numeroTelefone=${phone}&contato=${encodeURIComponent(contactName)}`);
            if (!response.ok) throw new Error('Erro ao carregar conversa');
            return await response.json();
        } catch (error) {
            console.error('Erro fetchConversation:', error);
            return null;
        }
    }

    async function searchInMessages(phone, contactName, keyword) {
        try {
            const response = await fetch(`https://api-whatsapp-2fhu.onrender.com/v1/whatsapp/conversas?numeroTelefone=${phone}&nomeContato=${encodeURIComponent(contactName)}&palavraChave=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error('Erro na pesquisa');
            const data = await response.json();
            
            if (data && data.mensagem) {
                // Formata os resultados para o formato esperado pelo frontend
                const formattedResults = data.mensagem.map(msg => ({
                    sender: msg.remetente === currentUser.account ? 'me' : 'other',
                    content: msg.mensagem,
                    time: msg.horario
                }));
                
                return { mensagem: formattedResults };
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
        darkModeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('whatsappDarkMode', isDarkMode);
    }

    // Função principal para carregar um usuário
    async function loadUser(phone) {
        try {
            // Limpa o container de forma segura
            while (contactsContainer.firstChild) {
                contactsContainer.removeChild(contactsContainer.firstChild);
            }
            
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.textContent = 'Carregando...';
            contactsContainer.appendChild(loadingDiv);
            
            showWelcomeScreen();
            currentContact = null;
            currentUserPhone = phone;
            isSearchActive = false;
            
            // Adiciona borda vermelha durante o carregamento
            userSwitcher.style.border = '2px solid var(--primary-color)';
            
            const [userData, userProfile] = await Promise.all([
                fetchUserData(phone),
                fetchUserProfile(phone)
            ]);
            
            if (!userData || !userProfile) throw new Error('Dados do usuário não encontrados');
            
            currentUser = { ...userData, ...userProfile };
            updateProfileInfo(currentUser);
            await loadContacts();
            
            // Remove a borda vermelha após carregar
            userSwitcher.style.border = '';
            
        } catch (error) {
            console.error('Erro loadUser:', error);
            // Mantém a borda vermelha em caso de erro
            userSwitcher.style.border = '2px solid var(--primary-color)';
            
            // Limpa o container de forma segura
            while (contactsContainer.firstChild) {
                contactsContainer.removeChild(contactsContainer.firstChild);
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Erro ao carregar usuário';
            contactsContainer.appendChild(errorDiv);
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
            // Limpa o container de forma segura
            while (contactsContainer.firstChild) {
                contactsContainer.removeChild(contactsContainer.firstChild);
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Erro ao carregar contatos';
            contactsContainer.appendChild(errorDiv);
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
            // Limpa o container de forma segura
            while (messagesContainer.firstChild) {
                messagesContainer.removeChild(messagesContainer.firstChild);
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Erro ao carregar conversa';
            messagesContainer.appendChild(errorDiv);
        }
    }

    // Renderizar lista de contatos
    function renderContacts(contacts) {
        // Limpa o container de forma segura
        while (contactsContainer.firstChild) {
            contactsContainer.removeChild(contactsContainer.firstChild);
        }
        
        if (contacts.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Nenhum contato encontrado';
            contactsContainer.appendChild(emptyDiv);
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
            
            const contactAvatar = document.createElement('div');
            contactAvatar.className = 'contact-avatar';
            contactAvatar.textContent = contact.name.charAt(0);
            
            const contactInfo = document.createElement('div');
            contactInfo.className = 'contact-info';
            
            const contactName = document.createElement('div');
            contactName.className = 'contact-name';
            contactName.textContent = contact.name;
            
            const contactLastMsg = document.createElement('div');
            contactLastMsg.className = 'contact-last-msg';
            contactLastMsg.textContent = lastMessage;
            
            const contactTime = document.createElement('div');
            contactTime.className = 'contact-time';
            contactTime.textContent = lastMessageTime;
            
            contactInfo.appendChild(contactName);
            contactInfo.appendChild(contactLastMsg);
            
            contactElement.appendChild(contactAvatar);
            contactElement.appendChild(contactInfo);
            contactElement.appendChild(contactTime);
            
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

    // Função para aplicar highlight no texto
    function applyHighlight(text, keyword) {
        const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
        return parts.map((part, index) => {
            if (part.toLowerCase() === keyword.toLowerCase()) {
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'highlight';
                highlightSpan.textContent = part;
                return highlightSpan;
            }
            return document.createTextNode(part);
        });
    }

    // Renderizar mensagens
    function renderMessages(messages, isSearchResult = false, keyword = '') {
        // Limpa o container de forma segura
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        isSearchActive = isSearchResult;
        
        if (messages.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Nenhuma mensagem encontrada';
            messagesContainer.appendChild(emptyDiv);
            return;
        }
        
        if (isSearchResult) {
            const searchHeader = document.createElement('div');
            searchHeader.className = 'search-results-header';
            searchHeader.textContent = `Resultados da pesquisa (${messages.length})`;
            messagesContainer.appendChild(searchHeader);
            
            const backButton = document.createElement('div');
            backButton.className = 'back-button';
            
            const backIcon = document.createElement('i');
            backIcon.className = 'fas fa-arrow-left';
            
            backButton.appendChild(backIcon);
            backButton.appendChild(document.createTextNode(' Voltar para conversa'));
            
            backButton.addEventListener('click', () => {
                if (currentContact) loadConversation(currentContact.name);
            });
            
            messagesContainer.appendChild(backButton);
        }
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';
            
            // Aplica highlight se for uma pesquisa
            if (isSearchResult && keyword) {
                const highlightedParts = applyHighlight(msg.content, keyword);
                highlightedParts.forEach(part => {
                    messageBubble.appendChild(part);
                });
            } else {
                messageBubble.textContent = msg.content;
            }
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            
            const timeText = document.createTextNode(msg.time);
            messageTime.appendChild(timeText);
            
            if (msg.sender === 'me') {
                const checkMarks = document.createTextNode(' ✓✓');
                messageTime.appendChild(checkMarks);
            }
            
            messageElement.appendChild(messageBubble);
            messageElement.appendChild(messageTime);
            
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
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Função para renderizar resultados de busca
    function renderSearchResults(messages, container, keyword) {
        // Limpa o container de forma segura
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (messages.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Nenhum resultado encontrado';
            container.appendChild(emptyDiv);
            return;
        }
        
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'search-results-header';
        resultsHeader.textContent = `Resultados encontrados: ${messages.length}`;
        container.appendChild(resultsHeader);
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `search-result ${msg.sender === 'me' ? 'sent' : 'received'}`;
            
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';
            
            // Aplica highlight nas palavras-chave
            const highlightedParts = applyHighlight(msg.content, keyword);
            highlightedParts.forEach(part => {
                messageBubble.appendChild(part);
            });
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            
            const timeText = document.createTextNode(msg.time);
            messageTime.appendChild(timeText);
            
            if (msg.sender === 'me') {
                const checkMarks = document.createTextNode(' ✓✓');
                messageTime.appendChild(checkMarks);
            }
            
            messageElement.appendChild(messageBubble);
            messageElement.appendChild(messageTime);
            
            container.appendChild(messageElement);
        });
    }

    // Event Listeners
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    userSwitcher.addEventListener('focus', () => {
        userSwitcher.style.border = '2px solid var(--primary-color)';
    });

    userSwitcher.addEventListener('blur', () => {
        userSwitcher.style.border = '';
    });

    userSwitcher.addEventListener('change', (e) => {
        userSwitcher.style.border = '2px solid var(--primary-color)';
        setTimeout(() => {
            userSwitcher.style.border = '';
        }, 1000);
        loadUser(e.target.value);
    });
    
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
            // Cria um elemento de aviso na página
            const warning = document.createElement('div');
            warning.className = 'empty';
            warning.textContent = 'Selecione um contato primeiro';
            
            // Limpa o container de forma segura
            while (messagesContainer.firstChild) {
                messagesContainer.removeChild(messagesContainer.firstChild);
            }
            
            messagesContainer.appendChild(warning);
            return;
        }
        
        // Cria um elemento de busca na página
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        
        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        
        const searchHeader = document.createElement('div');
        searchHeader.className = 'search-header';
        
        const backButton = document.createElement('i');
        backButton.className = 'fas fa-arrow-left back-button';
        
        const searchKeywordInput = document.createElement('input');
        searchKeywordInput.type = 'text';
        searchKeywordInput.className = 'search-keyword-input';
        searchKeywordInput.placeholder = 'Digite a palavra-chave...';
        
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.textContent = 'Buscar';
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-container';
        
        searchHeader.appendChild(backButton);
        searchHeader.appendChild(searchKeywordInput);
        searchHeader.appendChild(searchButton);
        
        searchBox.appendChild(searchHeader);
        searchBox.appendChild(resultsContainer);
        
        messagesContainer.appendChild(searchBox);
        
        backButton.addEventListener('click', () => {
            if (currentContact) loadConversation(currentContact.name);
        });
        
        const performSearch = async () => {
            const keyword = searchKeywordInput.value.trim();
            if (!keyword) return;
            
            const results = await searchInMessages(currentUserPhone, currentContact.name, keyword);
            if (results && results.mensagem) {
                renderSearchResults(results.mensagem, resultsContainer, keyword);
            } else {
                while (resultsContainer.firstChild) {
                    resultsContainer.removeChild(resultsContainer.firstChild);
                }
                
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty';
                emptyDiv.textContent = 'Nenhum resultado encontrado';
                resultsContainer.appendChild(emptyDiv);
            }
        };
        
        searchButton.addEventListener('click', performSearch);
        searchKeywordInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());
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