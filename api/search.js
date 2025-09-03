import fetch from 'node-fetch';
import crypto from 'crypto';

const SHOPEE_GRAPHQL_ENDPOINT = 'https://open-api.affiliate.shopee.com.br/graphql';

export default async function handler(req, res ) {
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    const APP_ID = process.env.SHOPEE_APP_ID;
    const API_KEY = process.env.SHOPEE_API_KEY; // Este é o seu "Secret Key"

    if (!APP_ID || !API_KEY) {
        console.error('ERRO CRÍTICO: Credenciais da Shopee não encontradas.');
        return res.status(500).json({ error: 'Erro de configuração no servidor.' });
    }

    // 1. Defina a query e as variáveis GraphQL
    const query = `
        query getProductOffers($keyword: String!, $limit: Int) {
            productOfferV2(params: {keyword: $keyword, limit: $limit}) {
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
    `;

    const variables = {
        keyword: searchTerm,
        limit: 20
    };

    // 2. Crie o objeto do payload e converta-o para string UMA VEZ
    const payloadObject = {
        query: query,
        variables: variables
    };
    const payloadString = JSON.stringify(payloadObject);

    // 3. Calcule a assinatura usando a string do payload
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${APP_ID}${timestamp}${payloadString}${API_KEY}`;
    
    // A documentação da Shopee usa HMAC-SHA256, não apenas SHA256. Seu código já está correto aqui.
    const signature = crypto.createHmac('sha256', API_KEY).update(baseString).digest('hex');

    // 4. Monte o cabeçalho de autorização
    const authorizationHeader = `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`;

    try {
        const shopeeResponse = await fetch(SHOPEE_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationHeader,
            },
            // 5. Envie a MESMA string do payload no corpo da requisição
            body: payloadString,
        });

        const responseText = await shopeeResponse.text(); // Leia como texto primeiro para depuração
        const data = JSON.parse(responseText);

        if (!shopeeResponse.ok) {
            console.error('Resposta de erro da Shopee (texto):', responseText);
            throw new Error(`A Shopee retornou um status de erro: ${shopeeResponse.status}`);
        }

        if (data.errors) {
            console.error('Erro retornado pela API GraphQL da Shopee:', JSON.stringify(data.errors, null, 2));
            throw new Error('A API da Shopee retornou um erro na query GraphQL.');
        }

        // Verifique se a estrutura de dados esperada existe
        if (data.data && data.data.productOfferV2 && data.data.productOfferV2.nodes) {
            res.status(200).json(data.data.productOfferV2.nodes);
        } else {
            // Se não houver 'nodes', retorne um array vazio para consistência
            res.status(200).json([]);
        }

    } catch (error) {
        console.error('Erro geral na função /api/search:', error.message);
        res.status(500).json({ error: 'Falha ao se comunicar com a Shopee.' });
    }
}
