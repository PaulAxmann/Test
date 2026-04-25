export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query fehlt' });

  const SYSTEM = `Du bist ein Wirtschafts-Analyst. Der Nutzer nennt eine Firma (ggf. mit Tippfehlern).

Erkenne die gemeinte Firma. Suche aktuelle wichtige Nachrichten.
Antworte NUR mit rohem JSON – kein Text davor/danach, keine Backticks.

Format:
{"status":"found","company":"Name","nothing_new":false,"items":[{"type":"ma","title":"Titel","summary":"2-3 Sätze auf Deutsch.","date":"April 2025"}]}

type-Werte: ma, ceo, layoff, financial, legal, product, other
status: "found" oder "not_found"
nothing_new: true wenn keine wichtigen News

Nur aufnehmen: M&A, CEO-Wechsel, Massenentlassungen, Gewinnwarnungen, Insolvenzen, Gerichtsverfahren, Strategiewechsel. Max 6 Items.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Firma: "${query}"` }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data?.error || data));

    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    if (!text) throw new Error('Keine Textantwort von Claude');

    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Kein JSON in Antwort');

    res.status(200).json(JSON.parse(m[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
