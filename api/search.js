// /api/search.js - Versão definitiva com fallback universal
const fetch = require("node-fetch");
const crypto = require("crypto");

// --- Cache do Access Token ---
let cachedToken = {
  accessToken: null,
  expiresAt: 0,
};

// --- Função para obter Access Token ---
async function getAccessToken(appId, apiKey) {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken.accessToken && now < cachedToken.expiresAt) {
    console.log("✅ Usando Access Token do cache.");
    return cachedToken.accessToken;
  }

  console.log("🔑 Gerando novo Access Token da Shopee...");
  const host = "https://open-api.affiliate.shopee.com.br";
  const path = "/api/v3/token/get";
  const baseString = `${appId}${path}${now}`;
  const sign = crypto.createHmac("sha256", apiKey).update(baseString).digest("hex");

  const authUrl = `${host}${path}?app_id=${appId}&timestamp=${now}&sign=${sign}`;
  const response = await fetch(authUrl);
  const data = await response.json();

  if (data.error || !data.data || !data.data.access_token) {
    console.error("❌ Falha ao obter Access Token. Resposta da Shopee:", data);
    throw new Error("Não foi possível autenticar com a API da Shopee.");
  }

  console.log("✅ Novo Access Token gerado com sucesso!");
  cachedToken.accessToken = data.data.access_token;
  cachedToken.expiresAt = now + data.data.expire_in - 300; // margem de 5 min
  return cachedToken.accessToken;
}

// --- Handler Principal ---
export default async function handler(req, res) {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    return res.status(400).json({ error: "Termo de busca é obrigatório" });
  }

  try {
    // --- Captura das variáveis (com fallback universal) ---
    const APP_ID =
      process.env.SHOPEE_APP_ID ||
      process.env.ID_do_aplicativo_da_SHOPEE ||
      process.env.APP_ID ||
      null;

    const API_KEY =
      process.env.SHOPEE_API_KEY ||
      process.env.CHAVE_APT_SHOPEE ||
      process.env.API_KEY ||
      null;

    // Logs de depuração (sem expor valores)
    console.log("🔍 Variáveis detectadas:");
    console.log(" - SHOPEE_APP_ID:", !!process.env.SHOPEE_APP_ID);
    console.log(" - ID_do_aplicativo_da_SHOPEE:", !!process.env.ID_do_aplicativo_da_SHOPEE);
    console.log(" - SHOPEE_API_KEY:", !!process.env.SHOPEE_API_KEY);
    console.log(" - CHAVE_APT_SHOPEE:", !!process.env.CHAVE_APT_SHOPEE);

    console.log("➡️ APP_ID usado:", APP_ID ? "OK" : "NÃO ENCONTRADO");
    console.log("➡️ API_KEY usada:", API_KEY ? "OK" : "NÃO ENCONTRADO");

    if (!APP_ID || !API_KEY) {
      throw new Error(
        "Nenhuma credencial válida da Shopee foi encontrada nas variáveis da Vercel."
      );
    }

    // --- Access Token ---
    const accessToken = await getAccessToken(APP_ID, API_KEY);

    // --- Requisição de Busca ---
    const host = "https://open-api.affiliate.shopee.com.br";
    const path = "/api/v3/product/search";
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${APP_ID}${path}${timestamp}${accessToken}`;
    const sign = crypto.createHmac("sha256", API_KEY).update(baseString).digest("hex");

    const url = new URL(host + path);
    url.searchParams.append("app_id", APP_ID);
    url.searchParams.append("access_token", accessToken);
    url.searchParams.append("timestamp", timestamp);
    url.searchParams.append("sign", sign);
    url.searchParams.append("keywords", searchTerm);
    url.searchParams.append("page_size", 20);

    console.log("📡 Enviando requisição para Shopee:", url.toString());

    const shopeeResponse = await fetch(url.toString());
    const data = await shopeeResponse.json();

    if (data.error) {
      console.error(
        "❌ Erro retornado pela API da Shopee:",
        data.error,
        data.message
      );
      throw new Error(data.message || data.error);
    }

    res.status(200).json(data.data.product_offer_list || []);
  } catch (error) {
    console.error("🔥 Erro geral na função /api/search:", error.message);
    res.status(500).json({ error: "Falha ao buscar produtos na Shopee." });
  }
}
