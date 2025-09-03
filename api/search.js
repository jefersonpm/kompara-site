// /api/search.js - Versão final e correta usando GraphQL

const fetch = require('node-fetch');

// O endpoint único da API GraphQL da Shopee Afiliados Brasil
const SHOPEE_GRAPHQL_ENDPOINT = 'https://open-api.affiliate.shopee.com.br/graphql';

// --- Handler Principal ---
export default async function handler(req, res ) {
    // 1. Pega o termo de busca da URL (ex: /api/search?searchTerm=fralda)
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    // 2. Pega as credenciais das variáveis de ambiente da Vercel
    // Usando o fallback para garantir que funcione com qualquer nome que a Vercel use.
    const APP_ID = process.env.SHOPEE_APP_ID || process.env.ID_do_aplicativo_da_SHOPEE;
    const API_KEY = process.env.SHOPEE_API_KEY || process.env.CHAVE_API_SHOPEE;

    if (!APP_ID || !API_KEY) {
        console.error('ERRO: Credenciais da Shopee não encontradas nas variáveis de ambiente.');
        return res.status(500).json({ error: 'Erro de configuração no servidor.' });
    }

    // 3. Monta a "pergunta" (query) em formato GraphQL
    // Esta query busca por produtos usando a palavra-chave e pede vários campos úteis.
    const graphqlQuery = {
        query: `
            query getProductOffers($keyword: String) {
                productOfferV2(params: {keyword: $keyword, limit: 20}) {
                    nodes {
                        productName
                        description
                        originPrice
                        salePrice
                        imageUrl
                        commissionRate
                        commission
                        marketingLink
                    }
                }
            }
        `,
        variables: {
            keyword: searchTerm
        }
    };

    try {
        // 4. Faz a chamada para a API da Shopee
        const shopeeResponse = await fetch(SHOPEE_GRAPHQL_ENDPOINT, {
            method: 'POST',
            // 5. Adiciona os cabeçalhos (headers) com as credenciais
            headers: {
                'Content-Type': 'application/json',
                'AppId': APP_ID,
                'ApiKey': API_KEY,
            },
            // 6. Envia a query GraphQL no corpo da requisição
            body: JSON.stringify(graphqlQuery),
        });

        const data = await shopeeResponse.json();

        // 7. Verifica se a resposta da Shopee contém erros
        if (data.errors) {
            console.error('Erro retornado pela API GraphQL da Shopee:', data.errors);
            throw new Error('A API da Shopee retornou um erro.');
        }

        // 8. Envia a lista de produtos de volta para o seu site
        res.status(200).json(data.data.productOfferV2.nodes);

    } catch (error) {
        console.error('Erro geral na função /api/search:', error.message);
        res.status(500).json({ error: 'Falha ao se comunicar com a Shopee.' });
    }
}
