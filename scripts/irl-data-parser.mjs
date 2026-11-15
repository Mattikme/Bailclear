import assert from "node:assert/strict";

const REQUIRED_IDBANKS = ["001515333", "010760507", "010760509"];

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([A-Z][A-Z0-9_]*)="([^"]*)"/g)) {
    result[match[1]] = match[2];
  }
  return result;
}

function isIsoDate(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value || "")) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseSdmxXml(xml, expectedIds = REQUIRED_IDBANKS) {
  assert.equal(typeof xml, "string", "La réponse SDMX doit être du texte");
  assert.match(xml, /<Series\\b/, "Aucune série SDMX n'a été renvoyée");
  const series = {};
  for (const match of xml.matchAll(/<Series\\b([^>]*)>([\\s\\S]*?)<\\/Series>/g)) {
    const meta = attributes(match[1]);
    const idbank = meta.IDBANK;
    if (!expectedIds.includes(idbank)) continue;
    if (series[idbank]) throw new Error("Série INSEE dupliquée : " + idbank);
    const observations = [];
    for (const observationMatch of match[2].matchAll(/<Obs\\b([^>]*)\\/?>(?:[\\s\\S]*?<\\/Obs>)?/g)) {
      const a = attributes(observationMatch[1]);
      const period = a.TIME_PERIOD || "";
      const value = Number(a.OBS_VALUE);
      if (!/^\\d{4}-Q[1-4]$/.test(period)) throw new Error("Période IRL invalide : " + period);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Valeur IRL invalide : " + period);
      if (!["A", "R"].includes(a.OBS_STATUS)) {
        throw new Error("Observation INSEE non définitive ou manquante (" + period + ", statut " + (a.OBS_STATUS || "absent") + ")");
      }
      if (a.OBS_QUAL && !["DEF", "SD"].includes(a.OBS_QUAL)) {
        throw new Error("Qualité INSEE non définitive (" + period + ", qualité " + a.OBS_QUAL + ")");
      }
      if (a.DATE_JO && !isIsoDate(a.DATE_JO)) throw new Error("DATE_JO invalide : " + a.DATE_JO);
      observations.push({
        period,
        value,
        status: a.OBS_STATUS,
        quality: a.OBS_QUAL || null,
        dateJo: a.DATE_JO || null,
        revised: a.OBS_REV === "true"
      });
    }
    observations.sort((a, b) => a.period.localeCompare(b.period));
    if (!observations.length) throw new Error("La série INSEE " + idbank + " ne contient aucune observation");
    const byPeriod = new Set(observations.map(x => x.period));
    if (byPeriod.size !== observations.length) throw new Error("Périodes dupliquées dans la série " + idbank);
    series[idbank] = { idbank, title: meta.TITLE_FR || "", lastUpdate: meta.LAST_UPDATE || null, observations };
  }
  for (const id of expectedIds) {
    if (!series[id]) throw new Error("Série INSEE manquante : " + id);
  }

  // Les séries territoriales séparées commencent au T3 2022.
  // Avant ce découpage officiel, l'IRL national s'appliquait sur l'ensemble du territoire.
  const regionalStart = "2022-Q3";
  const national = series["001515333"].observations;
  const combineRegional = id => {
    const regional = series[id].observations;
    if (!regional.some(x => x.period === regionalStart)) {
      throw new Error("La série territoriale " + id + " ne comporte pas le début attendu en 2022-Q3");
    }
    return [
      ...national.filter(x => x.period < regionalStart),
      ...regional.filter(x => x.period >= regionalStart)
    ];
  };
  return {
    schemaVersion: 1,
    source: "INSEE BDM — API SDMX, identifiants IDBANK officiels",
    sourceUrl: "https://www.insee.fr/fr/information/2862759",
    nationalIdbank: "001515333",
    territories: {
      metropole: series["001515333"].observations,
      corse: combineRegional("010760507"),
      outremer: combineRegional("010760509")
    },
    seriesMetadata: {
      metropole: series["001515333"],
      corse: series["010760507"],
      outremer: series["010760509"]
    }
  };
}

export { REQUIRED_IDBANKS, isIsoDate };
