// /api/search.js - Versão Melhorada com Fallback + Logs Claros

const fetch = require('node-fetch');
const crypto = require('crypto');

// --- Cache de Access Token ---
let cachedToken = {
  accessToken: null,
  expiresAt: 0,
};

async function getAccessToken(appId, apiKey) {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken.accessToken && now < cachedToken.expiresAt) {
    console.log(`[ShopeeAuth] Usando token em cache. Expira em ${(cachedToken.expiresAt - now)}s`);
    return cachedToken.accessToken;
  }

  console.log('[ShopeeAuth] Gerando novo Access Token...');

  const host = "https://open-api.affiliate.shopee.com.br";
  const path = "/api/v3/token/get";
  const baseString = `${appId}${path}${now}`;
  const sign = crypto.createHmac('sha256', apiKey).update(baseString).digest('hex');
  const authUrl = `${host}${path}?app_id=${appId}&timestamp=${now}&sign=${sign}`;

  try {
    const response = await fetch(authUrl);
    const data = await response.json();

    if (data.error || !data.data?.access_token) {
      console.error('[ShopeeAuth] Falha ao obter token:', data);
      throw new Error('Falha na autenticação com a Shopee.');
    }

    cachedToken.accessToken = data.data.access_token;
    cachedToken.expiresAt = now + data.data.expire_in - 300;

    console.log('[ShopeeAuth] Novo token obtido com sucesso!');
    return cachedToken.accessToken;
  } catch (err) {
    console.error('[ShopeeAuth] Erro de rede ou resposta inválida:', err.message);
    throw err;
  }
}

// --- Função Principal ---
export default async function handler(req, res) {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    return res.status(400).json({ error: 'Termo de busca é obrigatório.' });
  }

  try {
    // --- Fallback defensivo ---
    const APP_ID = process.env.SHOPEE_APP_ID || process.env.ID_do_aplicativo_da_SHOPEE;
    const API_KEY = process.env.SHOPEE_API_KEY || process.env.CHAVE_API_SHOPEE;

    if (process.env.SHOPEE_APP_ID) console.log("[Env] Usando SHOPEE_APP_ID");
    if (process.env.ID_do_aplicativo_da_SHOPEE) console.log("[Env] Usando ID_do_aplicativo_da_SHOPEE");

    if (!APP_ID || !API_KEY) {
      return res.status(500).json({
        error: 'Credenciais da Shopee não configuradas (nem em inglês nem em português).',
      });
    }

    // Obter token válido
    const accessToken = await getAccessToken(APP_ID, API_KEY);

    // Montar request de busca
    const host = "https://open-api.affiliate.shopee.com.br";
    const path = "/api/v3/product/search";
    const timestamp = Math.floor(Date.now() / 1000);
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
      console.error('[ShopeeSearch] Erro na busca:', data);
      return res.status(502).json({ error: data.message || data.error });
    }

    res.status(200).json(data.data?.product_offer_list || []);
  } catch (error) {
    console.error('[ShopeeSearch] Erro geral:', error.message);
    res.status(500).json({ error: 'Falha ao buscar produtos na Shopee.' });
  }
}
