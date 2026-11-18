// Langue de la page offerte : seuls les libellés du site sont traduits, les textes écrits par le créateur restent tels quels.
export const LANGS = { fr: 'Français', en: 'English', es: 'Español', it: 'Italiano', de: 'Deutsch', pt: 'Português' };
export const LANG_IDS = Object.keys(LANGS);
const LOCALES = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT', de: 'de-DE', pt: 'pt-PT' };

const D = {
  fr: {
    sinceLabel: 'Depuis', titleDefault: 'Pour toi',
    envFrom: '{from} t’a préparé quelque chose {emoji}', envTo: 'Une surprise pour {to} {emoji}', open: 'Ouvrir 💌', openShort: 'Ouvrir',
    secretWrong: 'Ce n’est pas ça… essaie encore 😉', countdown: 'Patience… elle s’ouvrira le {when}',
    days: 'jours', hours: 'heures', min: 'min', sec: 'sec',
    for: 'Pour {to}', by: 'de la part de {from}', since: '{label} le {date}', daysWord: 'jours',
    cardsHint: 'Touche les cartes pour les découvrir', cardsDone: '{n} / {total} découvertes', cardsAll: 'Toutes les cartes sont découvertes',
    voiceFrom: '{from} a un message pour toi', voice: 'Un message pour toi', listen: 'Écouter le message vocal', pause: 'Mettre en pause',
    group: 'Ils ont aussi un mot pour toi', msg1: '{n} message', msgN: '{n} messages',
    quiz: 'Le quiz', quizHint: 'Est-ce que tu me connais vraiment ?', quizStep: 'Question {i} / {n}', right: 'Bonne réponse !', wrong: 'Raté… c’était « {a} »',
    next: 'Question suivante →', score: 'Voir mon score', perfect: 'Sans faute ! Tu me connais par cœur 💯', good: 'Pas mal du tout 😉', meh: 'On a encore des souvenirs à se faire 😄', replay: 'Rejouer',
    video: '🎬 Créer la vidéo souvenir', videoHint: 'Un petit film de cette page, gratuit, à télécharger ou à partager sur TikTok, Instagram, Snapchat…',
    wp: '📱 Créer un fond d’écran', wpHint: 'Vos photos en fond d’écran de téléphone, l’heure reste lisible.',
    made: 'Créée avec Une page pour toi — crée la tienne →', report: 'Signaler un contenu',
  },
  en: {
    sinceLabel: 'Since', titleDefault: 'For you',
    envFrom: '{from} made something for you {emoji}', envTo: 'A surprise for {to} {emoji}', open: 'Open 💌', openShort: 'Open',
    secretWrong: 'Not quite… try again 😉', countdown: 'Be patient… it opens on {when}',
    days: 'days', hours: 'hours', min: 'min', sec: 'sec',
    for: 'For {to}', by: 'from {from}', since: '{label} {date}', daysWord: 'days',
    cardsHint: 'Tap the cards to reveal them', cardsDone: '{n} / {total} revealed', cardsAll: 'All cards revealed',
    voiceFrom: '{from} has a message for you', voice: 'A message for you', listen: 'Play the voice message', pause: 'Pause',
    group: 'They have a few words for you too', msg1: '{n} message', msgN: '{n} messages',
    quiz: 'The quiz', quizHint: 'Do you really know me?', quizStep: 'Question {i} / {n}', right: 'Correct!', wrong: 'Oops… it was “{a}”',
    next: 'Next question →', score: 'See my score', perfect: 'Perfect! You know me by heart 💯', good: 'Not bad at all 😉', meh: 'We still have memories to make 😄', replay: 'Play again',
    video: '🎬 Make the memory video', videoHint: 'A short film of this page, free to download or share on TikTok, Instagram, Snapchat…',
    wp: '📱 Make a wallpaper', wpHint: 'Your photos as a phone wallpaper, the clock stays readable.',
    made: 'Made with Une page pour toi — create yours →', report: 'Report content',
  },
  es: {
    sinceLabel: 'Desde', titleDefault: 'Para ti',
    envFrom: '{from} te ha preparado algo {emoji}', envTo: 'Una sorpresa para {to} {emoji}', open: 'Abrir 💌', openShort: 'Abrir',
    secretWrong: 'No es eso… inténtalo otra vez 😉', countdown: 'Paciencia… se abrirá el {when}',
    days: 'días', hours: 'horas', min: 'min', sec: 'seg',
    for: 'Para {to}', by: 'de parte de {from}', since: '{label} {date}', daysWord: 'días',
    cardsHint: 'Toca las cartas para descubrirlas', cardsDone: '{n} / {total} descubiertas', cardsAll: 'Todas las cartas descubiertas',
    voiceFrom: '{from} tiene un mensaje para ti', voice: 'Un mensaje para ti', listen: 'Escuchar el mensaje de voz', pause: 'Pausa',
    group: 'Ellos también tienen unas palabras para ti', msg1: '{n} mensaje', msgN: '{n} mensajes',
    quiz: 'El quiz', quizHint: '¿De verdad me conoces?', quizStep: 'Pregunta {i} / {n}', right: '¡Correcto!', wrong: 'Fallaste… era «{a}»',
    next: 'Siguiente pregunta →', score: 'Ver mi puntuación', perfect: '¡Perfecto! Me conoces de memoria 💯', good: 'Nada mal 😉', meh: 'Aún nos quedan recuerdos por crear 😄', replay: 'Volver a jugar',
    video: '🎬 Crear el vídeo recuerdo', videoHint: 'Una pequeña película de esta página, gratis, para descargar o compartir en TikTok, Instagram, Snapchat…',
    wp: '📱 Crear un fondo de pantalla', wpHint: 'Vuestras fotos como fondo de pantalla, la hora sigue legible.',
    made: 'Hecha con Une page pour toi — crea la tuya →', report: 'Denunciar contenido',
  },
  it: {
    sinceLabel: 'Dal', titleDefault: 'Per te',
    envFrom: '{from} ti ha preparato qualcosa {emoji}', envTo: 'Una sorpresa per {to} {emoji}', open: 'Apri 💌', openShort: 'Apri',
    secretWrong: 'Non è così… riprova 😉', countdown: 'Pazienza… si aprirà {when}',
    days: 'giorni', hours: 'ore', min: 'min', sec: 'sec',
    for: 'Per {to}', by: 'da parte di {from}', since: '{label} {date}', daysWord: 'giorni',
    cardsHint: 'Tocca le carte per scoprirle', cardsDone: '{n} / {total} scoperte', cardsAll: 'Tutte le carte scoperte',
    voiceFrom: '{from} ha un messaggio per te', voice: 'Un messaggio per te', listen: 'Ascolta il messaggio vocale', pause: 'Pausa',
    group: 'Anche loro hanno un pensiero per te', msg1: '{n} messaggio', msgN: '{n} messaggi',
    quiz: 'Il quiz', quizHint: 'Mi conosci davvero?', quizStep: 'Domanda {i} / {n}', right: 'Risposta giusta!', wrong: 'Sbagliato… era «{a}»',
    next: 'Domanda successiva →', score: 'Vedi il punteggio', perfect: 'Perfetto! Mi conosci a memoria 💯', good: 'Niente male 😉', meh: 'Abbiamo ancora ricordi da creare 😄', replay: 'Gioca ancora',
    video: '🎬 Crea il video ricordo', videoHint: 'Un piccolo film di questa pagina, gratis, da scaricare o condividere su TikTok, Instagram, Snapchat…',
    wp: '📱 Crea uno sfondo', wpHint: 'Le vostre foto come sfondo del telefono, l’ora resta leggibile.',
    made: 'Creata con Une page pour toi — crea la tua →', report: 'Segnala un contenuto',
  },
  de: {
    sinceLabel: 'Seit', titleDefault: 'Für dich',
    envFrom: '{from} hat etwas für dich vorbereitet {emoji}', envTo: 'Eine Überraschung für {to} {emoji}', open: 'Öffnen 💌', openShort: 'Öffnen',
    secretWrong: 'Nicht ganz… versuch es nochmal 😉', countdown: 'Geduld… sie öffnet sich am {when}',
    days: 'Tage', hours: 'Std.', min: 'Min.', sec: 'Sek.',
    for: 'Für {to}', by: 'von {from}', since: '{label} {date}', daysWord: 'Tage',
    cardsHint: 'Tippe auf die Karten, um sie aufzudecken', cardsDone: '{n} / {total} aufgedeckt', cardsAll: 'Alle Karten aufgedeckt',
    voiceFrom: '{from} hat eine Nachricht für dich', voice: 'Eine Nachricht für dich', listen: 'Sprachnachricht abspielen', pause: 'Pause',
    group: 'Auch sie haben ein paar Worte für dich', msg1: '{n} Nachricht', msgN: '{n} Nachrichten',
    quiz: 'Das Quiz', quizHint: 'Kennst du mich wirklich?', quizStep: 'Frage {i} / {n}', right: 'Richtig!', wrong: 'Leider falsch… es war „{a}“',
    next: 'Nächste Frage →', score: 'Mein Ergebnis', perfect: 'Fehlerfrei! Du kennst mich in- und auswendig 💯', good: 'Gar nicht schlecht 😉', meh: 'Wir haben noch Erinnerungen zu sammeln 😄', replay: 'Nochmal spielen',
    video: '🎬 Erinnerungsvideo erstellen', videoHint: 'Ein kleiner Film dieser Seite, kostenlos zum Herunterladen oder Teilen auf TikTok, Instagram, Snapchat…',
    wp: '📱 Hintergrundbild erstellen', wpHint: 'Eure Fotos als Handy-Hintergrund, die Uhrzeit bleibt lesbar.',
    made: 'Erstellt mit Une page pour toi — erstelle deine →', report: 'Inhalt melden',
  },
  pt: {
    sinceLabel: 'Desde', titleDefault: 'Para ti',
    envFrom: '{from} preparou algo para ti {emoji}', envTo: 'Uma surpresa para {to} {emoji}', open: 'Abrir 💌', openShort: 'Abrir',
    secretWrong: 'Não é isso… tenta outra vez 😉', countdown: 'Paciência… vai abrir a {when}',
    days: 'dias', hours: 'horas', min: 'min', sec: 'seg',
    for: 'Para {to}', by: 'de {from}', since: '{label} {date}', daysWord: 'dias',
    cardsHint: 'Toca nas cartas para as descobrir', cardsDone: '{n} / {total} descobertas', cardsAll: 'Todas as cartas descobertas',
    voiceFrom: '{from} tem uma mensagem para ti', voice: 'Uma mensagem para ti', listen: 'Ouvir a mensagem de voz', pause: 'Pausa',
    group: 'Eles também têm umas palavras para ti', msg1: '{n} mensagem', msgN: '{n} mensagens',
    quiz: 'O quiz', quizHint: 'Conheces-me mesmo?', quizStep: 'Pergunta {i} / {n}', right: 'Certo!', wrong: 'Errado… era «{a}»',
    next: 'Pergunta seguinte →', score: 'Ver a minha pontuação', perfect: 'Perfeito! Conheces-me de cor 💯', good: 'Nada mal 😉', meh: 'Ainda temos memórias para criar 😄', replay: 'Jogar outra vez',
    video: '🎬 Criar o vídeo recordação', videoHint: 'Um pequeno filme desta página, grátis, para descarregar ou partilhar no TikTok, Instagram, Snapchat…',
    wp: '📱 Criar um fundo de ecrã', wpHint: 'As vossas fotos como fundo de ecrã, a hora continua legível.',
    made: 'Criada com Une page pour toi — cria a tua →', report: 'Denunciar conteúdo',
  },
};

// Titres de sections par occasion : [frise, cartes].
const TITLES = {
  en: { 'saint-valentin': ['Our story', 'What I love about you'], 'anniversaire-de-couple': ['Our best moments', 'What you’ve given me'], anniversaire: ['Your big moments', 'What we love about you'], 'fete-des-meres': ['Our memories with you', 'Thank you, Mum, for…'], 'fete-des-peres': ['Our memories with you', 'Thank you, Dad, for…'], 'fete-des-grands-meres': ['Our memories with you', 'We love you because…'], noel: ['Our year', 'What this year gave me'], demande: ['Our story', 'Why it’s you'], remerciements: ['Our moments together', 'Thank you for…'] },
  es: { 'saint-valentin': ['Nuestra historia', 'Lo que amo de ti'], 'anniversaire-de-couple': ['Nuestros mejores momentos', 'Lo que me has dado'], anniversaire: ['Tus grandes momentos', 'Lo que nos encanta de ti'], 'fete-des-meres': ['Nuestros recuerdos contigo', 'Gracias, mamá, por…'], 'fete-des-peres': ['Nuestros recuerdos contigo', 'Gracias, papá, por…'], 'fete-des-grands-meres': ['Nuestros recuerdos contigo', 'Te queremos porque…'], noel: ['Nuestro año', 'Lo que este año me ha dado'], demande: ['Nuestra historia', 'Por qué tú'], remerciements: ['Nuestros momentos juntos', 'Gracias por…'] },
  it: { 'saint-valentin': ['La nostra storia', 'Cosa amo di te'], 'anniversaire-de-couple': ['I nostri momenti più belli', 'Cosa mi hai dato'], anniversaire: ['I tuoi grandi momenti', 'Cosa amiamo di te'], 'fete-des-meres': ['I nostri ricordi con te', 'Grazie mamma, per…'], 'fete-des-peres': ['I nostri ricordi con te', 'Grazie papà, per…'], 'fete-des-grands-meres': ['I nostri ricordi con te', 'Ti vogliamo bene perché…'], noel: ['Il nostro anno', 'Cosa mi ha regalato quest’anno'], demande: ['La nostra storia', 'Perché proprio tu'], remerciements: ['I nostri momenti insieme', 'Grazie per…'] },
  de: { 'saint-valentin': ['Unsere Geschichte', 'Was ich an dir liebe'], 'anniversaire-de-couple': ['Unsere schönsten Momente', 'Was du mir geschenkt hast'], anniversaire: ['Deine großen Momente', 'Was wir an dir lieben'], 'fete-des-meres': ['Unsere Erinnerungen mit dir', 'Danke, Mama, für…'], 'fete-des-peres': ['Unsere Erinnerungen mit dir', 'Danke, Papa, für…'], 'fete-des-grands-meres': ['Unsere Erinnerungen mit dir', 'Wir lieben dich, weil…'], noel: ['Unser Jahr', 'Was mir dieses Jahr geschenkt hat'], demande: ['Unsere Geschichte', 'Warum du'], remerciements: ['Unsere gemeinsamen Momente', 'Danke für…'] },
  pt: { 'saint-valentin': ['A nossa história', 'O que amo em ti'], 'anniversaire-de-couple': ['Os nossos melhores momentos', 'O que me deste'], anniversaire: ['Os teus grandes momentos', 'O que adoramos em ti'], 'fete-des-meres': ['As nossas memórias contigo', 'Obrigado, mãe, por…'], 'fete-des-peres': ['As nossas memórias contigo', 'Obrigado, pai, por…'], 'fete-des-grands-meres': ['As nossas memórias contigo', 'Gostamos de ti porque…'], noel: ['O nosso ano', 'O que este ano me deu'], demande: ['A nossa história', 'Porque és tu'], remerciements: ['Os nossos momentos juntos', 'Obrigado por…'] },
};

export function langOf(content) {
  return content && LANG_IDS.includes(content.lang) ? content.lang : 'fr';
}

export function locale(lang) {
  return LOCALES[lang] || 'fr-FR';
}

// t('fr', 'for', { to: 'Léa' }) → « Pour Léa »
export function t(lang, key, vars = {}) {
  const s = (D[lang] && D[lang][key]) || D.fr[key] || key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
}

// Titres de la frise et des cartes : ceux de l'occasion en français, traduits sinon.
export function sectionTitles(lang, occ) {
  const tr = TITLES[lang] && TITLES[lang][occ.id];
  return tr ? { timeline: tr[0], reasons: tr[1] } : { timeline: occ.timelineTitle, reasons: occ.reasonsTitle };
}
