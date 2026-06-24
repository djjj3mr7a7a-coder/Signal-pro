export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const GEMINI_KEY = process.env.GEMINI_KEY;
  if(!GEMINI_KEY){ res.status(500).json({error:"No API key"}); return; }
  const { pair, tf, rsi, macd, stoch, ema20, ema50, trend, patterns, s1, r1, pivot } = req.query;
  const prompt = `You are a professional forex trader. Analyze this data and reply ONLY with JSON, no markdown:
Pair: ${pair}, Timeframe: ${tf}, RSI: ${rsi}, MACD: ${macd}, Stoch: ${stoch}
EMA20: ${ema20}, EMA50: ${ema50}, Market Structure: ${trend}
Candle Patterns: ${patterns||"None"}, Support: ${s1}, Resistance: ${r1}, Pivot: ${pivot}
Return ONLY: {"signal":"UP" or "DOWN" or "WAIT","confidence":number 0-100,"reason":"one sentence max 15 words"}`;
  try{
    const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.1,maxOutputTokens:100}})
    });
    const data = await r2.json();
    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g,"").trim();
    const match = text.match(/\{[\s\S]*\}/);
    res.status(200).json(match ? JSON.parse(match[0]) : {signal:"WAIT",confidence:50,reason:"Analysis inconclusive"});
  }catch(e){
    res.status(200).json({signal:"WAIT",confidence:50,reason:"AI unavailable"});
  }
}
