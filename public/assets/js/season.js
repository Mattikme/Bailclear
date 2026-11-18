// Bandeau saisonnier basé sur de vraies dates (aucun faux compte à rebours).
const EVENTS = [
  ['2026-12-25', 'noel', '🎄 Noël, c’est le vendredi 25 décembre'],
  ['2027-02-14', 'saint-valentin', '💘 Saint-Valentin, c’est le dimanche 14 février'],
  ['2027-03-07', 'fete-des-grands-meres', '🌷 Fête des grands-mères, c’est le dimanche 7 mars'],
  ['2027-05-30', 'fete-des-meres', '💐 Fête des mères, c’est le dimanche 30 mai'],
  ['2027-06-20', 'fete-des-peres', '👔 Fête des pères, c’est le dimanche 20 juin'],
];
const today = new Date();
today.setHours(0, 0, 0, 0);
for (const [date, id, label] of EVENTS) {
  const days = Math.round((new Date(date + 'T00:00:00') - today) / 86400000);
  if (days >= 0 && days <= 45) {
    const box = document.getElementById('season');
    const a = document.createElement('a');
    a.href = `/${id}`;
    a.textContent = `${label}${days === 0 ? ' (aujourd’hui !)' : days === 1 ? ' (demain !)' : ` (dans ${days} jours)`}. Rien à livrer : ta page est prête en 10 minutes, même le jour J →`;
    box.append(a);
    box.hidden = false;
    break;
  }
}
