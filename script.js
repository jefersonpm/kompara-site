document.addEventListener('DOMContentLoaded', function() {
    const campoBusca = document.getElementById('campo-busca');
    const btnComparar = document.getElementById('btn-comparar');
    const areaResultados = document.getElementById('area-resultados');
    const gridResultados = document.getElementById('grid-resultados');
    const rodape = document.querySelector('.rodape');
    const btnConvidar = document.getElementById('btn-convidar');

    // Função para executar a busca
    const executarBusca = () => {
        const termoBusca = campoBusca.value.trim();
        if (termoBusca === '') {
            alert('Por favor, digite o nome de um produto ou cole um link.');
            return;
        }

        btnComparar.textContent = 'BUSCANDO OFERTAS...';
        btnComparar.disabled = true;

        // SIMULAÇÃO DE CHAMADA DE API
        setTimeout(() => {
            // Limpa resultados antigos
            gridResultados.innerHTML = '';

            // Dados simulados (mock)
            const resultadosSimulados = [
                { nome: 'Capa de Silicone para Celular Modelo X Super Resistente e Flexível', preco: 25.90, imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lkwcrw8e4mlg29' },
                { nome: 'Fone de Ouvido Bluetooth 5.0 com Cancelamento de Ruído e Case Carregadora', preco: 89.99, imagem: 'https://down-br.img.susercontent.com/file/sg-11134201-22110-q8i3g4v12gjv8b' },
                { nome: 'Smartwatch Relógio Inteligente Monitor Cardíaco e Oxímetro', preco: 150.00, imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lkvj267a0z62d7' },
                { nome: 'Kit 10 Pincéis de Maquiagem Profissional Sereia com Cerdas Macias', preco: 45.50, imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lkyh2jmqb0o28c' },
                { nome: 'Garrafa Térmica de Inox 500ml para Café, Chá e Água Quente ou Fria', preco: 55.00, imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-ll1ple35d216d7' },
                { nome: 'Luminária de Mesa LED Articulável com 3 Níveis de Intensidade', preco: 78.90, imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lkyh30m5c7d21c' }
            ];

            // Ordena os resultados do mais barato para o mais caro
            resultadosSimulados.sort((a, b ) => a.preco - b.preco);

            // Cria e insere os cards de produto no HTML
            resultadosSimulados.forEach(produto => {
                const card = document.createElement('a');
                card.href = '#'; // Link para a oferta real
                card.className = 'card-produto';
                card.target = '_blank';

                card.innerHTML = `
                    <div class="card-imagem">
                        <img src="${produto.imagem}" alt="${produto.nome}">
                    </div>
                    <div class="card-info">
                        <h3 class="card-nome">${produto.nome}</h3>
                        <p class="card-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                        <div class="card-botao">Ver Oferta na Shopee</div>
                    </div>
                `;
                gridResultados.appendChild(card);
            });

            // Mostra a área de resultados e o rodapé
            areaResultados.style.display = 'block';
            rodape.style.display = 'block';

            // Rola a página suavemente até a área de resultados
            areaResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Restaura o botão
            btnComparar.textContent = 'COMPARAR PREÇOS';
            btnComparar.disabled = false;

        }, 2000); // Atraso de 2 segundos para simular a busca
    };

    // Adiciona o evento de clique no botão
    btnComparar.addEventListener('click', executarBusca);

    // Adiciona o evento de "Enter" no campo de busca
    campoBusca.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            executarBusca();
        }
    });

    // Funcionalidade do botão de convite
    if (navigator.share) {
        btnConvidar.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: 'Kompara - O Comparador de Preços da Shopee',
                    text: 'Encontrei um comparador de preços incrível para a Shopee. Vale muito a pena!',
                    url: window.location.href
                });
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
            }
        });
    } else {
        // Esconde o botão se a funcionalidade não for suportada pelo navegador
        btnConvidar.style.display = 'none';
    }
});
