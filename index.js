document.addEventListener('DOMContentLoaded', () => {
    // --- 0. REFERÊNCIAS DE ELEMENTOS ---
    const form = document.getElementById('appForm');
    const categoriesGrid = document.getElementById('categoriesContainer'); 
    const sidebarNavList = document.getElementById('sidebar-nav-list'); 
    
    const formContainer = document.getElementById('formContainerContent'); 
    const openBtn = document.getElementById('openFormModal');

    if (!form || !categoriesGrid || !sidebarNavList || !formContainer || !openBtn) {
        console.error("Erro: Um ou mais elementos HTML essenciais não foram encontrados. Verifique IDs.");
        return; 
    }

    // --- 1. PERSISTÊNCIA E CORES ---
    let appData = JSON.parse(localStorage.getItem('appData')) || [];
    let categoryColors = JSON.parse(localStorage.getItem('categoryColors')) || {}; 
    
    // Índice da última cor usada (para garantir sequencialidade e não repetição)
    let lastColorIndex = parseInt(localStorage.getItem('lastColorIndex')) || 0; 
    
    // Lista completa de 64 cores em formato HEX
    const defaultColors = [
        '#FF0000', '#0000FF', '#FFFF00', '#008000', '#FFA500', '#800080', 
        '#FFC0CB', '#A52A2A', '#000000', '#FFFFFF', '#808080', '#F5F5DC', 
        '#FFD700', '#C0C0C0', '#800020', '#FA8072', '#FF7F50', '#C8A2C8', 
        '#E6E6FA', '#FF00FF', '#FF00FF', '#EE82EE', '#4B0082', '#ADD8E6', 
        '#000080', '#40E0D0', '#00FFFF', '#32CD32', '#808000', '#50C878', 
        '#8A9A5B', '#7FFFD4', '#FFFF99', '#FFDB58', '#E6D68F', '#FBCEB1', 
        '#FFE5B4', '#FFBF00', '#CC7722', '#E2725B', '#B87333', '#CD7F32', 
        '#C3B091', '#F5DEB3', '#FFFDD0', '#FFFFF0', '#C2B280', '#D2691E', 
        '#6F4E37', '#954535', '#36454F', '#D3D3D3', '#696969', '#F0F8FF', 
        '#722F37', '#E1C699', '#4169E1', '#008080', '#98FF98', '#FC0FC0', 
        '#F4C2C2', '#BDA5C2', '#7A7A3A', '#FAF9F6' 
    ];

    // --- FUNÇÕES AUXILIARES ---
    const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    /**
     * Pega a próxima cor da lista sequencialmente.
     */
    const getNextColor = () => {
        const color = defaultColors[lastColorIndex];
        lastColorIndex = (lastColorIndex + 1) % defaultColors.length; 
        localStorage.setItem('lastColorIndex', lastColorIndex.toString());
        return color;
    };
    
    /**
     * Verifica se a cor de fundo é clara e ajusta a cor do texto para contraste.
     */
    const getTextColorForBackground = (hex) => {
        const color = hex.substring(1); 
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255; 

        return luma > 0.5 ? '#000000' : '#FFFFFF';
    };
    
    const saveColorsToLocalStorage = () => {
        localStorage.setItem('categoryColors', JSON.stringify(categoryColors));
    };

    const saveAppsToLocalStorage = () => {
        localStorage.setItem('appData', JSON.stringify(appData));
    };
    
    // --- LÓGICA DE EXIBIÇÃO DO FORMULÁRIO ---
    openBtn.addEventListener('click', () => { 
        formContainer.classList.toggle('form-hidden');
        
        if (formContainer.classList.contains('form-hidden')) {
            openBtn.textContent = 'Adicionar novo link';
        } else {
            openBtn.textContent = 'Fechar formulário';
        }
        
        if (!formContainer.classList.contains('form-hidden')) {
             formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // --- LÓGICA DE EXCLUSÃO DE CATEGORIA (AJUSTADA) ---
    const handleDeleteCategory = (categoryKey, categoryDisplayName) => {
        
        const confirmation = confirm(`Tem certeza que deseja remover a categoria "${categoryDisplayName}" e todos os links associados a ela?`);

        if (confirmation) {
            // Remove todos os apps que pertencem a essa categoria
            appData = appData.filter(app => app.categoryKey !== categoryKey);
            
            // Remove a cor da categoria do armazenamento (opcional)
            delete categoryColors[categoryKey];
            
            saveAppsToLocalStorage();
            saveColorsToLocalStorage(); 
            reloadAppDisplay();
        }
    };

    // --- LÓGICA DA BARRA LATERAL (SIDEBAR) ---
    const createSidebarLink = (categoryKey, categoryDisplayName) => {
        const listItem = document.createElement('li');
        listItem.className = "sidebar-nav-item";
        
        const link = document.createElement('a');
        link.textContent = categoryDisplayName;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetCard = document.getElementById(`card-${categoryKey}`); 
            
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        listItem.appendChild(link);
        sidebarNavList.appendChild(listItem);
    };

    // --- FUNÇÕES DE CARDS E CATEGORIA ---

    const handleDeleteApp = (event, appIndex) => {
        event.stopPropagation();
        
        if (!confirm('Tem certeza que deseja remover este item?')) {
            return;
        }

        const itemToRemove = appData[appIndex];
        if (itemToRemove) {
             appData = appData.filter((_, i) => i !== appIndex);
             saveAppsToLocalStorage();
             reloadAppDisplay();
        }
    };

    const createAppCardItem = (app, index, categoryColor) => {
        const card = document.createElement('div');
        card.className = "app-card-item";
        card.onclick = () => window.open(app.link, '_blank');
        
        card.style.setProperty('--category-link-color', categoryColor); 
        
        const imageEl = document.createElement('img');
        imageEl.src = app.imgSrc;
        imageEl.alt = app.name;
        imageEl.className = "app-icon";

        const nameEl = document.createElement('span');
        nameEl.textContent = app.name;
        nameEl.className = "app-name";

        const deleteButton = document.createElement('button');
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = " &times; "; 
        
        deleteButton.addEventListener('click', (e) => handleDeleteApp(e, index));

        card.appendChild(imageEl);
        card.appendChild(nameEl);
        card.appendChild(deleteButton); 
        
        return card;
    };
    
    // FUNÇÃO PRINCIPAL: Cria o CARTÃO DE CATEGORIA com botão de exclusão
    const createCategoryCard = (categoryKey, categoryDisplayName, categoryColor, apps) => {
        const card = document.createElement('div');
        card.className = "category-card";
        card.id = `card-${categoryKey}`; 
        
        card.style.borderColor = categoryColor; 
        
        // Contêiner para o título e o botão
        const titleContainer = document.createElement('div');
        titleContainer.className = "category-title-container";
        titleContainer.style.backgroundColor = categoryColor;
        
        const title = document.createElement('h2');
        title.textContent = categoryDisplayName; 
        title.className = "category-title-card";
        title.style.color = getTextColorForBackground(categoryColor); 

        // Botão de exclusão do cartão (categoria)
        const deleteCategoryBtn = document.createElement('button');
        deleteCategoryBtn.className = "delete-category-button";
        deleteCategoryBtn.innerHTML = "&times;"; 
        
        deleteCategoryBtn.addEventListener('click', () => {
             handleDeleteCategory(categoryKey, categoryDisplayName);
        });

        titleContainer.appendChild(title);
        titleContainer.appendChild(deleteCategoryBtn);

        const linksContainer = document.createElement('div');
        linksContainer.className = "category-links-container";
        
        apps.forEach(app => {
            const originalIndex = appData.findIndex(item => 
                item.name === app.name && 
                item.link === app.link
            );
            linksContainer.appendChild(createAppCardItem(app, originalIndex, categoryColor));
        });
        
        card.appendChild(titleContainer);
        card.appendChild(linksContainer);
        
        categoriesGrid.appendChild(card);
    };

    function groupAndLoadApps() {
        categoriesGrid.innerHTML = '';
        sidebarNavList.innerHTML = ''; 
        
        const groupedApps = appData.reduce((acc, app) => {
            const key = app.categoryKey;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(app);
            return acc;
        }, {});
        
        Object.keys(groupedApps).forEach(categoryKey => {
            const apps = groupedApps[categoryKey];
            if (apps.length > 0) {
                const appSample = apps[0];
                let color = appSample.categoryColor;

                // Garante que a cor seja sequencialmente definida e persistente
                if (!color || !categoryColors[categoryKey]) {
                    color = categoryColors[categoryKey] || getNextColor(); 
                }
                
                // Persiste a cor no mapeamento e nos dados dos apps, se necessário
                if (!categoryColors[categoryKey] || appSample.categoryColor !== color) {
                    categoryColors[categoryKey] = color;
                    apps.forEach(app => app.categoryColor = color); 
                    saveColorsToLocalStorage();
                    saveAppsToLocalStorage(); 
                }

                // 1. Cria o Cartão na Grid
                createCategoryCard(
                    categoryKey, 
                    appSample.categoryDisplayName, 
                    color, 
                    apps
                );
                
                // 2. Cria o Link na Sidebar
                createSidebarLink(categoryKey, appSample.categoryDisplayName);
            }
        });
    }
    
    function reloadAppDisplay() {
        groupAndLoadApps(); 
    }
    
    reloadAppDisplay(); 
    
    
    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();

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

        let finalCategoryColor;
        if (categoryColors[categoryKey]) {
            // Categoria existente: usa a cor salva
            finalCategoryColor = categoryColors[categoryKey];
        } else {
            // Nova categoria: pega a próxima cor sequencialmente
            finalCategoryColor = getNextColor();
            categoryColors[categoryKey] = finalCategoryColor;
            saveColorsToLocalStorage();
        }


        const reader = new FileReader();
        reader.onload = function(event) {
            const imgSrc = event.target.result;

            const newApp = {
                name: name,
                imgSrc: imgSrc,
                link: link,
                categoryKey: categoryKey,
                categoryDisplayName: categoryDisplayName,
                categoryColor: finalCategoryColor 
            };

            appData.push(newApp); 
            saveAppsToLocalStorage();
            
            reloadAppDisplay();
            
            form.reset();
            document.getElementById('appImg').value = '';
            formContainer.classList.add('form-hidden'); 
            openBtn.textContent = 'Adicionar novo link'; 
        };

        reader.readAsDataURL(imgFile);
    });
});
