export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query fehlt' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht gesetzt in Vercel' });
  }

  const SYSTEM = `Du bist ein Wirtschafts-Analyst. Der Nutzer nennt eine Firma (ggf. mit Tippfehlern).

Erkenne die gemeinte Firma. Suche aktuelle wichtige Nachrichten.
Antworte NUR mit rohem JSON – kein Text davor/danach, keine Backticks, keine Erklärungen.

Exaktes Format (nichts anderes):
{"status":"found","company":"Name","nothing_new":false,"items":[{"type":"ma","title":"Titel","summary":"2-3 Sätze auf Deutsch.","date":"April 2025"}]}

type-Werte: ma, ceo, layoff, financial, legal, product, other
status: "found" oder "not_found"
nothing_new: true wenn keine wichtigen News, items dann leeres Array []

Nur aufnehmen: M&A, CEO-Wechsel, Massenentlassungen, Gewinnwarnungen, Insolvenzen, Gerichtsverfahren, Strategiewechsel. Max 6 Items.`;

  try {
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Firma: "${query}"` }]
      })
    });

    const data = await anthropicResp.json();

    if (!anthropicResp.ok) {
      return res.status(500).json({
        error: `Anthropic Fehler ${anthropicResp.status}: ${JSON.stringify(data?.error || data)}`
      });
    }

    // Extract all text blocks
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    if (!text) {
      const blockTypes = (data.content || []).map(b => b.type).join(', ');
      return res.status(500).json({
        error: `Keine Textantwort von Claude. Blöcke: [${blockTypes}], stop_reason: ${data.stop_reason}`
      });
    }

    // Extract JSON — find outermost { }
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return res.status(500).json({
        error: `Kein JSON in Antwort. Claude sagte: "${text.slice(0, 300)}"`
      });
    }

    const result = JSON.parse(m[0]);
    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
