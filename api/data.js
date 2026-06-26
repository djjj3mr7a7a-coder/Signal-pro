export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbol, interval } = req.query;
  const API_KEY = process.env.POLYGON_KEY;
  if(!API_KEY){ res.status(500).json({error:"No API key"}); return; }

  // Convert symbol EUR/USD -> C:EURUSD
  const ticker = "C:" + symbol.replace("/","");

  // Convert interval to Polygon format
  const tfMap = {"5min":"5","15min":"15","30min":"30","1h":"60","4h":"240"};
  const minutes = tfMap[interval] || "5";

  // Get last 100 candles
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];

  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${minutes}/minute/${from}/${to}?adjusted=true&sort=asc&limit=100&apiKey=${API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    if(!data.results || data.results.length === 0){
      res.status(200).json({status:"error", message:"No data from Polygon"});
      return;
    }

    // Convert to Twelve Data format for compatibility
    const values = data.results.map(function(bar){
      return {
        open: bar.o.toString(),
        high: bar.h.toString(),
        low: bar.l.toString(),
        close: bar.c.toString(),
        volume: bar.v.toString(),
        datetime: new Date(bar.t).toISOString()
      };
    }).reverse();

    res.status(200).json({status:"ok", values: values});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}
