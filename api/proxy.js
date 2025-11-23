export default async function handler(req, res) {
  // Activer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Répondre aux requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // URL de ton Google Apps Script
  const GOOGLE_API = 'https://script.google.com/macros/s/AKfycbz6kPLouHBaqkKIP5pgki1fhwD9nmSxpkntdTngdOnIcRJRKmJXXEdGbOfuNWL0JK1-/exec';

  try {
    // Transférer la requête à Google Apps Script
    const response = await fetch(GOOGLE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    // Retourner la réponse
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Erreur proxy:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
