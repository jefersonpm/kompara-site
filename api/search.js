// /api/search.js - Versão Final e Definitiva (GraphQL com Autenticação por Signature)

const fetch = require('node-fetch');
const crypto = require('crypto');

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

    // 3. Prepara a query GraphQL e o timestamp
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

    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(graphqlQuery); // O corpo da requisição como texto

    // 4. Calcula a Signature (Assinatura) conforme a documentação
    const baseString = `${APP_ID}${timestamp}${payload}${API_KEY}`;
    const signature = crypto.createHmac('sha256', API_KEY).update(baseString).digest('hex');

    // 5. Monta o Header de Autorização no formato exato exigido
    const authorizationHeader = `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`;

    try {
        // 6. Faz a chamada para a API
        const shopeeResponse = await fetch(SHOPEE_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationHeader, // <-- Usa o header de autorização calculado
            },
            body: payload,
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
