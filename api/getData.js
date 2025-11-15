// 文件路径: api/getData.js

export default async function handler(request, response) {
  // 1. 从环境变量获取要查询的交易对，如果没有设置，则使用默认值
  const symbolsStr = process.env.SYMBOLS || 'BTC,ETH';
  const symbols = symbolsStr.split(',').map(s => s.trim().toUpperCase());

  // 2. 将交易对符号转换为币安 API 需要的格式 (e.g., 'BTC' -> 'BTCUSDT')
  const binanceSymbols = symbols.map(s => `${s}USDT`);

  // 3. 构建币安 API 请求 URL，使用 api3 域名避免地理限制
  const apiUrl = new URL('https://api3.binance.com/api/v3/ticker/price');
  apiUrl.searchParams.set('symbols', JSON.stringify(binanceSymbols));

  try {
    // 4. 发起请求获取数据
    const binanceResponse = await fetch(apiUrl.toString());

    if (!binanceResponse.ok) {
      // 如果币安返回错误，则抛出异常
      const errorText = await binanceResponse.text();
      throw new Error(`Binance API error: ${binanceResponse.status} - ${errorText}`);
    }

    const data = await binanceResponse.json();

    // 5. 成功后，将数据作为 JSON 响应返回
    // 同时设置缓存控制头，让 CDN 缓存结果 30 秒，减轻 API 压力
    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    response.status(200).json(data);

  } catch (error) {
    // 6. 如果发生任何错误，返回 500 错误码和错误信息
    console.error(error); // 在 Vercel 后台日志中打印错误
    response.status(500).json({ error: error.message });
  }
}