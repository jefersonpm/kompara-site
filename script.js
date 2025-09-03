document.addEventListener('DOMContentLoaded', () => {
    const campoProduto = document.getElementById('campo-produto');
    const botaoComparar = document.getElementById('botao-comparar');
    const areaResultados = document.getElementById('area-resultados');
    const gridResultados = document.getElementById('grid-resultados');
    const rodape = document.getElementById('rodape');
    const botaoConvidar = document.getElementById('botao-convidar');

    // Função para lidar com a busca (clique no botão ou Enter)
    const iniciarBusca = () => {
        const termoBusca = campoProduto.value.trim();
        if (termoBusca === "") {
            alert("Por favor, digite o nome de um produto.");
            return;
        }

        // Simulação de busca
        botaoComparar.textContent = 'BUSCANDO OFERTAS...';
        botaoComparar.disabled = true;

        setTimeout(() => {
            exibirResultadosSimulados();
            botaoComparar.textContent = 'COMPARAR PREÇOS';
            botaoComparar.disabled = false;
        }, 2000); // Simula um delay de 2 segundos da API
    };

    // Adiciona o evento de clique ao botão de comparar
    botaoComparar.addEventListener('click', iniciarBusca);

    // Adiciona o evento de "Enter" no campo de busca
    campoProduto.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            iniciarBusca();
        }
    });

    // Função para exibir resultados simulados
    const exibirResultadosSimulados = () => {
        const produtos = [
            { nome: 'Fone de Ouvido Bluetooth com Cancelamento de Ruído', preco: 129.90, imagem: 'img/produto1.jpg', link: '#' },
            { nome: 'Smartwatch com Monitor Cardíaco e GPS Integrado', preco: 249.50, imagem: 'img/produto2.jpg', link: '#' },
            { nome: 'Teclado Mecânico Gamer RGB com Switch Blue', preco: 189.99, imagem: 'img/produto3.jpg', link: '#' },
            { nome: 'Câmera de Segurança Wi-Fi Full HD com Visão Noturna', preco: 99.80, imagem: 'img/produto4.jpg', link: '#' },
            { nome: 'Mouse Gamer sem Fio com 16000 DPI e 8 Botões', preco: 155.00, imagem: 'img/produto5.jpg', link: '#' },
            { nome: 'Luminária de Mesa LED Articulável com Carregador USB', preco: 79.90, imagem: 'img/produto6.jpg', link: '#' }
        ];

        // Ordena os produtos pelo menor preço
        produtos.sort((a, b) => a.preco - b.preco);

        gridResultados.innerHTML = ''; // Limpa resultados anteriores

        produtos.forEach(produto => {
            const card = `
                <div class="card-produto">
                    <img src="${produto.imagem}" alt="${produto.nome}" class="card-imagem">
                    <div class="card-corpo">
                        <h3 class="card-nome">${produto.nome}</h3>
                        <p class="card-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                        <a href="${produto.link}" class="card-botao" target="_blank">Ver Oferta na Shopee</a>
                    </div>
                </div>
            `;
            gridResultados.innerHTML += card;
        });

        areaResultados.style.display = 'block';
        rodape.style.display = 'block'; // Garante que o rodapé apareça com os resultados
        areaResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // FUNCIONALIDADE CIRÚRGICA DO BOTÃO DE CONVITE
    // Verifica se o navegador suporta a Web Share API
    if (navigator.share) {
        botaoConvidar.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: 'Convite para o Kompara',
                    text: 'Estou te convidando para usar o Kompara, a ferramenta que eu uso para encontrar os menores preços na Shopee. Vale muito a pena!',
                    url: window.location.href
                });
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
            }
        });
    } else {
        // Esconde o botão se a funcionalidade não for suportada pelo navegador
        botaoConvidar.style.display = 'none';
    }
});
