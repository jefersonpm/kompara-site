// /api/search.js - Versão Final Unificada (Boas Práticas + Autenticação Correta)

import fetch from 'node-fetch';
import crypto from 'crypto';

const SHOPEE_GRAPHQL_ENDPOINT = 'https://open-api.affiliate.shopee.com.br/graphql';

export default async function handler(req, res ) {
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    const APP_ID = process.env.SHOPEE_APP_ID || process.env.ID_do_aplicativo_da_SHOPEE;
    const API_KEY = process.env.SHOPEE_API_KEY || process.env.CHAVE_API_SHOPEE;

    if (!APP_ID || !API_KEY) {
        console.error('ERRO CRÍTICO: Credenciais da Shopee não encontradas.');
        return res.status(500).json({ error: 'Erro de configuração no servidor.' });
    }

    // Query GraphQL usando 'variables' para segurança (sugestão do GPT)
    const graphqlQuery = {
        query: `
            query getProductOffers($keyword: String!) {
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
    const payload = JSON.stringify(graphqlQuery);
    const baseString = `${APP_ID}${timestamp}${payload}${API_KEY}`;
    const signature = crypto.createHmac('sha256', API_KEY).update(baseString).digest('hex');
    const authorizationHeader = `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`;

    try {
        const shopeeResponse = await fetch(SHOPEE_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationHeader,
            },
            body: payload,
        });

        // Checagem de status da resposta (sugestão do GPT)
        if (!shopeeResponse.ok) {
            console.error(`Erro de rede da Shopee. Status: ${shopeeResponse.status}`);
            throw new Error(`A Shopee retornou um status de erro: ${shopeeResponse.status}`);
        }

        const data = await shopeeResponse.json();

        if (data.errors) {
            console.error('Erro retornado pela API GraphQL da Shopee:', data.errors);
            throw new Error('A API da Shopee retornou um erro após a autenticação.');
        }

        res.status(200).json(data.data.productOfferV2.nodes || []);

    } catch (error) {
        console.error('Erro geral na função /api/search:', error.message);
        res.status(500).json({ error: 'Falha ao se comunicar com a Shopee.' });
    }
}
