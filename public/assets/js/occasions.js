// Données partagées : navigateur (éditeur, rendu) + serveur (validation) + script de génération des pages SEO.

export const THEMES = {
  rose:  { label: 'Rose tendre', bg: '#fff6f8', ink: '#3b1f2b', accent: '#d63c72', soft: '#ffe3ec' },
  nuit:  { label: 'Nuit étoilée', bg: '#17142a', ink: '#f4eefc', accent: '#f4a6c6', soft: '#2a2545' },
  or:    { label: 'Doré', bg: '#fffaf1', ink: '#3a2e1a', accent: '#b07a1f', soft: '#f8e9c6' },
  lilas: { label: 'Lilas', bg: '#faf7ff', ink: '#2f2440', accent: '#7c4fc0', soft: '#ece2fb' },
  bleu:  { label: 'Bleu', bg: '#f5f9ff', ink: '#1b2a3f', accent: '#2d6cb5', soft: '#dde9f8' },
  sauge: { label: 'Sauge', bg: '#f6faf6', ink: '#203126', accent: '#4d7f5c', soft: '#dcebdf' },
  noel:  { label: 'Noël', bg: '#fff8f2', ink: '#33170f', accent: '#b8322a', soft: '#f6ddd2' },
  ciel:  { label: 'Ciel', bg: '#f4fbfc', ink: '#173238', accent: '#1f8a99', soft: '#d6eff2' },
};

export const OCCASIONS = [
  {
    id: 'saint-valentin', cta: 'Créer ma page de Saint-Valentin', label: 'Saint-Valentin', emoji: '💘', theme: 'rose',
    seoTitle: 'Cadeau Saint-Valentin personnalisé : une page d’amour avec vos photos',
    h1: 'Une page d’amour rien que pour elle (ou lui) pour la Saint-Valentin',
    lead: 'Vos photos, votre histoire, une lettre et votre chanson réunies sur une page secrète à offrir par lien ou QR code. Prête en 10 minutes, même le 14 février au soir.',
    defaults: { title: 'Joyeuse Saint-Valentin', intro: 'J’ai préparé quelque chose rien que pour toi…', dateLabel: 'Ensemble depuis', finalMessage: 'Je t’aime. Aujourd’hui, demain et tous les jours d’après.' },
    reasonsTitle: 'Ce que j’aime chez toi',
    timelineTitle: 'Notre histoire',
    letterIdeas: [
      'Je me souviens encore de la première fois que je t’ai vu(e)…',
      'Il y a des jours où je me demande comment j’ai eu autant de chance…',
      'Cette année avec toi, c’était…',
    ],
    reasonIdeas: ['Ton rire quand tu essaies de rester sérieux(se)', 'La façon dont tu me regardes', 'Tes câlins du matin', 'Ta patience avec moi', 'Ta façon de rendre les dimanches parfaits'],
    tips: [
      'Commence par un souvenir précis (un lieu, une date, une phrase) : c’est ce qui touche le plus.',
      'Choisis 5 à 8 photos qui racontent une progression : première sortie, voyages, quotidien.',
      'Ajoute la chanson de votre premier slow ou de votre premier voyage.',
      'Offre la page au moment du dîner : montre le QR code sur une carte ou envoie le lien à minuit pile.',
    ],
    faq: [
      ['Est-ce que je peux l’offrir à la dernière minute ?', 'Oui. La page est en ligne dès le paiement validé : tu reçois un lien et un QR code à imprimer ou à envoyer.'],
      ['Est-ce qu’on verra que c’est payant ?', 'Non. La page ne montre ni prix ni publicité, seulement une petite mention discrète en bas de page.'],
    ],
  },
  {
    id: 'anniversaire-de-couple', cta: 'Créer notre page d’anniversaire', label: 'Anniversaire de couple', emoji: '💞', theme: 'nuit',
    seoTitle: 'Cadeau anniversaire de couple original : une page souvenir personnalisée',
    h1: 'Un cadeau d’anniversaire de couple qui raconte votre histoire',
    lead: '1 an, 5 ans, 10 ans ensemble : une page avec votre frise de souvenirs, vos photos, un compteur des jours passés ensemble et une lettre.',
    defaults: { title: 'Joyeux anniversaire, mon amour', intro: 'Ouvre-moi, c’est notre histoire…', dateLabel: 'Ensemble depuis', finalMessage: 'Vivement toutes les années qui nous attendent.' },
    reasonsTitle: 'Ce que tu m’as apporté',
    timelineTitle: 'Nos plus beaux moments',
    letterIdeas: [
      'Il y a exactement … jours, tu es entré(e) dans ma vie…',
      'Si on m’avait dit, le jour de notre rencontre, que…',
      'Merci pour chaque matin, chaque fou rire et même chaque dispute…',
    ],
    reasonIdeas: ['Notre premier voyage', 'Le jour où on a emménagé', 'Tes surprises', 'Ta façon de me rassurer', 'Nos soirées à refaire le monde'],
    tips: [
      'Le compteur affiche automatiquement le nombre de jours passés ensemble depuis la date choisie.',
      'Remplis la frise avec 4 à 8 dates clés : rencontre, premier baiser, premier voyage, emménagement…',
      'Glisse une photo de chaque année pour montrer le chemin parcouru.',
    ],
    faq: [
      ['Quelle date mettre ?', 'Celle que vous fêtez : rencontre, mise en couple ou mariage. Le libellé est modifiable (« Mariés depuis », « Ensemble depuis »…).'],
    ],
  },
  {
    id: 'anniversaire', cta: 'Créer sa carte d’anniversaire', label: 'Anniversaire', emoji: '🎂', theme: 'or',
    seoTitle: 'Carte d’anniversaire en ligne personnalisée avec photos et musique',
    h1: 'Une carte d’anniversaire en ligne, avec photos, souvenirs et musique',
    lead: 'Plus personnelle qu’une carte, plus durable qu’un message : une page à son nom avec tes photos, une lettre et sa chanson préférée.',
    defaults: { title: 'Joyeux anniversaire !', intro: 'Une petite surprise pour ton grand jour…', dateLabel: 'Né(e) le', finalMessage: 'Que cette nouvelle année te ressemble : pleine de rires et de belles surprises.' },
    reasonsTitle: 'Ce qu’on aime chez toi',
    timelineTitle: 'Tes grands moments',
    letterIdeas: [
      'Pour tes … ans, j’ai voulu te dire ce que je ne dis pas assez…',
      'Tu te souviens de…',
      'Une année de plus et toujours aussi…',
    ],
    reasonIdeas: ['Ta générosité', 'Ton humour imbattable', 'Tes playlists de voiture', 'Tu es toujours là quand il faut'],
    tips: [
      'Pour un anniversaire rond (30, 40, 50 ans), mets une photo par décennie dans la frise.',
      'Avec la date de naissance, la page affiche le nombre de jours vécus : effet garanti.',
    ],
    faq: [
      ['Peut-on écrire à plusieurs ?', 'Oui : rassemble les messages de chacun dans la lettre ou dans la liste « Ce qu’on aime chez toi », et signez « Toute la famille ».'],
    ],
  },
  {
    id: 'fete-des-meres', cta: 'Créer sa page de fête des mères', label: 'Fête des mères', emoji: '💐', theme: 'lilas',
    seoTitle: 'Cadeau fête des mères personnalisé : une page souvenir avec photos',
    h1: 'Pour la fête des mères, offre-lui vos souvenirs',
    lead: 'Les photos de famille, les moments qui comptent et les mots qu’on n’ose pas dire en face : une page à garder, à relire et à partager avec toute la famille. Fête des mères 2027 : dimanche 30 mai.',
    defaults: { title: 'Bonne fête, maman', intro: 'Maman, on t’a préparé une surprise…', dateLabel: '', finalMessage: 'Merci pour tout. On t’aime.' },
    reasonsTitle: 'Merci maman, pour…',
    timelineTitle: 'Nos souvenirs avec toi',
    letterIdeas: [
      'Maman, je ne te le dis pas assez, alors je te l’écris…',
      'Quand j’étais petit(e), tu…',
      'Aujourd’hui que je suis grand(e), je comprends…',
    ],
    reasonIdeas: ['Tes gâteaux du dimanche', 'Ta patience (infinie)', 'Tes conseils, même quand je ne les écoutais pas', 'Ta voix au téléphone'],
    tips: [
      'Retrouve de vieilles photos : une photo d’enfance à côté d’une photo récente, c’est imbattable.',
      'Fais participer frères et sœurs : chacun ajoute sa raison dans la liste « Merci maman, pour… ».',
    ],
    faq: [
      ['Ma mère n’est pas à l’aise avec Internet, comment lui offrir ?', 'Imprime la carte avec le QR code (fournie après paiement) : il suffit de la scanner avec l’appareil photo du téléphone.'],
    ],
  },
  {
    id: 'fete-des-peres', cta: 'Créer sa page de fête des pères', label: 'Fête des pères', emoji: '👔', theme: 'bleu',
    seoTitle: 'Cadeau fête des pères original et personnalisé : une page souvenir',
    h1: 'Un cadeau de fête des pères qui ne finira pas au fond d’un tiroir',
    lead: 'Photos, souvenirs, sa chanson et tes mots : une page rien que pour lui, à offrir par QR code ou par lien. Fête des pères 2027 : dimanche 20 juin.',
    defaults: { title: 'Bonne fête, papa', intro: 'Papa, cette page est pour toi…', dateLabel: '', finalMessage: 'Merci d’être toi. On t’aime.' },
    reasonsTitle: 'Merci papa, pour…',
    timelineTitle: 'Nos souvenirs avec toi',
    letterIdeas: [
      'Papa, on ne se dit pas souvent ces choses-là, alors…',
      'Tu m’as appris à…',
      'Je me souviens de nos…',
    ],
    reasonIdeas: ['Tes blagues (même les mauvaises)', 'Nos matchs ensemble', 'Tes conseils de bricolage', 'Les trajets en voiture'],
    tips: ['Ajoute la chanson qu’il met toujours en voiture.', 'Une photo de toi enfant sur ses épaules fera mouche.'],
    faq: [],
  },
  {
    id: 'fete-des-grands-meres', cta: 'Créer la page de mamie', label: 'Fête des grands-mères', emoji: '🌷', theme: 'sauge',
    seoTitle: 'Cadeau fête des grands-mères personnalisé : une page avec les photos des petits-enfants',
    h1: 'Pour la fête des grands-mères, une page pleine de petits-enfants',
    lead: 'Les photos des petits-enfants, leurs messages et vos souvenirs réunis sur une page qu’elle pourra ouvrir d’un simple scan. Fête des grands-mères 2027 : dimanche 7 mars.',
    defaults: { title: 'Bonne fête, mamie', intro: 'Mamie, regarde ce qu’on t’a préparé…', dateLabel: '', finalMessage: 'Gros bisous de tous tes petits-enfants.' },
    reasonsTitle: 'On t’aime parce que…',
    timelineTitle: 'Nos souvenirs avec toi',
    letterIdeas: ['Mamie, chez toi on se sent toujours…', 'Tu te souviens quand on…'],
    reasonIdeas: ['Tes crêpes', 'Tes histoires d’autrefois', 'Les vacances chez toi', 'Tes câlins'],
    tips: ['Imprime la carte QR et glisse-la dans une enveloppe avec un dessin des enfants.'],
    faq: [],
  },
  {
    id: 'noel', cta: 'Créer ma page de Noël', label: 'Noël', emoji: '🎄', theme: 'noel',
    seoTitle: 'Cadeau de Noël personnalisé de dernière minute : une page avec tes photos',
    h1: 'Un cadeau de Noël personnel, même à la dernière minute',
    lead: 'L’année en photos, vos souvenirs et un mot sincère : une page à glisser sous le sapin grâce à une carte QR code imprimable.',
    defaults: { title: 'Joyeux Noël', intro: 'Avant d’ouvrir les autres cadeaux, ouvre celui-ci…', dateLabel: '', finalMessage: 'Joyeux Noël et vivement l’année prochaine ensemble.' },
    reasonsTitle: 'Ce que cette année m’a apporté',
    timelineTitle: 'Notre année',
    letterIdeas: ['Cette année a été…', 'Mon plus beau cadeau, c’est…'],
    reasonIdeas: ['Nos vacances d’été', 'Tes encouragements', 'Nos soirées jeux', 'Ton soutien dans les moments durs'],
    tips: ['Fais une frise « mois par mois » de l’année écoulée.', 'Imprime la carte QR et glisse-la dans une boule de Noël ou sous le sapin.'],
    faq: [['Puis-je l’offrir le 24 au soir ?', 'Oui, la page est disponible immédiatement après le paiement.']],
  },
  {
    id: 'demande', cta: 'Créer ma page de demande', label: 'Demande (mariage, témoin, parrain…)', emoji: '💍', theme: 'or',
    seoTitle: 'Demande témoin, parrain ou demande en mariage originale : une page surprise',
    h1: 'Une demande originale : témoin, parrain, marraine ou en mariage',
    lead: 'Une page qui raconte pourquoi c’est elle ou lui, avec vos photos, avant de poser LA question. Une question secrète peut même ajouter du suspense à l’ouverture.',
    defaults: { title: 'J’ai une question à te poser…', intro: 'Lis jusqu’au bout…', dateLabel: 'On se connaît depuis', finalMessage: 'Alors… tu veux bien ?' },
    reasonsTitle: 'Pourquoi c’est toi',
    timelineTitle: 'Notre histoire',
    letterIdeas: ['Depuis le jour où on s’est rencontrés, tu es…', 'Il y a une question que je voulais te poser d’une façon spéciale…'],
    reasonIdeas: ['Tu étais là dans tous les moments importants', 'Tu me connais mieux que personne', 'On a grandi ensemble'],
    tips: ['Garde la question pour le message final : la page se lit comme un suspense.', 'Ajoute une question secrète dont seul(e) le/la destinataire connaît la réponse.'],
    faq: [],
  },
  {
    id: 'remerciements', cta: 'Créer ma page de remerciements', label: 'Merci (maîtresse, collègue, départ)', emoji: '🙏', theme: 'ciel',
    seoTitle: 'Cadeau de fin d’année maîtresse ou pot de départ : une page de remerciements',
    h1: 'Dire merci autrement : maîtresse, nounou, collègue, départ en retraite',
    lead: 'Rassemble photos et messages de toute la classe ou de toute l’équipe sur une seule page, à offrir le dernier jour.',
    defaults: { title: 'Merci pour tout !', intro: 'On voulait te dire quelque chose…', dateLabel: '', finalMessage: 'Merci, et à bientôt !' },
    reasonsTitle: 'Merci pour…',
    timelineTitle: 'Nos moments ensemble',
    letterIdeas: ['Cette année avec vous a été…', 'Après toutes ces années ensemble…'],
    reasonIdeas: ['Votre patience', 'Les sorties scolaires', 'Votre bonne humeur', 'Vos conseils'],
    tips: ['Pour une classe : un message par enfant dans la liste « Merci pour… ».', 'Évite les photos d’enfants identifiables si tous les parents n’ont pas donné leur accord.'],
    faq: [],
  },
];

export const OCCASION_IDS = OCCASIONS.map((o) => o.id);
export const THEME_IDS = Object.keys(THEMES);

export function getOccasion(id) {
  return OCCASIONS.find((o) => o.id === id) || OCCASIONS[0];
}
