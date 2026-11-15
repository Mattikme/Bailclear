/* Règles métier versionnées — contrôle de vigilance, jamais certification juridique. */
(function (root) {
  "use strict";

  const RULESET_VERSION = "2026-11-15.1";
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
    const block = message => { blocked = true; messages.push(message); };
    const warn = message => messages.push(message);

    if (input.contractType === "mobilite") {
      block("Bail mobilité : la révision du loyer en cours de bail est interdite.");
    } else if (input.contractType !== "residence-vide" && input.contractType !== "residence-meuble") {
      block("Type de contrat non pris en charge : seuls les baux classiques de résidence principale vides ou meublés sont visés.");
    }
    if (input.specialRegime !== "prive-classique") {
      block("Régime du logement inconnu ou spécial : confirmer qu'il s'agit d'un logement du parc privé non conventionné, hors loi de 1948 et hors logement social. Les baux Anah, sociaux et loi de 1948 nécessitent des règles distinctes.");
    }
    if (input.revisionClause !== "oui") {
      block(input.revisionClause === "non"
        ? "Aucune clause de révision annuelle n'est déclarée dans le bail."
        : "La présence d'une clause de révision annuelle doit être vérifiée dans le bail.");
    }
    if (!["A-E", "F", "G"].includes(input.dpe)) {
      block("Classe énergétique DPE non renseignée ou non reconnue.");
    }
    if (!isValidISODate(input.dpeDate)) {
      block("Date de réalisation du DPE manquante ou invalide : sa durée de validité ne peut pas être contrôlée.");
    } else if (input.dpeDate < "2021-07-01") {
      block("DPE réalisé avant le 1er juillet 2021 : il n'est plus valable en 2026. Un DPE valide doit être fourni.");
    } else if (isValidISODate(input.requestDate) && input.dpeDate > input.requestDate) {
      block("La date de réalisation du DPE est postérieure à la date de la demande : vérifiez la saisie.");
    } else if (isValidISODate(input.requestDate)) {
      const year = Number(input.dpeDate.slice(0, 4)) + 10;
      const month = Number(input.dpeDate.slice(5, 7));
      const day = Number(input.dpeDate.slice(8, 10));
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const expiry = new Date(Date.UTC(year, month - 1, Math.min(day, lastDay)));
      if (input.requestDate >= expiry.toISOString().slice(0, 10)) {
        block("DPE arrivé au terme de sa durée de validité de dix ans à la date de la demande.");
      }
    }

    if (!isValidISODate(input.leaseSignatureDate)) {
      block("Date de signature initiale du bail manquante ou invalide.");
    }

    let dpeRelevantLeaseDate = input.leaseSignatureDate || "";
    if (input.dpe === "F" || input.dpe === "G") {
      if (input.renewalStatus === "oui") {
        if (!isValidISODate(input.lastRenewalDate)) {
          block("DPE F/G : date de dernière reconduction ou de dernier renouvellement manquante ou invalide.");
        } else if (isValidISODate(input.leaseSignatureDate) && input.lastRenewalDate < input.leaseSignatureDate) {
          block("La date de dernière reconduction ne peut pas précéder la signature initiale du bail.");
        } else {
          dpeRelevantLeaseDate = input.lastRenewalDate;
        }
      } else if (input.renewalStatus === "non") {
        dpeRelevantLeaseDate = input.leaseSignatureDate || "";
        if (input.lastRenewalDate) block("Une date de reconduction est renseignée alors que le formulaire indique qu'il n'y en a pas.");
      } else {
        block("DPE F/G : indiquez si le bail a été renouvelé ou tacitement reconduit depuis sa signature, puis fournissez la date si oui.");
      }

      const cutoff = input.territory === "outremer" ? "2024-07-01" : "2022-08-24";
      if (isValidISODate(dpeRelevantLeaseDate) && dpeRelevantLeaseDate >= cutoff) {
        block("DPE F/G : le bail a été conclu, renouvelé ou tacitement reconduit à compter du seuil légal applicable. La révision du loyer est interdite.");
      } else if (isValidISODate(dpeRelevantLeaseDate)) {
        warn("DPE F/G : la date indiquée précède le seuil légal de gel. Vérifiez néanmoins le DPE, toute reconduction ultérieure et les éventuelles règles plus récentes.");
      }
    }

    if (!["provision", "forfait", "aucune"].includes(input.chargesType)) {
      block("Précisez si les charges sont une provision, un forfait ou s'il n'y a pas de charges.");
    } else if (input.chargesType === "forfait") {
      warn("Charges au forfait : le forfait peut lui-même être révisé annuellement selon les règles applicables. BailClear ne calcule pas cette révision séparée ; le montant affiché reste inchangé.");
    }

    if (input.indexPairValid !== true) {
      block(input.indexErrorMessage || "Paire d'indices IRL non vérifiée dans l'historique officiel INSEE. Le calcul est suspendu.");
    }
    if (!Number.isFinite(Number(input.oldIndex)) || Number(input.oldIndex) <= 0 ||
        !Number.isFinite(Number(input.newIndex)) || Number(input.newIndex) <= 0) {
      block("Les deux indices IRL doivent être disponibles et strictement positifs.");
    }

    if (!isValidISODate(input.revisionDate) || !isValidISODate(input.requestDate)) {
      block("Renseignez une date de révision prévue au bail et une date de demande valides.");
    } else {
      const deadline = addOneCalendarYear(input.revisionDate);
      if (!deadline) {
        block("La date de révision est un 29 février : calcul du délai suspendu pour vérification humaine.");
      } else if (input.requestDate >= deadline) {
        block("Le délai d'un an suivant la date de prise d'effet est dépassé : la révision de cette année est perdue.");
      } else if (input.requestDate > input.revisionDate) {
        effectiveDate = input.requestDate;
        messages.push("Demande postérieure à la date de révision : prise d'effet à compter de la demande, sans rétroactivité.");
      } else {
        effectiveDate = input.revisionDate;
        messages.push("Demande avant ou à la date de révision : prise d'effet au plus tôt à la date prévue au bail.");
      }
    }

    messages.push("Ce contrôle ne lit pas le bail, ne valide pas le DPE auprès de l'ADEME et ne vérifie pas l'encadrement local des loyers, les compléments de loyer, les conventions Anah, les logements sociaux, les baux spéciaux ni toutes les clauses contractuelles.");
    return { valid: !blocked, effectiveDate, blocked, messages, rulesetVersion: RULESET_VERSION };
  }

  const api = { evaluate, isValidISODate, addOneCalendarYear, RULESET_VERSION };
  root.BailClearLegalRules = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
