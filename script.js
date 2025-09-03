document.addEventListener('DOMContentLoaded', function() {
    const campoBusca = document.getElementById('campo-busca');
    const btnComparar = document.getElementById('btn-comparar');
    const areaResultados = document.getElementById('area-resultados');
    const gridResultados = document.getElementById('grid-resultados');
    const rodape = document.querySelector('.rodape');
    const btnConvidar = document.getElementById('btn-convidar');

    const executarBusca = async () => { // A função agora é 'async'
        const termoBusca = campoBusca.value.trim();
        if (termoBusca === '') {
            alert('Por favor, digite o nome de um produto ou cole um link.');
            return;
        }

        btnComparar.textContent = 'BUSCANDO OFERTAS...';
        btnComparar.disabled = true;
        gridResultados.innerHTML = ''; // Limpa resultados antigos

        try {
            // CHAMA A NOSSA FUNÇÃO SERVERLESS
            const response = await fetch(`/api/search?searchTerm=${encodeURIComponent(termoBusca)}`);
            const resultadosReais = await response.json();

            if (!response.ok) {
                throw new Error(resultadosReais.error || 'Erro desconhecido na busca.');
            }

            if (resultadosReais.length === 0) {
                gridResultados.innerHTML = '<p>Nenhum produto encontrado para este termo de busca.</p>';
            } else {
                // Ordena os resultados do mais barato para o mais caro
                resultadosReais.sort((a, b) => a.price_info.price - b.price_info.price);

                resultadosReais.forEach(produto => {
                    const card = document.createElement('a');
                    card.href = produto.product_link; // Link de afiliado real!
                    card.className = 'card-produto';
                    card.target = '_blank';

                    card.innerHTML = `
                        <div class="card-imagem">
                            <img src="${produto.image_url}" alt="${produto.product_name}">
                        </div>
                        <div class="card-info">
                            <h3 class="card-nome">${produto.product_name}</h3>
                            <p class="card-preco">R$ ${produto.price_info.price.toFixed(2).replace('.', ',')}</p>
                            <div class="card-botao">Ver Oferta na Shopee</div>
                        </div>
                    `;
                    gridResultados.appendChild(card);
                });
            }

        } catch (error) {
            console.error('Erro ao executar a busca:', error);
            gridResultados.innerHTML = `<p>Ocorreu um erro ao buscar as ofertas. Tente novamente. (${error.message})</p>`;
        } finally {
            areaResultados.style.display = 'block';
            rodape.style.display = 'block';
            areaResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
            btnComparar.textContent = 'COMPARAR PREÇOS';
            btnComparar.disabled = false;
        }
    };

    btnComparar.addEventListener('click', executarBusca);
    campoBusca.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            executarBusca();
        }
    });

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
        btnConvidar.style.display = 'none';
    }
});
