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
    
    // --- FUNÇÕES AUXILIARES DE COR (Correção do Escurecimento) ---

    /**
     * Converte HEX para HSL, ajusta o brilho (Lightness), e retorna o HEX.
     * Esta função garante que a tonalidade (Hue) seja mantida.
     * @param {string} hex - Cor em formato Hex (#RRGGBB).
     * @param {number} lightnessAdjustment - Valor decimal para diminuir ou aumentar o L. Ex: -0.6 para escurecer 60%.
     * @returns {string} Cor em formato Hex ajustado.
     */
    function adjustLightness(hex, lightnessAdjustment) {
        // 1. Converte HEX para RGB (código mantido)
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

        // 2. Converte RGB para HSL (código mantido)
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // Acinzentado
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

        // 3. Aplica o ajuste de brilho (Luminosidade)
        // O ajuste é feito diretamente no valor L (0 a 1)
        l = Math.max(0, Math.min(1, l + lightnessAdjustment));

        // 4. Converte HSL de volta para RGB (auxiliar - código mantido)
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

        // 5. Converte RGB para HEX final (código mantido)
        const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
    
    // As 12 cores principais (Hex)
    const primaryColors = [
        '#007bff', // Azul (Padrão)
        '#28a745', // Verde
        '#dc3545', // Vermelho
        '#ffc107', // Amarelo/Ouro
        '#6f42c1', // Roxo
        '#17a2b8', // Ciano
        '#fd7e14', // Laranja
        '#e83e8c', // Rosa Choque
        '#6c757d', // Cinza Escuro
        '#00bcd4', // Turquesa
        '#3f51b5', // Azul Índigo
        '#795548', // Marrom
    ];

    let activeColorButton = null;

    /**
     * Aplica a nova cor ao tema e SALVA NO LOCAL STORAGE.
     * Ajustado lightnessAdjustment de -0.6 (float) para refletir a nova função.
     */
    function changeThemeColor(newPrimaryColor, button) {
        
        // 1. Define a COR PRIMÁRIA
        root.style.setProperty('--primary-color', newPrimaryColor);
        
        // 2. Define a COR DE FUNDO DO CABEÇALHO/RODAPÉ 
        const headerBgColor = adjustLightness(newPrimaryColor, -0.6); // Escurece em 60%
        root.style.setProperty('--header-footer-bg', headerBgColor);
        
        // 3. Define a COR DE FUNDO PRINCIPAL DO SITE (fundo claro fixo)
        root.style.setProperty('--site-background', '#f8f9fa');

        // 4. Salva a cor no Local Storage
        localStorage.setItem('themeColor', newPrimaryColor); // 👈 ARMAZENAMENTO

        // 5. Remove o estado 'active' do botão anterior
        if (activeColorButton) {
            activeColorButton.classList.remove('active');
        }

        // 6. Define o novo botão como ativo
        if (button) {
            button.classList.add('active');
            activeColorButton = button;
        }
    }

    // Função para renderizar os botões da paleta
    function renderThemePalette() {
        // Carrega a cor salva ou usa a primeira como padrão
        const savedColor = localStorage.getItem('themeColor') || primaryColors[0]; // 👈 CARREGAMENTO
        let defaultButton = null;

        primaryColors.forEach((color, index) => {
            const button = document.createElement('button');
            button.className = 'color-swatch-button';
            button.style.backgroundColor = color;
            button.setAttribute('data-color', color);
            
            button.addEventListener('click', () => {
                changeThemeColor(color, button);
            });

            themePalette.appendChild(button);

            // Marca o botão correspondente à cor salva/padrão
            if (color === savedColor) {
                defaultButton = button;
            }
        });
        
        // Aplica a cor do tema salva ou a primeira
        changeThemeColor(savedColor, defaultButton);
    }

    renderThemePalette(); 
    
    // -------------------------------------------------------------
    
    // Funções de Formulário (Mantidas inalteradas)
    
    const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    /**
     * Cria e retorna o elemento HTML do card (App).
     */
    const createAppCard = (name, imgSrc, link) => {
        const card = document.createElement('div');
        card.className = "app-card";
        card.onclick = () => window.open(link, '_blank');
        
        const imageEl = document.createElement('img');
        imageEl.src = imgSrc;
        imageEl.alt = name;
        imageEl.className = "app-icon";

        const nameEl = document.createElement('h3');
        nameEl.textContent = name;
        nameEl.className = "app-name";

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


    // --- 1. LÓGICA DE CARREGAMENTO INICIAL DO LOCAL STORAGE ---
    function loadSavedApps() {
        appData.forEach(app => {
            const categoryKey = app.categoryKey;
            const categoryDisplayName = app.categoryDisplayName;
            
            // Cria ou recupera o container da categoria
            const categoryContainer = createCategorySection(categoryKey, categoryDisplayName);
            
            // Cria e anexa o card do aplicativo
            const card = createAppCard(app.name, app.imgSrc, app.link);
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

            // 2.3 Cria ou obtém o Container da Categoria
            const categoryContainer = createCategorySection(categoryKey, categoryDisplayName);

            // 2.4 Cria e Adiciona o Card
            const card = createAppCard(name, imgSrc, link);
            categoryContainer.appendChild(card);
            
            // 2.5 ARMAZENAMENTO: Salva o novo aplicativo na lista de dados
            const newApp = {
                name: name,
                imgSrc: imgSrc, // A imagem em Data URL pode ser grande, mas é a maneira de salvar no Local Storage
                link: link,
                categoryKey: categoryKey,
                categoryDisplayName: categoryDisplayName
            };
            appData.push(newApp);
            localStorage.setItem('appData', JSON.stringify(appData)); // 👈 ARMAZENAMENTO NO LOCAL STORAGE
            
            // 2.6 Limpeza do Formulário
            form.reset();
            document.getElementById('appImg').value = '';
            document.getElementById('appName').focus();
        };

        reader.readAsDataURL(imgFile);
    });
});
