/* Résolution des indices IRL à partir des observations officielles INSEE. */
(function (root) {
  "use strict";
  const MAX_REFRESH_AGE_DAYS = 14;
  const PUBLICATION_AMBIGUITY_DAYS = 3;

  function validDate(value) {
    if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
    const d = new Date(value + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }
  function diffDays(a, b) {
    return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
  }
  function periodParts(period) {
    const m = /^(\\d{4})-Q([1-4])$/.exec(period || "");
    return m ? { year: Number(m[1]), quarter: "T" + m[2] } : null;
  }
  function isFinal(observation) {
    return observation && ["A", "R"].includes(observation.status) &&
      (!observation.quality || ["DEF", "SD"].includes(observation.quality)) &&
      Number.isFinite(observation.value) && observation.value > 0;
  }
  function failure(code, message) { return { valid: false, code, message }; }

  function resolvePair(dataset, input) {
    if (!dataset || dataset.schemaVersion !== 1 || !dataset.territories) {
      return failure("dataset_missing", "La base IRL officielle n'est pas disponible.");
    }
    if (!validDate(dataset.refreshedAt?.slice(0, 10))) {
      return failure("dataset_timestamp_missing", "La date de mise à jour de la base IRL n'est pas vérifiable.");
    }
    const today = new Date().toISOString().slice(0, 10);
    const age = diffDays(dataset.refreshedAt.slice(0, 10), today);
    if (age < -1 || age > MAX_REFRESH_AGE_DAYS) {
      return failure("dataset_stale", "La vérification quotidienne de la source INSEE est trop ancienne. Le calcul est suspendu.");
    }
    if (!["metropole", "corse", "outremer"].includes(input.territory)) {
      return failure("territory_unknown", "Territoire IRL non pris en charge.");
    }
    if (!validDate(input.signatureDate) || !validDate(input.revisionDate)) {
      return failure("dates_missing", "Renseignez les dates de signature et de révision prévues au bail.");
    }
    const all = dataset.territories[input.territory];
    if (!Array.isArray(all) || !all.length) return failure("series_missing", "Série IRL territoriale indisponible.");
    const eligible = all.filter(x => isFinal(x) && validDate(x.dateJo));
    let quarter = input.quarterMode;
    if (quarter === "auto") {
      const before = eligible.filter(x => x.dateJo <= input.signatureDate);
      if (!before.length) return failure("no_reference_at_signature", "Impossible d'identifier le dernier IRL publié à la date de signature. Vérification manuelle du bail et des archives INSEE nécessaire.");
      const selected = before.sort((a, b) => a.dateJo.localeCompare(b.dateJo) || a.period.localeCompare(b.period)).at(-1);
      const next = eligible.filter(x => x.dateJo > input.signatureDate).sort((a, b) => a.dateJo.localeCompare(b.dateJo))[0];
      if (next && diffDays(input.signatureDate, next.dateJo) <= PUBLICATION_AMBIGUITY_DAYS) {
        return failure("signature_publication_ambiguous", "La signature est proche de la parution au Journal officiel d'un nouvel IRL. L'indice peut avoir été mis en ligne auparavant sur insee.fr : vérifiez la date exacte de publication avant de retenir le trimestre.");
      }
      quarter = periodParts(selected.period)?.quarter;
      if (!quarter) return failure("reference_quarter_invalid", "Trimestre de référence introuvable.");
    } else if (!/^T[1-4]$/.test(quarter || "")) {
      return failure("quarter_missing", "Sélectionnez le trimestre prévu au bail ou l'option automatique si le bail ne précise pas le trimestre.");
    }
    const revisionYear = Number(input.revisionDate.slice(0, 4));
    const oldPeriod = (revisionYear - 1) + "-Q" + quarter.slice(1);
    const newPeriod = revisionYear + "-Q" + quarter.slice(1);
    const oldIndex = all.find(x => x.period === oldPeriod);
    const newIndex = all.find(x => x.period === newPeriod);
    if (!isFinal(oldIndex) || !validDate(oldIndex.dateJo)) {
      return failure("old_index_missing", "L'ancien indice IRL de référence manque dans la série INSEE ou n'a pas de date de publication vérifiable.");
    }
    if (!isFinal(newIndex) || !validDate(newIndex.dateJo)) {
      return failure("new_index_missing", "Le nouvel IRL du trimestre correspondant n'est pas encore disponible dans la série INSEE.");
    }
    if (newIndex.dateJo > input.revisionDate) {
      const delay = diffDays(input.revisionDate, newIndex.dateJo);
      if (delay <= PUBLICATION_AMBIGUITY_DAYS) {
        return failure("revision_publication_ambiguous", "La date de révision est proche de la parution au Journal officiel du nouvel IRL. Vérifiez sa date de publication effective sur insee.fr.");
      }
      return failure("new_index_not_published", "Le nouvel IRL correspondant n'était pas encore publié à la date de révision. Le calcul doit être revu lorsque l'indice est disponible.");
    }
    if (oldIndex.value <= 0 || newIndex.value <= 0) return failure("index_invalid", "Valeurs IRL invalides.");
    return {
      valid: true,
      quarter,
      oldIndex: { ...oldIndex },
      newIndex: { ...newIndex },
      referenceMode: input.quarterMode,
      message: input.quarterMode === "auto"
        ? "Trimestre automatique : dernier IRL publié à la date de signature, sous réserve de la vérification de la date exacte de mise en ligne INSEE."
        : "Trimestre explicite : vérifiez qu'il correspond exactement à la clause du bail."
    };
  }

  root.BailClearIRLIndex = { resolvePair, validDate };
  if (typeof module !== "undefined" && module.exports) module.exports = root.BailClearIRLIndex;
})(typeof globalThis !== "undefined" ? globalThis : this);
