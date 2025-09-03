// Este é o arquivo /api/search.js - Versão com Fallback Defensivo

const fetch = require('node-fetch');
const crypto = require('crypto');

// --- Bloco de Gerenciamento do Access Token ---
let cachedToken = {
    accessToken: null,
    expiresAt: 0,
};

async function getAccessToken(appId, apiKey) {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken.accessToken && now < cachedToken.expiresAt) {
        console.log('Usando Access Token do cache.');
        return cachedToken.accessToken;
    }
    console.log('Gerando novo Access Token da Shopee...');
    const host = "https://open-api.affiliate.shopee.com.br";
    const path = "/api/v3/token/get";
    const timestamp = now;
    const baseString = `${appId}${path}${timestamp}`;
    const sign = crypto.createHmac('sha256', apiKey ).update(baseString).digest('hex');
    const authUrl = `${host}${path}?app_id=${appId}&timestamp=${timestamp}&sign=${sign}`;
    const response = await fetch(authUrl);
    const data = await response.json();
    if (data.error || !data.data || !data.data.access_token) {
        console.error('Falha ao obter Access Token. Resposta da Shopee:', data);
        throw new Error('Não foi possível autenticar com a API da Shopee.');
    }
    console.log('Novo Access Token gerado com sucesso!');
    cachedToken.accessToken = data.data.access_token;
    cachedToken.expiresAt = now + data.data.expire_in - 300;
    return cachedToken.accessToken;
}

// --- Função Principal (Handler) ---
export default async function handler(req, res) {
    const { searchTerm } = req.query;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    try {
        // --- INÍCIO DA CORREÇÃO IMPORTANTE (FALLBACK) ---
        console.log("Verificando variáveis de ambiente...");
        const APP_ID = process.env.SHOPEE_APP_ID || process.env.ID_do_aplicativo_da_SHOPEE;
        const API_KEY = process.env.SHOPEE_API_KEY || process.env.CHAVE_API_SHOPEE;
        
        if(process.env.SHOPEE_APP_ID) console.log("Encontrada variável SHOPEE_APP_ID.");
        if(process.env.ID_do_aplicativo_da_SHOPEE) console.log("Encontrada variável ID_do_aplicativo_da_SHOPEE.");
        // --- FIM DA CORREÇÃO ---

        if (!APP_ID || !API_KEY) {
            throw new Error('Nenhuma das credenciais da Shopee (nem em inglês, nem em português) foi encontrada na Vercel.');
        }

        const accessToken = await getAccessToken(APP_ID, API_KEY);

        const host = "https://open-api.affiliate.shopee.com.br";
        const path = "/api/v3/product/search";
        const timestamp = Math.floor(Date.now( ) / 1000);
        const baseString = `${APP_ID}${path}${timestamp}${accessToken}`;
        const sign = crypto.createHmac('sha256', API_KEY).update(baseString).digest('hex');
        const url = new URL(host + path);
        url.searchParams.append('app_id', APP_ID);
        url.searchParams.append('access_token', accessToken);
        url.searchParams.append('timestamp', timestamp);
        url.searchParams.append('sign', sign);
        url.searchParams.append('keywords', searchTerm);
        url.searchParams.append('page_size', 20);
        const shopeeResponse = await fetch(url.toString());
        const data = await shopeeResponse.json();
        if (data.error) {
            console.error('Erro retornado pela API da Shopee na busca:', data.error, data.message);
            throw new Error(data.message || data.error);
        }
        res.status(200).json(data.data.product_offer_list || []);

    } catch (error) {
        console.error('Erro geral na função /api/search:', error.message);
        res.status(500).json({ error: 'Falha ao buscar produtos na Shopee.' });
    }
}
