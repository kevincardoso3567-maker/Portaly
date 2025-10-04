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

    // --- FUNÇÕES AUXILIARES DE COR (Correção do Escurecimento) ---

    /**
     * Converte HEX para HSL, ajusta o brilho (Lightness), e retorna o HEX.
     * Esta função garante que a tonalidade (Hue) seja mantida, corrigindo o erro do rosa/vermelho.
     * @param {string} hex - Cor em formato Hex (#RRGGBB).
     * @param {number} lightnessAdjustment - Valor percentual para diminuir (escurecer) ou aumentar (clarear) o L. Ex: -50 para escurecer 50%.
     * @returns {string} Cor em formato Hex ajustado.
     */
    function adjustLightness(hex, lightnessAdjustment) {
        // 1. Converte HEX para RGB
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

        // 2. Converte RGB para HSL
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
        l = Math.max(0, Math.min(1, l + (lightnessAdjustment / 100)));

        // 4. Converte HSL de volta para RGB (auxiliar)
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

        // 5. Converte RGB para HEX final
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

    function changeThemeColor(newPrimaryColor, button) {
        
        // 1. Define a COR PRIMÁRIA
        root.style.setProperty('--primary-color', newPrimaryColor);
        
        // 2. Define a COR DE FUNDO DO CABEÇALHO/RODAPÉ (AGORA MANTÉM A TONALIDADE, MAS ESCURA)
        // Escurece o tema primário em 60% para que fique sempre em um tom escuro do rosa, azul, etc.
        const headerBgColor = adjustLightness(newPrimaryColor, -0.6); 
        root.style.setProperty('--header-footer-bg', headerBgColor);
        
        // 3. Define a COR DE FUNDO PRINCIPAL DO SITE (fundo claro fixo)
        root.style.setProperty('--site-background', '#f8f9fa');

        // 4. Remove o estado 'active' do botão anterior
        if (activeColorButton) {
            activeColorButton.classList.remove('active');
        }

        // 5. Define o novo botão como ativo
        if (button) {
            button.classList.add('active');
            activeColorButton = button;
        }
    }

    // Função para renderizar os botões da paleta
    function renderThemePalette() {
        primaryColors.forEach((color, index) => {
            const button = document.createElement('button');
            button.className = 'color-swatch-button';
            button.style.backgroundColor = color;
            button.setAttribute('data-color', color);
            
            button.addEventListener('click', () => {
                changeThemeColor(color, button);
            });

            themePalette.appendChild(button);

            // Define a cor padrão (primeira da lista) como ativa na inicialização
            if (index === 0) {
                changeThemeColor(color, button);
            }
        });
    }

    renderThemePalette(); 
    
    // -------------------------------------------------------------
    
    // Funções e Lógica de Formulário (Mantidas inalteradas)
    
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

            // 2.3 Cria a Categoria (Se Necessário)
            if (!categoryMap[categoryKey]) {
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
                categoriesContainer.appendChild(categorySection);
                
                categoryMap[categoryKey] = categoryContainer;
                
                // CRIA O NOVO BOTÃO DE ATALHO
                createShortcutButton(categoryKey, categoryDisplayName, categorySection);
            }

            // 2.4 Cria o Card
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
            categoryMap[categoryKey].appendChild(card);
            
            // 2.5 Limpeza do Formulário
            
            form.reset();
            document.getElementById('appImg').value = '';
            document.getElementById('appName').focus();
        };

        reader.readAsDataURL(imgFile);
    });
});