// Génère les pages HTML statiques de public/ à partir de site.config.json et des occasions.
// Usage : npm run build
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { OCCASIONS } from '../public/assets/js/occasions.js';
import { PRICE_LABEL, PUBLISHED_DAYS, TERMS_VERSION, SITE_NAME } from '../lib/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const cfg = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const SITE = cfg.siteUrl.replace(/\/$/, '');
const YEARS = Math.round(PUBLISHED_DAYS / 365);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const missing = [];
const fill = (value, label) => {
  if (value && String(value).trim()) return esc(value);
  missing.push(label);
  return `<span class="todo">[À compléter : ${esc(label)}]</span>`;
};
const email = cfg.contactEmail ? `<a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : fill('', 'e-mail de contact');

function layout({ title, description, path, body, scripts = '', noindex = false, jsonld = null }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}${path}">`}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/assets/og-surprise.png">
<meta property="og:locale" content="fr_FR">
<meta name="theme-color" content="#d63c72">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${scripts}
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="logo" href="/"><img src="/favicon.svg" alt="" width="28" height="28">${SITE_NAME}</a>
  <nav class="nav" aria-label="Navigation principale">
    <a href="/#occasions">Occasions</a>
    <a href="/#prix">Prix</a>
    <a href="/#faq">FAQ</a>
    <a class="btn small" href="/creer">Créer ma page</a>
  </nav>
</div></header>
${body}
<footer class="site-footer"><div class="wrap">
  <span>© ${new Date().getFullYear()} ${SITE_NAME} — fait en France avec ♥</span>
  <nav aria-label="Liens légaux">
    <a href="/mentions-legales">Mentions légales</a>
    <a href="/cgv">CGV</a>
    <a href="/confidentialite">Confidentialité</a>
    <a href="/regles-de-contenu">Règles de contenu &amp; signalement</a>
  </nav>
</div></footer>
</body>
</html>
`;
}

const generalFaq = [
  ['Comment la personne reçoit-elle sa page ?', 'Après le paiement, tu obtiens un lien et un QR code. Envoie le lien par message, ou imprime la carte avec le QR code fournie (format A6) : il suffit de la scanner avec l’appareil photo d’un téléphone.'],
  ['Combien de temps la page reste-t-elle en ligne ?', `${YEARS} ans à compter du paiement. Tu peux la modifier gratuitement pendant toute cette durée, ou la supprimer quand tu veux.`],
  ['Qui peut voir la page ?', 'Uniquement les personnes qui ont le lien. La page n’est pas référencée sur Google et son adresse est impossible à deviner. Tu peux en plus ajouter une question secrète à l’ouverture.'],
  ['Faut-il créer un compte ?', 'Non. Tu crées ta page, tu paies, c’est en ligne. Un lien de modification secret te permet de revenir la modifier.'],
  ['Quelles photos puis-je ajouter ?', 'Jusqu’à 10 photos (JPEG, PNG, ou photos d’iPhone depuis un iPhone). Elles sont allégées dans ton navigateur et leurs données de localisation sont supprimées avant l’envoi.'],
  ['Et la musique ?', 'Colle un lien YouTube ou Spotify : la chanson se lance quand la personne appuie sur « Écouter ». YouTube joue le morceau en entier ; Spotify ne joue qu’un extrait de 30 secondes si la personne n’a pas de compte Spotify connecté.'],
  ['Je peux voir le résultat avant de payer ?', 'Oui, l’aperçu se met à jour en direct pendant que tu écris. Tu ne paies que lorsque tu es satisfait(e).'],
  ['Comment se passe le paiement ?', `Par carte bancaire, Apple Pay ou Google Pay via Stripe, une plateforme de paiement sécurisée. ${PRICE_LABEL}, une seule fois, sans abonnement.`],
];

function faqHtml(items) {
  return `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
}
function faqLd(items) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
}

const occasionGrid = `<div class="occasions">${OCCASIONS.map((o) => `<a class="occasion-link" href="/${o.id}"><span aria-hidden="true">${o.emoji}</span>${esc(o.label)}</a>`).join('')}</div>`;

const priceBox = `<div class="price-box">
  <div class="amount">${PRICE_LABEL}</div>
  <div>une seule fois, sans abonnement</div>
  <ul>
    <li>Ta page en ligne ${YEARS} ans</li>
    <li>Lien privé + QR code + carte à imprimer</li>
    <li>Modifications illimitées</li>
    <li>Sans publicité, sans compte</li>
  </ul><br>
  <a class="btn" href="/creer">Créer ma page</a>
  <p class="price-note">Aperçu gratuit avant de payer · satisfait(e) ou remboursé(e) 14 jours.<br>TVA non applicable, art. 293 B du CGI.</p>
</div>`;

const steps = `<div class="grid3">
  <div class="card"><span class="step-n">1</span><h3>Tu écris</h3><p>Choisis l’occasion, écris ta lettre, ajoute tes photos, vos souvenirs et votre chanson. L’aperçu se met à jour en direct.</p></div>
  <div class="card"><span class="step-n">2</span><h3>Tu publies</h3><p>Paiement sécurisé de ${PRICE_LABEL}. Ta page est en ligne immédiatement, avec son lien secret et son QR code.</p></div>
  <div class="card"><span class="step-n">3</span><h3>Tu offres</h3><p>Envoie le lien ou imprime la carte QR code. La personne ouvre l’enveloppe… et découvre ta surprise.</p></div>
</div>`;

const howVideo = `<div class="how">
  <figure class="how-video">
    <div class="phone video-phone"><video data-autoplay src="/assets/video/demo-creation.mp4" poster="/assets/video/demo-poster.jpg" muted loop playsinline preload="none" aria-label="Démonstration : création d’une page puis ouverture par la personne qui la reçoit"></video></div>
    <figcaption>Démo réelle, sans montage : 36 secondes</figcaption>
  </figure>
  <div class="how-steps">${steps}</div>
</div>`;

const features = `<ul class="features">
  <li>Une enveloppe animée à l’ouverture</li>
  <li>Ta lettre, mise en page comme une vraie lettre</li>
  <li>Jusqu’à 10 photos avec légendes</li>
  <li>Une frise de vos souvenirs</li>
  <li>Des cartes à retourner (« ce que j’aime chez toi »)</li>
  <li>Un compteur de jours (« ensemble depuis 1 248 jours »)</li>
  <li>Votre chanson (YouTube ou Spotify)</li>
  <li>Une question secrète facultative pour ouvrir la page</li>
  <li>8 thèmes de couleurs</li>
  <li>Parfait sur téléphone</li>
</ul>`;

const pages = {};

pages['index.html'] = layout({
  title: `${SITE_NAME} — page cadeau personnalisée avec photos, lettre et musique`,
  description: `Crée une page web unique pour la personne que tu aimes : lettre, photos, souvenirs et chanson, à offrir par lien ou QR code. Saint-Valentin, anniversaire, fête des mères… ${PRICE_LABEL}.`,
  path: '/',
  jsonld: faqLd(generalFaq),
  scripts: '<script type="module" src="/assets/js/season.js"></script><script type="module" src="/assets/js/video.js"></script>',
  body: `<main>
<div class="wrap"><p class="season" id="season" hidden></p></div>
<section class="wrap hero">
  <div>
    <h1>Offre une page rien qu’à elle. Ou à lui.</h1>
    <p class="lead">Ta lettre, vos photos, vos souvenirs et votre chanson, réunis sur une page secrète qui s’ouvre comme une enveloppe. À offrir par lien ou par QR code.</p>
    <div class="cta"><a class="btn" href="/creer">Créer ma page</a><a class="btn ghost" href="/p/demo" target="_blank" rel="noopener">Voir un exemple</a></div>
    <p class="price-note">${PRICE_LABEL} · aperçu gratuit · prête en 10 minutes · satisfait ou remboursé 14 jours</p>
  </div>
  <div class="phone"><iframe src="/p/demo" title="Exemple de page" loading="lazy"></iframe></div>
</section>
<section class="section"><div class="wrap">
  <h2>Comment ça marche</h2>
  <p class="sub">Pas besoin d’être doué(e) en informatique : si tu sais écrire un message, tu sais créer ta page.</p>
  ${howVideo}
</div></section>
<section class="section" id="occasions"><div class="wrap">
  <h2>Pour toutes les occasions</h2>
  <p class="sub">Chaque occasion a ses textes, ses couleurs et ses idées pour t’aider à écrire.</p>
  ${occasionGrid}
</div></section>
<section class="section"><div class="wrap narrow">
  <h2>Ce qu’il y a dans ta page</h2>
  ${features}
</div></section>
<section class="section" id="prix"><div class="wrap">
  <h2>Un prix simple</h2>
  <p class="sub">Un bouquet : environ 40 €, fané en une semaine. Ta page : ${PRICE_LABEL}, en ligne ${YEARS} ans.</p>
  ${priceBox}
</div></section>
<section class="section" id="faq"><div class="wrap narrow">
  <h2>Questions fréquentes</h2>
  ${faqHtml(generalFaq)}
</div></section>
</main>`,
});

for (const o of OCCASIONS) {
  const faq = [...o.faq, ...generalFaq.slice(0, 5)];
  pages[`${o.id}.html`] = layout({
    title: o.seoTitle,
    description: o.lead.slice(0, 155),
    path: `/${o.id}`,
    jsonld: faqLd(faq),
    scripts: '<script type="module" src="/assets/js/video.js"></script>',
    body: `<main>
<section class="wrap hero">
  <div>
    <p class="eyebrow" style="color:var(--accent);font-weight:600;margin:0 0 8px">${o.emoji} ${esc(o.label)}</p>
    <h1>${esc(o.h1)}</h1>
    <p class="lead">${esc(o.lead)}</p>
    <div class="cta"><a class="btn" href="/creer?occasion=${o.id}">${esc(o.cta || 'Créer ma page')}</a><a class="btn ghost" href="/p/demo" target="_blank" rel="noopener">Voir un exemple</a></div>
    <p class="price-note">${PRICE_LABEL} · aperçu gratuit avant de payer · en ligne immédiatement</p>
  </div>
  <div class="phone"><iframe src="/p/demo" title="Exemple de page" loading="lazy"></iframe></div>
</section>
<section class="section"><div class="wrap narrow">
  <h2>Nos conseils pour une page réussie</h2>
  <ul>${o.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  <h2 style="margin-top:40px">Des idées pour commencer ta lettre</h2>
  <ul>${o.letterIdeas.map((t) => `<li><em>« ${esc(t)} »</em></li>`).join('')}</ul>
  <h2 style="margin-top:40px">Des idées pour « ${esc(o.reasonsTitle)} »</h2>
  <ul>${o.reasonIdeas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
</div></section>
<section class="section"><div class="wrap">
  <h2>Comment ça marche</h2>
  ${howVideo}
</div></section>
<section class="section"><div class="wrap">${priceBox}</div></section>
<section class="section"><div class="wrap narrow">
  <h2>Questions fréquentes</h2>
  ${faqHtml(faq)}
  <p style="text-align:center;margin-top:30px">Autres occasions : ${OCCASIONS.filter((x) => x.id !== o.id).map((x) => `<a href="/${x.id}">${esc(x.label)}</a>`).join(' · ')}</p>
</div></section>
</main>`,
  });
}

pages['creer.html'] = layout({
  title: `Créer ma page — ${SITE_NAME}`,
  description: 'Crée ta page cadeau personnalisée : lettre, photos, souvenirs, musique. Aperçu en direct et gratuit.',
  path: '/creer',
  scripts: '<script type="module" src="/assets/js/editor.js"></script>',
  body: `<main class="editor">
<div>
  <div class="notice" id="edit-banner" hidden>Tu modifies une page existante. <a id="view-link" href="#" target="_blank" rel="noopener" hidden>Voir la page en ligne</a></div>
  <div class="notice" id="my-pages" hidden><strong>Tes pages créées sur cet appareil :</strong><ul style="margin:6px 0 0"></ul></div>
  <div id="notice" class="notice" hidden role="alert"></div>
  <form id="editor-form">
    <fieldset>
      <legend>L’occasion</legend>
      <div class="chips" id="occasion-chips"></div>
      <div class="field"><span class="label">Couleurs</span><div class="swatches" id="theme-swatches"></div></div>
    </fieldset>
    <fieldset>
      <legend>Pour qui ?</legend>
      <div class="row2">
        <div class="field"><label for="f-to">Son prénom *</label><input id="f-to" type="text" data-field="to" maxlength="60" placeholder="Léa" required></div>
        <div class="field"><label for="f-from">De la part de</label><input id="f-from" type="text" data-field="from" maxlength="60" placeholder="Hugo"></div>
      </div>
    </fieldset>
    <fieldset>
      <legend>L’ouverture</legend>
      <div class="field"><label for="f-intro">Message sur l’enveloppe</label><input id="f-intro" type="text" data-field="intro" maxlength="160"></div>
      <div class="field"><label for="f-title">Titre de la page *</label><input id="f-title" type="text" data-field="title" maxlength="120" required></div>
    </fieldset>
    <fieldset>
      <legend>Une date qui compte</legend>
      <div class="row2">
        <div class="field"><label for="f-date">Date</label><input id="f-date" type="date" data-field="date"></div>
        <div class="field"><label for="f-dateLabel">Libellé</label><input id="f-dateLabel" type="text" data-field="dateLabel" maxlength="40" placeholder="Ensemble depuis"></div>
      </div>
      <p class="help">Facultatif. La page affiche le nombre de jours écoulés depuis cette date.</p>
    </fieldset>
    <fieldset>
      <legend>Ta lettre</legend>
      <div class="field">
        <label for="f-letter" class="label">Écris avec ton cœur (les retours à la ligne sont conservés)</label>
        <textarea id="f-letter" class="letter-input" data-field="letter" maxlength="5000"></textarea>
        <div class="counter-hint" data-count="f-letter"></div>
        <div class="help">Besoin d’un coup de pouce ? Clique sur une idée :</div>
        <div class="ideas" id="letter-ideas"></div>
      </div>
    </fieldset>
    <fieldset>
      <legend>Photos <span id="photo-count" style="font-size:15px;color:var(--muted)"></span></legend>
      <label class="dropzone" id="dropzone">
        <input id="photo-input" type="file" accept="image/*" multiple>
        📷 <strong>Ajouter des photos</strong><br><span style="font-size:13px">Clique ou glisse tes photos ici (10 maximum)</span>
      </label>
      <p class="help" id="photo-status" role="status"></p>
      <div class="photo-list" id="photo-list"></div>
      <p class="help">N’ajoute que des photos que tu as le droit de partager, avec l’accord des personnes visibles. Pour un enfant, demande l’accord de ses parents et évite nom complet, école ou adresse.</p>
    </fieldset>
    <fieldset>
      <legend id="timeline-legend">Frise de souvenirs</legend>
      <p class="help">Facultatif. Des dates et des moments clés.</p>
      <div id="timeline-list"></div>
      <button type="button" class="btn ghost small add-btn" id="add-timeline">+ Ajouter un souvenir</button>
    </fieldset>
    <fieldset>
      <legend id="reasons-legend">Liste</legend>
      <p class="help">Facultatif. Chaque élément devient une carte à retourner.</p>
      <div id="reasons-list"></div>
      <button type="button" class="btn ghost small add-btn" id="add-reason">+ Ajouter</button>
      <div class="ideas" id="reason-ideas"></div>
    </fieldset>
    <fieldset>
      <legend>La chanson</legend>
      <div class="field"><label for="f-music">Lien YouTube ou Spotify</label><input id="f-music" type="url" data-field="music" maxlength="300" placeholder="https://www.youtube.com/watch?v=…" inputmode="url"><p class="help" id="music-status" role="status"></p><p class="help">Conseil : préfère YouTube, qui joue le morceau en entier. Avec Spotify, la personne n’entend qu’un extrait de 30 secondes si elle n’est pas connectée à son compte Spotify.</p></div>
    </fieldset>
    <fieldset>
      <legend>Le mot de la fin</legend>
      <div class="field"><label for="f-finalMessage">Message final</label><textarea id="f-finalMessage" data-field="finalMessage" maxlength="600" rows="3"></textarea></div>
    </fieldset>
    <fieldset>
      <legend>Question secrète <span style="font-size:15px;color:var(--muted)">(facultatif)</span></legend>
      <p class="help">La page ne s’ouvre qu’avec la bonne réponse (majuscules et accents ignorés). C’est un jeu, pas une protection forte.</p>
      <div class="row2">
        <div class="field"><label for="f-question">Question</label><input id="f-question" type="text" maxlength="140" placeholder="Où s’est-on rencontrés ?"></div>
        <div class="field"><label for="f-answer">Réponse</label><input id="f-answer" type="text" maxlength="100" autocomplete="off" placeholder="au café de la place"></div>
      </div>
    </fieldset>
    <p style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn ghost small" id="reset-btn" hidden>Recommencer à zéro</button><button type="button" class="btn ghost small" id="delete-btn" hidden>Supprimer ma page</button></p>
  </form>
</div>
<aside class="editor-preview" id="preview-pane" aria-label="Aperçu">
  <div class="phone"><iframe id="preview-frame" title="Aperçu de la page"></iframe></div>
  <p>Aperçu en direct</p>
  <button type="button" class="btn close-preview" id="close-preview">Fermer l’aperçu</button>
</aside>
</main>
<div class="publish-bar"><div class="inner">
  <span class="status" id="save-status" role="status"></span>
  <div class="actions">
    <button type="button" class="btn ghost preview-toggle" id="preview-toggle">Aperçu</button>
    <button type="button" class="btn ghost" id="pay-btn" hidden>Payer et publier</button>
    <button type="button" class="btn" id="publish-btn">Publier — ${PRICE_LABEL}</button>
  </div>
</div></div>
<dialog id="publish-dialog">
  <h2>Publier ta page</h2>
  <p>Ta page sera en ligne <strong>immédiatement après le paiement</strong> de <strong>${PRICE_LABEL}</strong> (TVA non applicable, art. 293 B du CGI), hébergée ${YEARS} ans et modifiable gratuitement.</p>
  <label class="check"><input type="checkbox" id="c-terms"><span>J’ai lu et j’accepte les <a href="/cgv" target="_blank">conditions générales de vente</a> et les <a href="/regles-de-contenu" target="_blank">règles de contenu</a>, et je confirme avoir le droit de publier ces photos et textes.</span></label>
  <label class="check"><input type="checkbox" id="c-waiver"><span>Je demande la mise en ligne immédiate de ma page et je reconnais <strong>perdre mon droit de rétractation</strong> dès qu’elle est fournie (art. L221-28 13° du Code de la consommation).</span></label>
  <p style="font-size:14px;margin:0">🔒 Paiement sécurisé par Stripe : carte bancaire, Apple Pay, Google Pay. Ta page reste modifiable gratuitement après le paiement, et tu es <strong>satisfait(e) ou remboursé(e) pendant 14 jours</strong>.</p>
  <p class="progress" id="publish-progress" role="status"></p>
  <div class="dialog-actions">
    <button type="button" class="btn ghost" id="publish-cancel">Revenir à ma page</button>
    <button type="button" class="btn" id="publish-confirm">Payer ${PRICE_LABEL}</button>
  </div>
</dialog>`,
});

pages['merci.html'] = layout({
  title: `Ta page est en ligne — ${SITE_NAME}`,
  description: 'Ta page est publiée.',
  path: '/merci',
  noindex: true,
  scripts: '<script src="/assets/vendor/qrcode.js" defer></script><script type="module" src="/assets/js/merci.js"></script>',
  body: `<main class="wrap narrow thanks">
  <p class="notice" id="status" role="status">Vérification du paiement…</p>
  <div id="done" hidden>
    <h1>🎉 Ta page est en ligne !</h1>
    <p>Voici son lien secret. Garde-le précieusement et offre-le quand tu veux.</p>
    <div class="share-box"><input id="page-url" type="text" readonly aria-label="Lien de la page"><button class="btn" id="copy-btn" type="button">Copier</button></div>
    <p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      <a class="btn ghost" id="open-link" href="#" target="_blank" rel="noopener">Voir ma page</a>
      <button class="btn ghost" id="share-btn" type="button" hidden>Partager</button>
    </p>
    <h2>Le QR code</h2>
    <div class="qr" id="qr"></div>
    <p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="print-btn" type="button">Imprimer la carte (A6)</button>
      <button class="btn ghost" id="download-qr" type="button">Télécharger le QR code</button>
    </p>
    <div class="callout" id="edit-box" hidden style="text-align:left;margin-top:30px">
      <strong>🔑 Ton lien de modification (ne le partage pas !)</strong>
      <p style="margin:6px 0">Il permet de modifier ou supprimer ta page. Il est enregistré sur cet appareil, mais copie-le ou mets-le en favori pour ne pas le perdre.</p>
      <a class="edit-link" id="edit-link" href="#"></a>
    </div>
    <p style="margin-top:30px;font-size:14px;color:var(--muted)">Ta facture, qui confirme ta commande, t’est envoyée par e-mail. Une question ? ${email}</p>
  </div>
  <div class="print-card" aria-hidden="true">
    <p>💌</p>
    <h2 id="card-to">Pour toi</h2>
    <p>Quelqu’un t’a préparé une surprise.</p>
    <div class="qr" id="card-qr"></div>
    <p>Scanne-moi avec l’appareil photo de ton téléphone</p>
  </div>
</main>`,
});

pages['admin.html'] = layout({
  title: 'Modération', description: 'Modération', path: '/admin', noindex: true,
  scripts: '<script type="module" src="/assets/js/admin.js"></script>',
  body: `<main class="wrap prose">
  <h1>Signalements</h1>
  <form id="login" style="display:flex;gap:8px;max-width:520px"><input id="token" type="password" placeholder="Jeton administrateur" autocomplete="off"><button class="btn small">Charger</button></form>
  <p id="out"></p>
  <table class="admin-table"><thead><tr><th>Date</th><th>Page</th><th>Motif</th><th>Détails</th><th>Contact</th><th>Actions</th></tr></thead><tbody id="reports"></tbody></table>
</main>`,
});

const e = cfg.editor;
pages['mentions-legales.html'] = layout({
  title: `Mentions légales — ${SITE_NAME}`, description: 'Mentions légales du site.', path: '/mentions-legales',
  body: `<main class="wrap narrow prose">
<h1>Mentions légales</h1>
<h2>Éditeur du site</h2>
<p>${fill(e.name, 'prénom et nom')}<br>${esc(e.status)}<br>SIRET : ${fill(e.siret, 'SIRET')}<br>Adresse : ${fill(e.address, 'adresse')}<br>E-mail : ${email}<br>Téléphone : ${fill(e.phone, 'téléphone')}<br>Immatriculation : Registre national des entreprises (RNE)<br>TVA non applicable, art. 293 B du CGI.</p>
<p>Directeur de la publication : ${fill(e.name, 'prénom et nom')}.</p>
<h2>Hébergeur</h2>
<p>Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, États-Unis — Tél. : +1 650 319 8930 — www.cloudflare.com</p>
<h2>Contenus publiés par les utilisateurs</h2>
<p>Les pages personnalisées sont créées par les utilisateurs, qui sont responsables de leur contenu. ${SITE_NAME} agit comme hébergeur de ces contenus. Pour signaler un contenu : bouton « Signaler un contenu » présent sur chaque page, ou ${email}. Voir les <a href="/regles-de-contenu">règles de contenu</a>.</p>
<h2>Propriété intellectuelle</h2>
<p>Le site, son design et ses textes sont protégés. Les contenus des pages restent la propriété de leurs auteurs.</p>
</main>`,
});

const m = cfg.mediator;
pages['cgv.html'] = layout({
  title: `Conditions générales de vente — ${SITE_NAME}`, description: 'Conditions générales de vente.', path: '/cgv',
  body: `<main class="wrap narrow prose">
<h1>Conditions générales de vente</h1>
<p>Version du ${TERMS_VERSION}.</p>
<h2>1. Vendeur</h2>
<p>${fill(e.name, 'prénom et nom')}, ${esc(e.status)}, SIRET ${fill(e.siret, 'SIRET')}, ${fill(e.address, 'adresse')}, ${email} (ci-après « nous »).</p>
<h2>2. Service</h2>
<p>${SITE_NAME} permet de créer une page web personnalisée (textes, photos, liens musicaux) accessible par un lien privé non référencé et un QR code (la « Page »). La Page est un contenu numérique fourni sans support matériel. Elle est hébergée pendant ${YEARS} ans à compter du paiement, puis supprimée automatiquement. Elle peut être modifiée gratuitement ou supprimée à tout moment pendant cette durée grâce au lien de modification remis après l’achat.</p>
<p>Un aperçu gratuit et complet est disponible avant toute commande. La Page s’affiche dans tout navigateur récent (téléphone ou ordinateur) avec une connexion internet. La lecture de la musique dépend de la disponibilité du morceau sur YouTube ou Spotify.</p>
<p>Pour commander, tu dois être majeur(e) ou avoir l’accord d’un parent.</p>
<h2>3. Prix</h2>
<p>Le prix est de ${PRICE_LABEL} TTC par Page, payable une seule fois. TVA non applicable, art. 293 B du CGI. Des codes de réduction peuvent être proposés ponctuellement.</p>
<h2>4. Commande et paiement</h2>
<p>La commande est passée en cliquant sur « Payer » après avoir accepté les présentes conditions. Le paiement est réalisé par carte bancaire, Apple Pay ou Google Pay via le prestataire Stripe. Nous n’avons jamais accès à tes données bancaires. La Page est mise en ligne dès la confirmation du paiement. Une facture confirmant la commande, la version des présentes conditions et ta renonciation au droit de rétractation t’est envoyée par e-mail.</p>
<h2>5. Droit de rétractation</h2>
<p>Conformément à l’article L221-28 13° du Code de la consommation, le droit de rétractation ne peut être exercé pour la fourniture d’un contenu numérique non fourni sur un support matériel dont l’exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation. Avant le paiement, tu demandes expressément la mise en ligne immédiate de ta Page et tu reconnais perdre ton droit de rétractation (case à cocher obligatoire). Cette confirmation figure également sur la facture transmise par e-mail.</p>
<p><strong>Satisfait(e) ou remboursé(e) 14 jours :</strong> indépendamment de ce qui précède, et à titre de geste commercial, tu peux demander le remboursement intégral de ta Page pendant 14 jours après l’achat en écrivant à ${email}. Ta Page est alors supprimée.</p>
<h2>6. Ton contenu</h2>
<p>Tu es seul(e) responsable des textes, photos et liens que tu publies. Tu garantis disposer des droits nécessaires, avoir obtenu l’accord des personnes reconnaissables sur les photos (et de leurs parents s’il s’agit de mineurs), et respecter les <a href="/regles-de-contenu">règles de contenu</a>. Aucun fichier audio n’est hébergé : la musique est lue depuis YouTube ou Spotify.</p>
<p>Nous pouvons retirer sans délai une Page manifestement illicite ou contraire aux règles de contenu, notamment après signalement. Dans ce cas, aucun remboursement n’est dû si le retrait résulte d’un manquement de ta part.</p>
<h2>7. Garantie légale de conformité et disponibilité</h2>
<div class="callout"><p><strong>Garantie légale de conformité.</strong> Tu disposes de la garantie légale de conformité des contenus et services numériques (articles L224-25-12 et suivants du Code de la consommation) pendant toute la durée de fourniture de ta Page, soit ${YEARS} ans. Pendant cette durée, tu n’as à prouver que l’existence du défaut de conformité, pas sa date d’apparition. La garantie te donne droit à la mise en conformité sans frais, ou, si elle est impossible, refusée ou tardive, à une réduction du prix ou à la résolution du contrat avec remboursement. Pour l’exercer, écris à ${email}. Cette garantie s’applique indépendamment de toute garantie commerciale.</p></div>
<p>Si ta Page ne fonctionne pas comme décrit, écris-nous : nous la corrigeons, ou te remboursons si la correction est impossible. Nous mettons tout en œuvre pour que la Page reste accessible pendant toute sa durée d’hébergement ; des interruptions ponctuelles pour maintenance ou incident restent possibles.</p>
<h2>8. Données personnelles</h2>
<p>Voir la <a href="/confidentialite">politique de confidentialité</a>.</p>
<h2>9. Réclamations et médiation</h2>
<p>Pour toute réclamation : ${email}. En cas de litige non résolu, tu peux recourir gratuitement au médiateur de la consommation : ${fill(m.name, 'nom du médiateur')}${m.url ? ` — <a href="${esc(m.url)}" rel="noopener">${esc(m.url)}</a>` : ''}${m.address ? ` — ${esc(m.address)}` : ''}.</p>
<h2>10. Droit applicable</h2>
<p>Les présentes conditions sont soumises au droit français. Les règles impératives de protection du consommateur de ton pays de résidence restent applicables.</p>
</main>`,
});

pages['confidentialite.html'] = layout({
  title: `Confidentialité — ${SITE_NAME}`, description: 'Politique de confidentialité.', path: '/confidentialite',
  body: `<main class="wrap narrow prose">
<h1>Politique de confidentialité</h1>
<p>Responsable du traitement : ${fill(e.name, 'prénom et nom')}, ${email}.</p>
<h2>Ce que nous collectons, pourquoi, combien de temps</h2>
<ul>
<li><strong>Contenu de ta Page</strong> (prénoms, textes, photos, lien musical, question secrète sous forme chiffrée) : pour fournir le service (exécution du contrat). Brouillon envoyé mais non payé : effacé automatiquement après 48 heures. Page payée : ${YEARS} ans, puis effacement automatique. Tu peux la supprimer à tout moment.</li>
<li><strong>Lien de modification</strong> : nous n’en conservons qu’une empreinte chiffrée (non réversible).</li>
<li><strong>Paiement</strong> : traité par Stripe, qui nous transmet ton nom, ton e-mail et le statut du paiement (exécution du contrat). Les pièces comptables sont conservées 10 ans (obligation légale).</li>
<li><strong>Signalements</strong> (motif, explication, e-mail facultatif) : pour traiter le signalement (obligation légale d’hébergeur), conservés 1 an. En cas de retrait d’une Page, une trace minimale sans contenu est gardée 30 jours.</li>
<li><strong>Données d’identification des créateurs</strong> (adresse IP, date et type d’opération : création, modification, suppression d’une Page) : conservées 1 an, comme l’impose aux hébergeurs l’article 6 de la loi pour la confiance dans l’économie numérique (obligation légale).</li>
<li><strong>Preuve de ta commande</strong> (identifiant de la Page, date, version des CGV acceptée, renonciation au droit de rétractation, référence du paiement, sans le contenu) : conservée 5 ans pour pouvoir répondre à une éventuelle réclamation (intérêt légitime), même si la Page est supprimée.</li>
<li><strong>Journaux techniques</strong> (adresse IP, date) traités par notre hébergeur pour la sécurité du service (intérêt légitime).</li>
</ul>
<h2>Photos</h2>
<p>Les photos sont redimensionnées dans ton navigateur avant l’envoi, ce qui supprime leurs métadonnées (dont la localisation GPS). Elles ne sont accessibles qu’aux personnes disposant du lien de la Page, ne sont jamais revendues et ne servent à aucune autre fin.</p>
<h2>Personnes figurant sur une Page</h2>
<p>Si tu apparais sur une Page sans y avoir consenti, utilise le bouton « Signaler un contenu » de la Page ou écris à ${email} : nous traitons ces demandes en priorité.</p>
<h2>Cookies et stockage local</h2>
<p>Aucun cookie publicitaire ni outil de mesure d’audience tiers. Ton brouillon et tes liens de modification sont enregistrés uniquement sur ton appareil (stockage local du navigateur), ce qui est strictement nécessaire au service. Stripe dépose ses propres cookies sur sa page de paiement. Les lecteurs YouTube (version « sans cookie ») et Spotify ne sont chargés que si le visiteur clique sur « Écouter » : Google ou Spotify reçoivent alors son adresse IP et peuvent déposer leurs propres traceurs, selon leurs politiques.</p>
<h2>Sous-traitants</h2>
<ul>
<li>Cloudflare, Inc. (hébergement et stockage) — données susceptibles d’être traitées aux États-Unis, encadrées par le Data Privacy Framework et des clauses contractuelles types.</li>
<li>Stripe Payments Europe, Ltd. (paiement, Irlande) — certaines données peuvent être transférées à Stripe, Inc. aux États-Unis, encadrées par le Data Privacy Framework et des clauses contractuelles types.</li>
</ul>
<h2>Tes droits</h2>
<p>Tu disposes des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Écris à ${email}. Tu peux aussi définir des directives relatives au sort de tes données après ton décès, et saisir la CNIL (www.cnil.fr).</p>
</main>`,
});

pages['regles-de-contenu.html'] = layout({
  title: `Règles de contenu et signalement — ${SITE_NAME}`, description: 'Ce qui est interdit et comment signaler un contenu.', path: '/regles-de-contenu',
  body: `<main class="wrap narrow prose">
<h1>Règles de contenu et signalement</h1>
<p>${SITE_NAME} sert à offrir des pages bienveillantes. Sont interdits notamment :</p>
<ul>
<li>les photos ou informations d’une personne publiées sans son accord, et toute atteinte à la vie privée ;</li>
<li>la nudité, les contenus sexuels, et tout contenu sexualisant un mineur ;</li>
<li>le harcèlement, les menaces, l’incitation à la haine ou à la violence ;</li>
<li>les contenus contrefaisants (photos ou textes dont tu n’as pas les droits) ;</li>
<li>les arnaques, l’hameçonnage et toute utilisation commerciale ou publicitaire ;</li>
<li>plus généralement, tout contenu illicite.</li>
</ul>
<h2>Signaler un contenu</h2>
<p>Chaque Page comporte un bouton « Signaler un contenu ». Tu peux aussi écrire à ${email} en indiquant le lien de la Page, le motif et une explication. Point de contact unique (y compris pour les autorités) : ${email}, en français ou en anglais.</p>
<h2>Ce que nous faisons</h2>
<p>Chaque signalement est examiné par une personne, sans outil automatisé, avec diligence. Nous retirons promptement les contenus manifestement illicites ou contraires à ces règles. En cas de menace pour la vie ou la sécurité d’une personne, nous informons les autorités compétentes (plateforme Pharos, procureur de la République).</p>
<p>Quand nous retirons une Page, nous en informons son auteur par e-mail (adresse fournie lors du paiement) avec un exposé des motifs : la mesure prise, les faits en cause, la règle enfreinte (loi ou présentes règles), le fait que la décision a été prise sans moyen automatisé, et les voies de recours : nous répondre pour contester, saisir un médiateur, ou saisir le juge. L’auteur d’un signalement en est également informé s’il a laissé son adresse. L’auteur d’un signalement abusif s’expose à des poursuites (article 6 de la loi pour la confiance dans l’économie numérique).</p>
</main>`,
});

pages['404.html'] = layout({
  title: `Page introuvable — ${SITE_NAME}`, description: 'Page introuvable.', path: '/404', noindex: true,
  body: `<main class="wrap narrow prose" style="text-align:center"><h1>Oups, cette page n’existe pas</h1><p><a class="btn" href="/">Retour à l’accueil</a></p></main>`,
});

for (const [file, html] of Object.entries(pages)) writeFileSync(join(pub, file), html);

const indexable = ['/', ...OCCASIONS.map((o) => `/${o.id}`), '/mentions-legales', '/cgv', '/confidentialite', '/regles-de-contenu'];
writeFileSync(join(pub, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(pub, 'robots.txt'), `User-agent: *
Disallow: /p/
Disallow: /api/
Disallow: /admin
Disallow: /merci
Disallow: /voir
Sitemap: ${SITE}/sitemap.xml
`);

const unique = [...new Set(missing)];
console.log(`${Object.keys(pages).length} pages générées.`);
if (unique.length) console.warn(`⚠ À compléter dans site.config.json avant la mise en vente : ${unique.join(', ')}`);
