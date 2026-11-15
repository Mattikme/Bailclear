import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSdmxXml } from "./irl-data-parser.mjs";

const endpoint = "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/001515333+010760507+010760509";
const url = endpoint + "?startPeriod=1998-Q4";
const response = await fetch(url, {
  headers: {
    "user-agent": "BailClear-IRL-Updater/1.0 (+https://github.com/Mattikme/Bailclear)",
    "accept": "application/vnd.sdmx.structurespecificdata+xml;version=2.1"
  },
  signal: AbortSignal.timeout(45000)
});
if (!response.ok) throw new Error("API BDM INSEE : HTTP " + response.status);
const xml = await response.text();
if (xml.length < 1000) throw new Error("Réponse INSEE anormalement courte");
const dataset = parseSdmxXml(xml);
const requiredQuarters = ["2026-Q1", "2026-Q2", "2026-Q3"];
for (const [territory, observations] of Object.entries(dataset.territories)) {
  for (const period of requiredQuarters) {
    if (!observations.some(x => x.period === period)) {
      throw new Error("Donnée IRL attendue absente : " + territory + " " + period);
    }
  }
}
dataset.refreshedAt = new Date().toISOString();
dataset.refreshMethod = "Automatique — API BDM INSEE SDMX";
dataset.availabilityDatePolicy = "DATE_JO conservée comme date prudente de disponibilité. La mise à disposition sur insee.fr peut précéder la parution au Journal officiel ; les cas proches de cette date doivent être vérifiés manuellement.";
dataset.observationCount = Object.fromEntries(
  Object.entries(dataset.territories).map(([key, values]) => [key, values.length])
);
const destination = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/data/irl.json");
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, JSON.stringify(dataset, null, 2) + "\n");
console.log("IRL INSEE récupérés et validés : " + JSON.stringify(dataset.observationCount));
