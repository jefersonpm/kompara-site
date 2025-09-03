// /api/search.js - Versão Final, Definitiva e Revisada

const fetch = require('node-fetch');
const crypto = require('crypto');

// O endpoint único e correto da API GraphQL da Shopee Afiliados Brasil
const SHOPEE_GRAPHQL_ENDPOINT = 'https://open-api.affiliate.shopee.com.br/graphql';

// --- Handler Principal da Função Serverless ---
export default async function handler(req, res ) {
    // 1. Pega o termo de busca que o usuário digitou na URL
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    // 2. Pega as credenciais das variáveis de ambiente da Vercel
    //    Este código já tem o "fallback" para funcionar com nomes em inglês ou português.
    const APP_ID = process.env.SHOPEE_APP_ID || process.env.ID_do_aplicativo_da_SHOPEE;
    const API_KEY = process.env.SHOPEE_API_KEY || process.env.CHAVE_API_SHOPEE;

    if (!APP_ID || !API_KEY) {
        console.error('ERRO CRÍTICO: Credenciais da Shopee não foram encontradas nas variáveis de ambiente.');
        return res.status(500).json({ error: 'Erro de configuração no servidor.' });
    }

    // 3. Prepara a query GraphQL com a sintaxe padrão e mais segura
    const graphqlQuery = {
        query: `
            query($keyword: String!) {
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

    // 4. Prepara os componentes para a assinatura
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(graphqlQuery); // O corpo da requisição em formato de texto

    // 5. Calcula a Assinatura (Signature) conforme a documentação oficial
    const baseString = `${APP_ID}${timestamp}${payload}${API_KEY}`;
    const signature = crypto.createHmac('sha256', API_KEY).update(baseString).digest('hex');

    // 6. Monta o Header de Autorização no formato exato exigido pela Shopee
    const authorizationHeader = `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`;

    try {
        // 7. Faz a chamada final para a API da Shopee
        const shopeeResponse = await fetch(SHOPEE_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationHeader,
            },
            body: payload,
        });

        const data = await shopeeResponse.json();

        // 8. Verifica se a própria Shopee retornou algum erro na resposta
        if (data.errors) {
            console.error('Erro retornado pela API GraphQL da Shopee:', data.errors);
            throw new Error('A API da Shopee retornou um erro após a autenticação.');
        }

        // 9. SUCESSO! Envia a lista de produtos de volta para o seu site
        res.status(200).json(data.data.productOfferV2.nodes || []);

    } catch (error) {
        console.error('Erro geral na função /api/search:', error.message);
        res.status(500).json({ error: 'Falha ao se comunicar com a Shopee.' });
    }
}
