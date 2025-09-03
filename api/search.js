// Este é o arquivo /api/search.js - Nossa Função Serverless

const fetch = require('node-fetch'); // Para fazer a chamada à API
const crypto = require('crypto'); // Para a assinatura de segurança da Shopee

export default async function handler(req, res) {
    // 1. Pega o termo de busca que o usuário digitou
    const { searchTerm } = req.query;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    // 2. Pega as credenciais seguras que configuramos na Vercel
    const APP_ID = process.env.SHOPEE_APP_ID;
    const API_KEY = process.env.SHOPEE_API_KEY;
    const timestamp = Math.floor(Date.now() / 1000);
    const host = "https://open-api.affiliate.shopee.com.br";
    const path = "/api/v3/product/search";

    // 3. Cria a "assinatura" de segurança exigida pela Shopee
    const baseString = `${APP_ID}${path}${timestamp}`;
    const sign = crypto.createHmac('sha256', API_KEY ).update(baseString).digest('hex');

    // 4. Monta a URL final para a busca na API da Shopee
    const url = new URL(host + path);
    url.searchParams.append('keywords', searchTerm);
    url.searchParams.append('timestamp', timestamp);
    url.searchParams.append('sign', sign);
    url.searchParams.append('page_size', 20); // Busca 20 itens por vez

    try {
        // 5. Executa a chamada à API da Shopee
        const shopeeResponse = await fetch(url.toString());
        const data = await shopeeResponse.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // 6. Envia os resultados de volta para o nosso site
        res.status(200).json(data.data.product_offer_list);

    } catch (error) {
        console.error('Erro na API da Shopee:', error);
        res.status(500).json({ error: 'Falha ao buscar produtos na Shopee.' });
    }
}

