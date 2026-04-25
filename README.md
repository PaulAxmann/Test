# Firmennews — Deployment auf Vercel

## Projektstruktur
```
firmennews/
├── api/
│   └── news.js          ← Serverless Function (ruft Anthropic API auf)
├── public/
│   └── index.html       ← Frontend
├── vercel.json          ← Vercel Konfiguration
└── README.md
```

## Schritt-für-Schritt Deployment

### 1. Anthropic API Key holen
- Gehe zu https://console.anthropic.com
- Unter "API Keys" → neuen Key erstellen
- Key kopieren (sieht so aus: `sk-ant-...`)

### 2. Vercel Account erstellen
- Gehe zu https://vercel.com
- Kostenlos registrieren (mit GitHub, Google oder E-Mail)

### 3. Vercel CLI installieren
```bash
npm install -g vercel
```

### 4. Projekt deployen
```bash
cd firmennews
vercel
```
- Fragen mit Enter bestätigen (Defaults sind fine)
- Am Ende bekommst du eine URL wie: `https://firmennews-xyz.vercel.app`

### 5. API Key als Environment Variable setzen
```bash
vercel env add ANTHROPIC_API_KEY
```
- Wert eingeben: deinen `sk-ant-...` Key
- Environment: Production, Preview, Development (alle auswählen)

### 6. Neu deployen damit der Key aktiv wird
```bash
vercel --prod
```

Fertig! Deine App läuft jetzt unter der Vercel-URL.

## Alternativ: Deployment über Vercel Dashboard (ohne Terminal)
1. Lade den `firmennews` Ordner als ZIP auf GitHub hoch
2. Gehe zu https://vercel.com/new
3. GitHub Repo importieren
4. Unter "Environment Variables" → `ANTHROPIC_API_KEY` = dein Key eintragen
5. Deploy klicken
