document.addEventListener('DOMContentLoaded', () => {
    // --- 0. REFERÊNCIAS DE ELEMENTOS ---
    const form = document.getElementById('appForm');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const categoryShortcuts = document.getElementById('categoryShortcuts');
    const themePalette = document.getElementById('themePalette');
    
    if (!form || !categoriesContainer || !categoryShortcuts || !themePalette) {
        console.error("Erro: Um ou mais elementos HTML essenciais não foram encontrados.");
        return; 
    }

    const categoryMap = {};
    const root = document.documentElement; // Representa a tag <html>

    // Variável para armazenar a lista de aplicativos
    let appData = JSON.parse(localStorage.getItem('appData')) || [];
    
    // --- FUNÇÕES DE PERSISTÊNCIA E COR ---

    /**
     * Converte HEX para HSL, ajusta o brilho (Lightness), e retorna o HEX.
     * Função mantida (é longa, mas correta)
     */
    function adjustLightness(hex, lightnessAdjustment) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }

        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        l = Math.max(0, Math.min(1, l + lightnessAdjustment));

        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        let newR = hue2rgb(p, q, h + 1/3);
        let newG = hue2rgb(p, q, h);
        let newB = hue2rgb(p, q, h - 1/3);

        const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
    
    const primaryColors = [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#17a2b8', 
        '#fd7e14', '#e83e8c', '#6c757d', '#00bcd4', '#3f51b5', '#795548',
    ];

    let activeColorButton = null;

    function changeThemeColor(newPrimaryColor, button) {
        root.style.setProperty('--primary-color', newPrimaryColor);
        // Escurece em 60%
        const headerBgColor = adjustLightness(newPrimaryColor, -0.6); 
        root.style.setProperty('--header-footer-bg', headerBgColor);
        root.style.setProperty('--site-background', '#f8f9fa');

        localStorage.setItem('themeColor', newPrimaryColor);

        if (activeColorButton) {
            activeColorButton.classList.remove('active');
        }

        if (button) {
            button.classList.add('active');
            activeColorButton = button;
        }
    }

    function renderThemePalette() {
        const savedColor = localStorage.getItem('themeColor') || primaryColors[0];
        let defaultButton = null;

        primaryColors.forEach((color) => {
            const button = document.createElement('button');
            button.className = 'color-swatch-button';
            button.style.backgroundColor = color;
            button.setAttribute('data-color', color);
            
            button.addEventListener('click', () => {
                changeThemeColor(color, button);
            });

            themePalette.appendChild(button);

            if (color === savedColor) {
                defaultButton = button;
            }
        });
        
        changeThemeColor(savedColor, defaultButton);
    }

    renderThemePalette(); 
    
    // -------------------------------------------------------------
    
    const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const createShortcutButton = (categoryKey, displayName, targetElement) => {
        if (document.getElementById(`shortcut-${categoryKey}`)) {
            return;
        }

        const button = document.createElement('button');
        button.textContent = displayName;
        button.className = 'shortcut-button';
        button.id = `shortcut-${categoryKey}`; 

        button.addEventListener('click', () => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        categoryShortcuts.appendChild(button);
    };

    /**
     * Remove uma categoria e seu atalho se estiver vazia.
     */
    const cleanupCategory = (categoryKey) => {
        const categoryContainer = categoryMap[categoryKey];
        if (categoryContainer && categoryContainer.children.length === 0) {
            // Remove a seção da categoria
            const categorySection = document.getElementById(categoryKey);
            if (categorySection) {
                categorySection.remove();
            }
            // Remove o atalho
            const shortcutButton = document.getElementById(`shortcut-${categoryKey}`);
            if (shortcutButton) {
                shortcutButton.remove();
            }
            // Limpa o mapa
            delete categoryMap[categoryKey];
        }
    };

    /**
     * Salva o estado atual do appData no Local Storage.
     */
    const saveAppsToLocalStorage = () => {
        localStorage.setItem('appData', JSON.stringify(appData));
    };

    /**
     * Lógica de exclusão do cartão.
     */
    const handleDeleteApp = (event, appIndex) => {
        // Impede que o clique no botão ative o clique do card (navegação)
        event.stopPropagation();
        
        if (!confirm('Tem certeza que deseja remover este item?')) {
            return;
        }

        // 1. Remove do DOM
        const card = event.target.closest('.app-card');
        if (card) {
            const categoryContainer = card.parentNode;
            const categorySection = categoryContainer.parentNode;
            const categoryKey = categorySection.id; 
            
            card.remove();

            // 2. Remove do array de dados e salva
            appData.splice(appIndex, 1);
            saveAppsToLocalStorage();

            // 3. Verifica e limpa a categoria se estiver vazia
            cleanupCategory(categoryKey);

            // Recarrega o display para garantir que os índices dos botões restantes estejam corretos
            reloadAppDisplay();
        }
    };

    /**
     * Cria e retorna o elemento HTML do card (App).
     * @param {object} app - O objeto de dados do aplicativo.
     * @param {number} index - O índice do aplicativo no array appData.
     */
    const createAppCard = (app, index) => {
        const card = document.createElement('div');
        card.className = "app-card";
        // Navegação ocorre no clique do CARD (exceto no clique do botão)
        card.onclick = () => window.open(app.link, '_blank');
        
        const imageEl = document.createElement('img');
        imageEl.src = app.imgSrc;
        imageEl.alt = app.name;
        imageEl.className = "app-icon";

        const nameEl = document.createElement('h3');
        nameEl.textContent = app.name;
        nameEl.className = "app-name";

        // --- ATUALIZADO: Botão de Excluir com o novo ícone e classe ---
        const deleteButton = document.createElement('button');
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = " &times; "; // Usa &times; (x) ou "✖" para um visual mais limpo
        deleteButton.setAttribute('aria-label', 'Excluir aplicativo');

        // Adiciona o listener de exclusão, passando o índice
        deleteButton.addEventListener('click', (e) => handleDeleteApp(e, index));

        // Adiciona o botão de exclusão primeiro para o posicionamento
        card.appendChild(deleteButton); 
        card.appendChild(imageEl);
        card.appendChild(nameEl);
        
        return card;
    };


    /**
     * Cria a seção de categoria e retorna o container de apps.
     */
    const createCategorySection = (categoryKey, categoryDisplayName, appendToContainer = true) => {
        // Se a categoria já existe, retorna seu container de apps
        if (categoryMap[categoryKey]) {
            return categoryMap[categoryKey];
        }

        const categorySection = document.createElement('div');
        categorySection.className = "category-section";
        categorySection.id = categoryKey; 

        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = categoryDisplayName; 
        categoryTitle.className = "category-title";

        const categoryContainer = document.createElement('div');
        categoryContainer.className = "category-container";

        categorySection.appendChild(categoryTitle);
        categorySection.appendChild(categoryContainer);
        
        if (appendToContainer) {
              categoriesContainer.appendChild(categorySection);
        }
        
        categoryMap[categoryKey] = categoryContainer;
        createShortcutButton(categoryKey, categoryDisplayName, categorySection);
        
        return categoryContainer;
    };
    
    /**
     * Limpa o display e recarrega os apps do array appData (usado após exclusão).
     */
    function reloadAppDisplay() {
        // Limpa o DOM e o mapa
        categoriesContainer.innerHTML = '';
        categoryShortcuts.innerHTML = '';
        
        // Limpa o mapa da categoria
        for (const key in categoryMap) {
            delete categoryMap[key];
        }
        
        // Recarrega do zero
        loadSavedApps(); 
    }

    // --- 1. LÓGICA DE CARREGAMENTO INICIAL DO LOCAL STORAGE ---
    function loadSavedApps() {
        appData.forEach((app, index) => {
            const categoryKey = app.categoryKey;
            const categoryDisplayName = app.categoryDisplayName;
            
            // Cria ou recupera o container da categoria
            const categoryContainer = createCategorySection(categoryKey, categoryDisplayName);
            
            // Cria e anexa o card do aplicativo, passando o índice atual
            const card = createAppCard(app, index);
            categoryContainer.appendChild(card);
        });
    }
    
    loadSavedApps(); // Chama a função para carregar os dados salvos
    
    
    // --- 2. LÓGICA DE ENVIO DO FORMULÁRIO ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 2.1 Coleta e Validação de Dados
        const name = document.getElementById('appName').value.trim();
        const imgFile = document.getElementById('appImg').files[0];
        const link = document.getElementById('appLink').value.trim();
        const categoryInput = document.getElementById('appCategory').value.trim();

        if(!name || !imgFile || !link || !categoryInput){
            alert("Preencha todos os campos!");
            return;
        }

        const categoryKey = categoryInput.toLowerCase().replace(/\s+/g, '-'); 
        const categoryDisplayName = capitalize(categoryInput);

        // 2.2 Processamento da Imagem
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgSrc = event.target.result;

            // 2.3 Objeto de Dados do Novo App
            const newApp = {
                name: name,
                imgSrc: imgSrc,
                link: link,
                categoryKey: categoryKey,
                categoryDisplayName: categoryDisplayName
            };

            // 2.4 Adiciona o novo app ao array de dados e salva
            appData.push(newApp);
            saveAppsToLocalStorage();
            
            // 2.5 Cria ou obtém o Container da Categoria
            const categoryContainer = createCategorySection(categoryKey, categoryDisplayName);

            // 2.6 Cria e Adiciona o Card (usando o último índice do array)
            const newIndex = appData.length - 1;
            const card = createAppCard(newApp, newIndex);
            categoryContainer.appendChild(card);
            
            // 2.7 Limpeza do Formulário
            form.reset();
            document.getElementById('appImg').value = '';
            document.getElementById('appName').focus();
        };

        reader.readAsDataURL(imgFile);
    });
});
