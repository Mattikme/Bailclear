/* Règles métier isolées pour tests sans navigateur. Diagnostic de vigilance, jamais certification juridique. */
(function (root) {
  "use strict";
  function isValidISODate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const p = value.split("-").map(Number);
    const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }
  function addOneCalendarYear(value) {
    if (!isValidISODate(value)) return null;
    const p = value.split("-").map(Number);
    if (p[1] === 2 && p[2] === 29) return null;
    return new Date(Date.UTC(p[0] + 1, p[1] - 1, p[2])).toISOString().slice(0, 10);
  }
  function evaluate(input) {
    const messages = [];
    let blocked = false;
    let effectiveDate = input.revisionDate || input.requestDate || "";
    if (input.contractType === "mobilite") {
      blocked = true;
      messages.push("Bail mobilité : la révision du loyer en cours de bail est interdite.");
    } else if (input.contractType !== "residence-vide" && input.contractType !== "residence-meuble") {
      blocked = true;
      messages.push("Type de contrat non pris en charge : seuls les baux d’habitation classiques de résidence principale sont visés.");
    }
    if (input.revisionClause === "non") {
      blocked = true;
      messages.push("Aucune clause de révision annuelle n’est déclarée dans le bail.");
    } else if (input.revisionClause !== "oui") {
      blocked = true;
      messages.push("La présence d’une clause de révision annuelle doit être vérifiée dans le bail.");
    }
    if (!["A-E", "F", "G"].includes(input.dpe)) {
      blocked = true;
      messages.push("Classe DPE non renseignée ou non reconnue.");
    }
    if (!isValidISODate(input.leaseDate)) {
      blocked = true;
      messages.push("Date de conclusion ou de dernière reconduction du bail manquante ou invalide.");
    }
    if (input.dpe === "F" || input.dpe === "G") {
      const cutoff = input.territory === "outremer" ? "2024-07-01" : "2022-08-24";
      if (isValidISODate(input.leaseDate) && input.leaseDate >= cutoff) {
        blocked = true;
        messages.push("DPE F/G et contrat conclu, renouvelé ou reconduit à compter du seuil applicable : gel légal des révisions susceptible de s’appliquer.");
      } else if (isValidISODate(input.leaseDate)) {
        messages.push("DPE F/G : la date indiquée précède le seuil d’application ; vérifiez la dernière reconduction et la validité du DPE.");
      }
    }
    if (!isValidISODate(input.indexPublishedAt)) {
      blocked = true;
      messages.push("Date de publication de l’indice non vérifiée.");
    } else if (isValidISODate(input.revisionDate) && input.revisionDate < input.indexPublishedAt) {
      blocked = true;
      messages.push("L’indice sélectionné n’était pas encore publié à la date de révision : choisissez une référence disponible à cette date.");
    }
    if (!isValidISODate(input.revisionDate) || !isValidISODate(input.requestDate)) {
      blocked = true;
      messages.push("Renseignez une date de révision prévue au bail et une date de demande valides.");
    } else {
      const deadline = addOneCalendarYear(input.revisionDate);
      if (!deadline) {
        blocked = true;
        messages.push("La date de révision est un 29 février : calcul du délai suspendu pour vérification humaine.");
      } else if (input.requestDate >= deadline) {
        blocked = true;
        messages.push("Le délai d’un an suivant la date de prise d’effet est dépassé : la révision de cette année est perdue.");
      } else if (input.requestDate > input.revisionDate) {
        effectiveDate = input.requestDate;
        messages.push("Demande postérieure à la date de révision : prise d’effet à compter de la demande, sans rétroactivité.");
      } else {
        effectiveDate = input.revisionDate;
        messages.push("Demande avant ou à la date de révision : prise d’effet au plus tôt à la date prévue au bail.");
      }
    }
    messages.push("Ce contrôle ne vérifie pas l’encadrement local des loyers, les conventions Anah, les baux spéciaux ni toutes les clauses du contrat.");
    return { valid: !blocked, effectiveDate, blocked, messages };
  }
  const api = { evaluate, isValidISODate, addOneCalendarYear };
  root.BailClearLegalRules = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
