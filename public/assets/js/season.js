// Bandeau saisonnier basé sur de vraies dates (aucun faux compte à rebours).
const EVENTS = [
  ['2026-12-25', 'noel', 'Noël tombe le vendredi 25 décembre'],
  ['2027-02-14', 'saint-valentin', 'La Saint-Valentin tombe le dimanche 14 février'],
  ['2027-03-07', 'fete-des-grands-meres', 'La fête des grands-mères a lieu le dimanche 7 mars'],
  ['2027-05-30', 'fete-des-meres', 'La fête des mères a lieu le dimanche 30 mai'],
  ['2027-06-20', 'fete-des-peres', 'La fête des pères a lieu le dimanche 20 juin'],
];
const today = new Date();
today.setHours(0, 0, 0, 0);
for (const [date, id, label] of EVENTS) {
  const days = Math.round((new Date(date + 'T00:00:00') - today) / 86400000);
  if (days >= 0 && days <= 45) {
    const box = document.getElementById('season');
    const a = document.createElement('a');
    a.href = `/${id}`;
    a.textContent = `${label}${days === 0 ? ', c’est aujourd’hui' : days === 1 ? ', c’est demain' : `, dans ${days} jours`}. Rien à faire livrer : ta page est prête en 10 minutes.`;
    box.append(a);
    box.hidden = false;
    break;
  }
}
