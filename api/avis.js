// Avis Google de L'Écopticien, lus en direct via l'API officielle Google (Places API New).
// La clé se règle dans Vercel : variable d'environnement GOOGLE_PLACES_API_KEY.
// Réponse mise en cache 12 h par Vercel : quelques dizaines d'appels Google par mois au plus.
const PLACE_ID = 'ChIJaSBjn8wLk0cRKvRRvMujr1I';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const cle = process.env.GOOGLE_PLACES_API_KEY;
  if (!cle) {
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).end(JSON.stringify({ ok: false, raison: 'cle-absente' }));
    return;
  }
  try {
    const r = await fetch('https://places.googleapis.com/v1/places/' + PLACE_ID + '?languageCode=fr&regionCode=FR', {
      headers: { 'X-Goog-Api-Key': cle, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' }
    });
    if (!r.ok) throw new Error('Google a répondu ' + r.status);
    const d = await r.json();
    const avis = (d.reviews || []).map((v) => {
      const a = v.authorAttribution || {};
      const t = v.originalText || v.text || {};
      return {
        auteur: a.displayName || 'Client Google',
        profil: a.uri || null,
        photo: a.photoUri || null,
        note: v.rating || 0,
        texte: t.text || '',
        quand: v.relativePublishTimeDescription || '',
        lien: v.googleMapsUri || null
      };
    });
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    res.status(200).end(JSON.stringify({ ok: true, note: d.rating || null, total: d.userRatingCount || null, lien: d.googleMapsUri || null, avis }));
  } catch (e) {
    console.error(e && e.message);
    res.setHeader('Cache-Control', 's-maxage=600');
    res.status(200).end(JSON.stringify({ ok: false, raison: 'erreur' }));
  }
};
