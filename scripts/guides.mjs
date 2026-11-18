// Guides d'idées (référencement) : des contenus utiles qui répondent à ce que les gens cherchent sur Google,
// chacun relié à la page occasion correspondante. Publiés sous /idees/<slug>.
// Format d'une section : { h2, p: [paragraphes], list: [puces], quotes: [exemples en italique] }.

export const GUIDES = [
  {
    slug: 'lettre-d-amour',
    emoji: '💌', kind: 'textes',
    occasion: 'saint-valentin',
    date: '2026-11-18',
    title: 'Comment écrire une lettre d’amour : conseils et 12 exemples',
    description: 'Écrire une lettre d’amour sans être écrivain : la méthode en 5 étapes, les erreurs à éviter et 12 exemples de phrases à reprendre pour la Saint-Valentin ou un anniversaire.',
    h1: 'Comment écrire une lettre d’amour',
    intro: 'Une lettre d’amour n’a pas besoin d’être longue ni parfaite. Ce qui touche, c’est qu’elle soit vraie et précise. Voici une méthode simple en 5 étapes, puis des exemples de phrases pour te lancer.',
    sections: [
      { h2: 'La méthode en 5 étapes', list: [
        'Commence par un souvenir précis : un lieu, une date, une phrase. « Le 3 juin, sur le quai de la gare… » touche plus que « depuis qu’on se connaît ».',
        'Dis ce que l’autre a changé dans ta vie, avec un exemple concret.',
        'Cite 2 ou 3 petites choses que tu aimes chez elle ou lui : les détails du quotidien sont les plus forts.',
        'Parle de l’avenir : un projet, un voyage, une promesse simple.',
        'Termine par une phrase courte et sincère, celle que tu dirais en la ou le regardant dans les yeux.',
      ] },
      { h2: 'Les erreurs à éviter', list: [
        'Les phrases toutes faites copiées d’internet : on les reconnaît tout de suite. Inspire-toi, mais réécris avec tes mots.',
        'Une lettre trop longue : 150 à 250 mots suffisent largement.',
        'Les reproches déguisés (« même si tu oublies toujours… ») : ce n’est pas le moment.',
        'Attendre l’inspiration : écris un premier jet en 10 minutes, puis relis le lendemain.',
      ] },
      { h2: '12 exemples de phrases pour commencer ou finir ta lettre', quotes: [
        'Je me souviens encore de la première fois que je t’ai vu, et je crois que tout a commencé là.',
        'Il y a des jours où je me demande comment j’ai eu autant de chance.',
        'Avec toi, même les dimanches pluvieux sont devenus mes préférés.',
        'Tu ne le sais peut-être pas, mais tu me rends meilleur chaque jour.',
        'J’aime ta façon de rire quand tu essaies de garder ton sérieux.',
        'Mon endroit préféré au monde, c’est à côté de toi.',
        'Je ne te le dis pas assez, alors je l’écris : merci d’être toi.',
        'Cette année avec toi, c’était mon plus beau voyage.',
        'Si je devais tout recommencer, je te choisirais encore, sans hésiter.',
        'Je n’ai pas besoin d’un grand jour pour t’aimer, mais j’en profite pour te le dire.',
        'Je t’aime. Aujourd’hui, demain et tous les jours d’après.',
        'Garde cette lettre : je te promets d’en écrire d’autres.',
      ] },
      { h2: 'Comment l’offrir pour qu’elle marque', p: [
        'Une lettre papier glissée sous l’oreiller fonctionne toujours. Tu peux aussi aller plus loin : réunir la lettre, vos photos, vos souvenirs et votre chanson sur une page secrète qui s’ouvre comme une enveloppe, à offrir par lien ou par QR code. Le jour J, il suffit de l’envoyer à minuit pile ou de glisser la carte QR dans un livre.',
      ] },
    ],
  },
  {
    slug: 'raisons-pour-lesquelles-je-t-aime',
    emoji: '💞', kind: 'textes',
    occasion: 'saint-valentin',
    date: '2026-11-18',
    title: '50 raisons pour lesquelles je t’aime : idées pour ton couple',
    description: '50 idées de « raisons pour lesquelles je t’aime » à personnaliser : petites attentions, caractère, souvenirs. Pour une lettre, une boîte à mots ou une page cadeau.',
    h1: '50 raisons pour lesquelles je t’aime (à personnaliser)',
    intro: 'La liste des « raisons pour lesquelles je t’aime » est un cadeau simple et très touchant. L’astuce : partir de ces idées, puis les rendre précises avec un détail que vous seuls connaissez.',
    sections: [
      { h2: 'Son caractère', list: [
        'Ta patience, même quand je suis insupportable.', 'Ta façon de toujours voir le bon côté des choses.', 'Ton honnêteté, même quand c’est difficile.', 'Ta générosité avec tout le monde.', 'Ton courage face aux mauvaises nouvelles.', 'Ta curiosité pour tout.', 'Ton humour un peu absurde.', 'Ta douceur.', 'Ta façon de défendre ceux que tu aimes.', 'Ton calme quand tout va mal.',
      ] },
      { h2: 'Les petits gestes du quotidien', list: [
        'Le café que tu me prépares sans que je demande.', 'Tes messages au milieu de la journée.', 'Ta main dans la mienne au cinéma.', 'La couverture que tu remontes sur moi.', 'Tes câlins du matin.', 'Ta façon de chanter faux sous la douche.', 'Les petits mots que tu laisses sur le frigo.', 'Le dernier carré de chocolat que tu me laisses.', 'Ta façon de m’attendre pour regarder la suite de la série.', 'Ton « fais attention à toi » avant chaque départ.',
      ] },
      { h2: 'Ce que tu m’apportes', list: [
        'Tu me fais rire comme personne.', 'Avec toi, je me sens chez moi partout.', 'Tu crois en moi plus que moi.', 'Tu m’as appris à prendre mon temps.', 'Tu me donnes envie de m’améliorer.', 'Tu rends les dimanches parfaits.', 'Tu me rassures sans rien dire.', 'Tu me fais découvrir des choses que je n’aurais jamais essayées.', 'Tu acceptes mes défauts.', 'Tu es aussi mon meilleur ami.',
      ] },
      { h2: 'Nos souvenirs', list: [
        'Notre premier rendez-vous un peu raté.', 'Ce voyage où tout est allé de travers et où on a tant ri.', 'La première fois que tu m’as présenté à tes parents.', 'Notre chanson, qui passe toujours au bon moment.', 'Nos fous rires en voiture.', 'La nuit où on a refait le monde jusqu’à 4 h.', 'Notre premier appartement, et ses cartons.', 'Ce plat raté qu’on a fini par manger quand même.', 'Les week-ends sans réveil.', 'Toutes les fois où tu étais là au bon moment.',
      ] },
      { h2: 'Pour la suite', list: [
        'Parce que j’ai encore mille choses à vivre avec toi.', 'Parce que je veux voyager partout avec toi.', 'Parce que j’ai hâte de vieillir à tes côtés.', 'Parce que chaque jour avec toi est une bonne journée.', 'Parce que c’est toi, tout simplement.', 'Parce que tu me donnes envie de construire.', 'Parce que tu es la première personne à qui je veux tout raconter.', 'Parce que tu tiens tes promesses.', 'Parce que je ne m’ennuie jamais avec toi.', 'Parce que je t’aime un peu plus chaque année.',
      ] },
      { h2: 'Comment les offrir', p: [
        'Choisis-en 6 à 12 et rends-les précises (« ton rire » devient « ton rire quand tu te moques de mes chaussettes »). Tu peux les écrire sur des petits papiers dans un bocal, ou les transformer en cartes à retourner sur une page cadeau : chaque carte s’ouvre avec une petite animation, et la personne les découvre une à une.',
      ] },
    ],
  },
  {
    slug: 'idees-cadeau-saint-valentin',
    emoji: '🎁', kind: 'cadeaux',
    occasion: 'saint-valentin',
    date: '2026-11-18',
    title: 'Idées cadeau Saint-Valentin originales et pas chères (2027)',
    description: 'Idées de cadeaux de Saint-Valentin originaux, personnalisés et à petit prix, y compris de dernière minute pour le 14 février 2027.',
    h1: 'Idées cadeau originales pour la Saint-Valentin, même à petit budget',
    intro: 'La Saint-Valentin 2027 tombe un dimanche 14 février. Pas besoin de dépenser beaucoup : les cadeaux qui marquent sont ceux qui montrent que tu as pensé à l’autre. Voici des idées classées par budget.',
    sections: [
      { h2: 'Notre sélection de cadeaux', gifts: [
      { emoji: '📸', name: 'Un appareil photo instantané', why: 'Pour remplir votre prochain album de vraies photos, tout de suite.', query: 'appareil photo instantané', budget: 'Moyen budget' },
      { emoji: '💍', name: 'Un bijou gravé', why: 'Vos initiales ou la date de votre rencontre, à porter tous les jours.', query: 'bracelet gravé personnalisé couple', budget: 'Moyen budget' },
      { emoji: '🕯️', name: 'Un coffret bougies parfumées', why: 'Pour une soirée cocooning à deux, ambiance garantie.', query: 'coffret bougies parfumées', budget: 'Petit budget' },
      { emoji: '🧩', name: 'Un puzzle avec votre photo', why: 'Une soirée à reconstituer votre plus beau souvenir.', query: 'puzzle photo personnalisé', budget: 'Petit budget' },
      { emoji: '💆', name: 'Un coffret massage en duo', why: 'Un moment de détente à partager.', query: 'coffret cadeau massage duo', budget: 'Gros budget' },
      { emoji: '📖', name: 'Un carnet « Notre histoire » à remplir', why: 'Pour écrire vos souvenirs au fil des années.', query: 'carnet couple à remplir', budget: 'Petit budget' },
      ] },
      { h2: 'Moins de 10 €', list: [
        'Une lettre d’amour manuscrite (voir notre guide pour l’écrire).',
        'Un bocal de « raisons pour lesquelles je t’aime ».',
        'Un dîner fait maison avec le plat de votre premier rendez-vous.',
        'Une playlist de vos chansons, avec un mot pour chacune.',
        'Une page d’amour personnalisée en ligne : lettre, photos, souvenirs et votre chanson, offerte par lien ou QR code.',
      ] },
      { h2: 'Entre 10 et 50 €', list: [
        'Un album photo de votre année.', 'Une séance de massage en duo.', 'Une sortie surprise : concert, escape game, cours de cuisine.', 'Un bijou gravé d’une date qui compte pour vous.',
      ] },
      { h2: 'Les idées de dernière minute', p: [
        'Le 14 février au soir, il reste des options : une réservation dans un restaurant qui accepte encore, un bouquet du marché, ou un cadeau numérique prêt immédiatement. Une page cadeau se crée en 10 minutes depuis le téléphone et peut être envoyée à minuit pile.',
      ] },
      { h2: 'Un dernier conseil', p: [
        'Quel que soit le cadeau, ajoute quelques lignes écrites. C’est souvent ce que l’on garde le plus longtemps, bien après les fleurs.',
      ] },
    ],
  },
  {
    slug: 'texte-fete-des-meres',
    emoji: '💐', kind: 'textes',
    occasion: 'fete-des-meres',
    date: '2026-11-18',
    title: 'Texte pour la fête des mères : 25 messages pour maman (2027)',
    description: 'Des textes et messages pour souhaiter une bonne fête à ta maman le 30 mai 2027 : touchants, drôles ou courts, à écrire sur une carte ou une page cadeau.',
    h1: 'Textes et messages pour la fête des mères',
    intro: 'En France, la fête des mères 2027 aura lieu le dimanche 30 mai. Voici des messages à reprendre ou à adapter, du plus court au plus émouvant. Pense à ajouter un souvenir qui n’appartient qu’à vous deux.',
    sections: [
      { h2: 'Messages courts', quotes: [
        'Bonne fête à la meilleure maman du monde. Merci pour tout.', 'Maman, tu es mon premier amour et mon plus grand exemple.', 'Merci d’avoir toujours cru en moi. Je t’aime.', 'Une maman comme toi, ça ne se remplace pas. Bonne fête !', 'Pour toutes les fois où je ne t’ai pas dit merci : merci.',
      ] },
      { h2: 'Messages touchants', quotes: [
        'Maman, je ne te l’ai pas assez dit : tout ce que je suis, je te le dois en partie.', 'Je repense aux goûters après l’école, à tes histoires du soir, à ta main sur mon front quand j’étais malade. Merci pour cette enfance.', 'En grandissant, je comprends un peu plus chaque année tout ce que tu as fait pour nous.', 'Tu as toujours été là, sans jamais rien demander en retour. Aujourd’hui, c’est à moi de te dire combien je t’aime.', 'Si j’ai appris le courage, la patience et la générosité, c’est en te regardant faire.',
      ] },
      { h2: 'Messages drôles', quotes: [
        'Merci de m’avoir supporté pendant mon adolescence. Bonne fête maman !', 'Bonne fête à celle qui savait toujours quand je mentais. Comment tu faisais ?', 'Tu avais raison pour le manteau. Et pour tout le reste aussi.', 'Maman, la preuve que tu es la meilleure : je suis là, et je ne m’en sors pas si mal.',
      ] },
      { h2: 'Idées pour « Merci maman, pour… »', list: [
        'les crêpes du dimanche', 'tes conseils (même ceux que je n’ai pas suivis)', 'les trajets en voiture à refaire le monde', 'ta patience infinie', 'avoir toujours une place pour moi à table',
      ] },
      { h2: 'Comment lui offrir', p: [
        'Écris ton message sur une carte, ou réunis-le avec des photos de famille, une frise de souvenirs et sa chanson préférée sur une page à ouvrir comme une enveloppe. Toute la famille peut même y ajouter un mot grâce à la carte de groupe.',
      ] },
    ],
  },
  {
    slug: 'idees-cadeau-fete-des-meres',
    emoji: '🌸', kind: 'cadeaux',
    occasion: 'fete-des-meres',
    date: '2026-11-18',
    title: 'Idées cadeau fête des mères originales (2027) : 15 idées pour maman',
    description: 'Idées de cadeaux originaux pour la fête des mères du 30 mai 2027 : personnalisés, bien-être, souvenirs de famille, à tous les budgets.',
    h1: 'Idées cadeau originales pour la fête des mères',
    intro: 'La fête des mères 2027 a lieu le dimanche 30 mai. Le cadeau qui fait le plus plaisir à une maman, c’est souvent celui qui lui rappelle combien elle compte : un souvenir, un mot, un moment partagé. Voici nos idées, du fait-maison au plus gâté.',
    sections: [
      { h2: 'Un cadeau de toute la famille', p: [
        'Réunis un mot de chaque enfant et petit-enfant, des photos de famille, une frise de vos souvenirs et sa chanson préférée sur une page qui s’ouvre comme une enveloppe. Avec la carte de groupe, chacun écrit son message depuis son téléphone, même à distance.',
      ] },
      { h2: 'Notre sélection de cadeaux', gifts: [
      { emoji: '🌸', name: 'Un coffret de soins', why: 'Un moment rien que pour elle, à la maison.', query: 'coffret soin femme', budget: 'Moyen budget' },
      { emoji: '📷', name: 'Un livre photo de famille', why: 'Vos plus belles photos, de l’enfance à aujourd’hui.', query: 'livre photo personnalisé', budget: 'Moyen budget' },
      { emoji: '🪴', name: 'Une jolie plante d’intérieur', why: 'Un cadeau qui dure et lui fera penser à vous.', query: 'plante intérieur cadeau', budget: 'Petit budget' },
      { emoji: '☕', name: 'Un mug personnalisé', why: 'Avec un prénom, une photo ou un petit mot.', query: 'mug personnalisé maman', budget: 'Petit budget' },
      { emoji: '💐', name: 'Un bouquet de fleurs séchées', why: 'Le charme des fleurs, sans faner.', query: 'bouquet fleurs séchées', budget: 'Petit budget' },
      { emoji: '👜', name: 'Un joli sac ou une pochette', why: 'Un accessoire qu’elle ne s’offrirait pas.', query: 'pochette femme cuir', budget: 'Gros budget' },
      ] },
      { h2: 'Les cadeaux faits maison', list: [
        'Un livre de recettes de famille, écrit à la main.', 'Un bocal de « Merci maman, pour… » avec un petit papier par souvenir.', 'Un petit-déjeuner au lit préparé par toute la famille.', 'Une journée où c’est elle qui choisit tout le programme.',
      ] },
      { h2: 'Ajoute toujours quelques mots', p: [
        'Quel que soit le cadeau, accompagne-le d’un message : c’est ce qu’elle relira. Besoin d’idées ? Voir nos 25 textes pour la fête des mères.',
      ] },
    ],
  },
  {
    slug: 'texte-anniversaire-de-couple',
    emoji: '🥂', kind: 'textes',
    occasion: 'anniversaire-de-couple',
    date: '2026-11-18',
    title: 'Texte d’anniversaire de couple : messages pour 1 an, 5 ans, 10 ans…',
    description: 'Des textes d’anniversaire de couple et de rencontre à adapter : 1 an, 2 ans, 5 ans, 10 ans ensemble. Messages romantiques, simples ou drôles.',
    h1: 'Textes pour un anniversaire de couple',
    intro: 'Un an, cinq ans, dix ans ensemble : chaque anniversaire de rencontre est l’occasion de regarder le chemin parcouru. Voici des messages à adapter selon votre histoire.',
    sections: [
      { h2: 'Pour 1 an ensemble', quotes: [
        'Il y a un an, je ne savais pas encore que tu allais devenir ma personne préférée.', '365 jours, et je ne me lasse toujours pas de toi.', 'Notre première année, c’était le début de la plus belle histoire que je connaisse.',
      ] },
      { h2: 'Pour 2 à 5 ans', quotes: [
        'On a déménagé, voyagé, ri, parfois pleuré… et je recommencerais tout avec toi.', 'Plus le temps passe, plus je suis sûr de mon choix.', 'Merci pour ces années où tu as rendu l’ordinaire extraordinaire.',
      ] },
      { h2: 'Pour 10 ans et plus', quotes: [
        'Dix ans, et tu me fais toujours le même effet qu’au premier jour.', 'On a grandi ensemble, et je t’aime encore plus qu’au début.', 'Notre histoire est mon plus beau souvenir, et j’ai hâte d’écrire la suite.',
      ] },
      { h2: 'Idées pour fêter l’anniversaire', list: [
        'Retourner sur le lieu de votre premier rendez-vous.', 'Refaire la photo de votre première photo ensemble.', 'Créer une frise de vos moments clés, année après année.', 'Afficher un compteur : « ensemble depuis 1 826 jours ».', 'Offrir une page souvenir qui réunit lettre, photos et votre chanson.',
      ] },
    ],
  },
  {
    slug: 'message-anniversaire',
    emoji: '🎂', kind: 'textes',
    occasion: 'anniversaire',
    date: '2026-11-18',
    title: 'Message d’anniversaire original : 30 idées pour un ami, ta sœur, ton frère…',
    description: '30 messages d’anniversaire originaux, drôles ou touchants, pour un ami, une sœur, un frère, un collègue. Plus l’idée d’une carte collective où chacun écrit son mot.',
    h1: 'Messages d’anniversaire originaux (et pas tout faits)',
    intro: 'Un simple « joyeux anniversaire » fait plaisir, mais un message personnel marque vraiment. Voici des idées classées par personne, à personnaliser avec un souvenir commun.',
    sections: [
      { h2: 'Pour un ami ou une amie', quotes: [
        'Joyeux anniversaire à la personne qui connaît tous mes secrets et ne les utilise (presque) jamais contre moi.', 'Encore une année de fous rires, de conseils douteux et de soirées trop longues. Vivement la suivante !', 'Tu es la famille que j’ai choisie. Joyeux anniversaire.',
      ] },
      { h2: 'Pour une sœur ou un frère', quotes: [
        'Joyeux anniversaire à mon tout premier colocataire, rival et complice.', 'On s’est disputé la salle de bain pendant des années, mais je ne t’échangerais pour rien au monde.', 'Merci d’avoir été mon modèle (et mon cobaye).',
      ] },
      { h2: 'Pour un collègue', quotes: [
        'Joyeux anniversaire ! Merci de rendre les lundis plus supportables.', 'Toute l’équipe te souhaite une très belle année, au bureau et surtout en dehors.',
      ] },
      { h2: 'Pour un anniversaire « rond » (30, 40, 50 ans…)', quotes: [
        '30 ans : l’âge parfait pour savoir ce qu’on veut, et oser le faire.', '40 ans, et toujours la même énergie. On se demande comment tu fais.', '50 ans de souvenirs, et autant à venir. Joyeux anniversaire !',
      ] },
      { h2: 'L’idée qui fait la différence : la carte collective', p: [
        'Pour un anniversaire important, demande à chaque proche d’écrire un mot. Avec une page cadeau et sa carte de groupe, tu partages un lien d’invitation (groupe WhatsApp, e-mail…) et chacun ajoute son message, sans voir la page. Le jour J, la personne découvre tous les mots réunis, avec les photos et sa chanson.',
      ] },
    ],
  },
  {
    slug: 'cadeau-noel-derniere-minute',
    emoji: '🎄', kind: 'cadeaux',
    occasion: 'noel',
    date: '2026-11-18',
    title: 'Cadeau de Noël de dernière minute : 15 idées simples',
    description: '15 idées de cadeaux de Noël de dernière minute, personnelles et faciles : à faire soi-même, à offrir le 24 au soir ou à envoyer par message.',
    h1: 'Cadeau de Noël de dernière minute : 15 idées',
    intro: 'Le 24 décembre approche et il te manque un cadeau ? Voici des idées rapides qui montrent que tu as pensé à la personne, et non que tu as couru à la dernière boutique ouverte.',
    sections: [
      { h2: 'Des cadeaux livrés vite', p: ['Pour les commandes de dernière minute, vérifie la date de livraison indiquée avant d’acheter, ou choisis le retrait en magasin.'], gifts: [
      { emoji: '🎧', name: 'Des écouteurs sans fil', why: 'Le cadeau utile qui plaît presque toujours.', query: 'écouteurs sans fil', budget: 'Moyen budget' },
      { emoji: '📚', name: 'Un beau livre', why: 'Choisis-le pour elle ou lui, avec une dédicace sur la première page.', query: 'beau livre cadeau', budget: 'Petit budget' },
      { emoji: '🧣', name: 'Une écharpe douce', why: 'Un classique de l’hiver qui fait toujours plaisir.', query: 'écharpe femme laine douce', budget: 'Petit budget' },
      { emoji: '🎲', name: 'Un jeu de société à deux', why: 'Pour les soirées d’hiver, sans écran.', query: 'jeu de société pour 2 joueurs', budget: 'Petit budget' },
      { emoji: '🫖', name: 'Un coffret de thés de Noël', why: 'Une pause gourmande, à offrir aussi aux collègues.', query: 'coffret thé noël', budget: 'Petit budget' },
      { emoji: '🖼️', name: 'Un cadre photo numérique', why: 'Toutes vos photos de l’année, qui défilent dans le salon.', query: 'cadre photo numérique wifi', budget: 'Gros budget' },
      ] },
      { h2: 'À faire soi-même en moins d’une heure', list: [
        'Une lettre de fin d’année : ce que cette année avec elle ou lui t’a apporté.', 'Des bons à échanger : un petit-déjeuner au lit, une soirée sans téléphone, une journée où tu choisis tout.', 'Un pot de biscuits maison avec une étiquette personnalisée.', 'Une playlist de l’année avec un mot pour chaque chanson.', 'Un cadre avec une photo imprimée en boutique photo minute.',
      ] },
      { h2: 'À offrir sans se déplacer', list: [
        'Une page de Noël personnalisée : lettre, photos de l’année et votre chanson, envoyée par lien ou glissée en QR code dans une enveloppe sous le sapin.', 'Une expérience à réserver en ligne : massage, atelier, concert.', 'Un abonnement à quelque chose qu’elle ou il aime (magazine, musique, cours).', 'Un don à une association qui lui tient à cœur, avec un mot.',
      ] },
      { h2: 'Petits budgets', list: [
        'Un livre choisi pour elle ou lui, avec une dédicace sur la première page.', 'Un bocal de souvenirs de l’année.', 'Une carte à gratter maison avec une surprise.', 'Une boîte à souvenirs avec tickets, photos et petits mots.', 'Un calendrier photo de l’année qui commence.', 'Une recette de famille écrite à la main.',
      ] },
      { h2: 'L’astuce de présentation', p: [
        'Un cadeau numérique peut se mettre sous le sapin : imprime la carte avec le QR code, glisse-la dans une enveloppe, et laisse la personne la scanner devant tout le monde. Tu peux même programmer l’ouverture de la page à minuit le 25 décembre.',
      ] },
    ],
  },
];
