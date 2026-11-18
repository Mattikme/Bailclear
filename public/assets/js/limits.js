// Limites de longueur (en caractères), partagées par l'éditeur (compteurs) et le serveur (validation).
// Volontairement courtes : une page cadeau se lit d'une traite, sur un téléphone.
export const LIMITS = {
  to: 40, from: 40, title: 70, intro: 100, dateLabel: 30,
  letter: 1200, // ≈ 200 mots
  caption: 80, when: 30, timelineText: 160, timeline: 8, reason: 90, reasons: 12,
  music: 300, finalMessage: 250, question: 100, answer: 60,
};
