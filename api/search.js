// Este é o arquivo /api/search.js - Versão Final Corrigida

const fetch = require('node-fetch');
const crypto = require('crypto');

// --- Bloco de Gerenciamento do Access Token ---
let cachedToken = {
    accessToken: null,
    expiresAt: 0,
};

// Função para obter o Access Token (seja do cache ou um novo)
async function getAccessToken(appId, apiKey) {
    const now = Math.floor(Date.now() / 1000);

    // 1. Se tivermos um token válido no cache, use-o.
    if (cachedToken.accessToken && now < cachedToken.expiresAt) {
        console.log('Usando Access Token do cache.');
        return cachedToken.accessToken;
    }

    // 2. Se não, peça um novo token para a Shopee usando o endpoint correto.
    console.log('Gerando novo Access Token da Shopee...');
    const host = "https://open-api.affiliate.shopee.com.br";
    const path = "/api/v3/token/get"; // <-- CORREÇÃO IMPORTANTE: Endpoint correto
    const timestamp = now;
    const baseString = `${appId}${path}${timestamp}`;
    const sign = crypto.createHmac('sha256', apiKey ).update(baseString).digest('hex');

    const authUrl = `${host}${path}?app_id=${appId}&timestamp=${timestamp}&sign=${sign}`;
    console.log('URL de autenticação montada:', authUrl); // Log para depuração

    const response = await fetch(authUrl);
    const data = await response.json();

    if (data.error || !data.data || !data.data.access_token) {
        console.error('Falha ao obter Access Token. Resposta da Shopee:', data);
        throw new Error('Não foi possível autenticar com a API da Shopee.');
    }

    // 3. Armazena o novo token e sua data de expiração no cache.
    console.log('Novo Access Token gerado com sucesso!');
    cachedToken.accessToken = data.data.access_token;
    cachedToken.expiresAt = now + data.data.expire_in - 300; // Renova 5 minutos antes

    return cachedToken.accessToken;
}

// --- Função Principal (Handler) ---
export default async function handler(req, res) {
    const { searchTerm } = req.query;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    try {
        // 2. Pega as credenciais seguras (usando os nomes padrão)
        const APP_ID = process.env.SHOPEE_APP_ID;
        const API_KEY = process.env.SHOPEE_API_KEY;

        if (!APP_ID || !API_KEY) {
            throw new Error('Credenciais SHOPEE_APP_ID ou SHOPEE_API_KEY não configuradas na Vercel.');
        }

        const accessToken = await getAccessToken(APP_ID, API_KEY);

        // 3. Prepara os parâmetros para a busca de produtos
        const host = "https://open-api.affiliate.shopee.com.br";
        const path = "/api/v3/product/search";
        const timestamp = Math.floor(Date.now( ) / 1000);

        // 4. Cria a "assinatura" de segurança
        const baseString = `${APP_ID}${path}${timestamp}${accessToken}`;
        const sign = crypto.createHmac('sha26', API_KEY).update(baseString).digest('hex');

        // 5. Monta a URL final para a busca na API da Shopee
        const url = new URL(host + path);
        url.searchParams.append('app_id', APP_ID);
        url.searchParams.append('access_token', accessToken);
        url.searchParams.append('timestamp', timestamp);
        url.searchParams.append('sign', sign);
        url.searchParams.append('keywords', searchTerm);
        url.searchParams.append('page_size', 20); // <-- CORREÇÃO IMPORTANTE: searchParams

        // 6. Executa a chamada à API da Shopee
        const shopeeResponse = await fetch(url.toString());
        const data = await shopeeResponse.json();

        if (data.error) {
            console.error('Erro retornado pela API da Shopee na busca:', data.error, data.message);
            throw new Error(data.message || data.error);
        }

        // 7. Envia os resultados de volta para o nosso site
        res.status(200).json(data.data.product_offer_list || []);

    } catch (error) {
        console.error('Erro geral na função /api/search:', error.message);
        res.status(500).json({ error: 'Falha ao buscar produtos na Shopee.' });
    }
}
