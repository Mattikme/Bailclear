(function () {
  "use strict";

  const CONFIG = {
    STORAGE_KEY: "bailclear_owner_data_v1"
  };

  let lastLegalCheckAllowsPrint = false;
  let irlDataset = null;
  let selectedIRLPair = null;
  let selectedIRLPairError = "Base IRL INSEE non chargée.";
  let refreshIRLSelection = null;


  const euroFmt = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const pctFmt = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  async function loadIRLData() {
    try {
      const response = await fetch("assets/data/irl.json", { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      if (payload.schemaVersion !== 1 || !payload.territories) throw new Error("Structure IRL non reconnue");
      irlDataset = payload;
      return true;
    } catch (error) {
      irlDataset = null;
      selectedIRLPair = null;
      selectedIRLPairError = "Impossible de charger la base IRL officielle : " + String(error);
      return false;
    }
  }

  function formatDateFR(isoStr) {
    if (!isoStr) return "--/--/----";
    const parts = isoStr.split("-");
    if (parts.length !== 3) return isoStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function escapeText(str, fallback) {
    const clean = (str || "").trim();
    return clean.length > 0 ? clean : fallback;
  }

  function isProUnlocked() { return false; }

  function unlockPro() { return false; }

  function checkUrlUnlock() { /* Pro activation must be verified server-side. */ }

  function applyLicenseUI() {
    const badge = document.getElementById("license-badge");
    const sheet = document.getElementById("printable-sheet");
    const status = document.getElementById("watermark-status");
    if (badge) badge.textContent = "Outil gratuit";
    if (sheet) sheet.classList.remove("watermarked");
    if (status) status.textContent = "Document imprimable";
  }

  function initDefaultDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayISO = `${yyyy}-${mm}-${dd}`;

    const dateEnvoiInput = document.getElementById("date-envoi");
    const dateProrataInput = document.getElementById("prorata-date");

    if (!dateEnvoiInput.value) dateEnvoiInput.value = todayISO;
    if (!dateProrataInput.value) dateProrataInput.value = todayISO;
  }

  function evaluateLegalCompliance(dpe, dateAnnivStr, dateEnvoiStr) {
    const diagEl = document.getElementById("legal-diagnostic");
    const result = window.BailClearLegalRules.evaluate({
      contractType: document.getElementById("type-contrat")?.value || "inconnu",
      specialRegime: document.getElementById("regime-logement")?.value || "inconnu",
      revisionClause: document.getElementById("clause-revision")?.value || "inconnu",
      dpe,
      dpeDate: document.getElementById("date-dpe")?.value || "",
      territory: document.getElementById("zone-logement")?.value || "metropole",
      leaseSignatureDate: document.getElementById("date-signature-bail")?.value || "",
      renewalStatus: document.getElementById("bail-reconduit")?.value || "inconnu",
      lastRenewalDate: document.getElementById("date-derniere-reconduction")?.value || "",
      revisionDate: dateAnnivStr || "",
      requestDate: dateEnvoiStr || "",
      chargesType: document.getElementById("type-charges")?.value || "inconnu",
      indexPairValid: Boolean(selectedIRLPair),
      indexErrorMessage: selectedIRLPairError,
      oldIndex: Number(document.getElementById("irl-ancien")?.value),
      newIndex: Number(document.getElementById("irl-nouveau")?.value)
    });
    const required = [
      ["bailleur-nom", "Nom du bailleur"],
      ["bailleur-adresse", "Adresse du bailleur"],
      ["locataire-nom", "Nom du locataire"],
      ["bien-adresse", "Adresse du logement"],
      ["ville-redaction", "Ville de rédaction"]
    ];
    const missing = required.filter(([id]) => !(document.getElementById(id)?.value || "").trim());
    const numeric = [
      ["loyer-hc", value => value > 0, "Loyer hors charges"],
      ["charges", value => value >= 0, "Charges"]
    ];
    const invalidNumbers = numeric.filter(([id, predicate]) => {
      const el = document.getElementById(id);
      const raw = el?.value.trim() || "";
      const value = Number(raw);
      return raw === "" || !Number.isFinite(value) || !predicate(value);
    });
    if (missing.length) result.messages.push("Complétez le document : " + missing.map(([, label]) => label).join(", ") + ".");
    if (invalidNumbers.length) result.messages.push("Vérifiez les valeurs numériques : " + invalidNumbers.map(([, , label]) => label).join(", ") + ".");
    const chargesType = document.getElementById("type-charges")?.value || "inconnu";
    const chargesValue = Number(document.getElementById("charges")?.value);
    const chargesMismatch = chargesType === "aucune" && chargesValue !== 0;
    if (chargesMismatch) result.messages.push("Le type de charges indique « aucune », mais un montant non nul est saisi. Corrigez le type ou le montant.");
    const valid = result.valid && missing.length === 0 && invalidNumbers.length === 0 && !chargesMismatch;
    diagEl.className = valid ? "alert alert-warning" : "alert alert-danger";
    diagEl.textContent = (valid ? "Contrôle partiel — vérification humaine obligatoire : " : "Document bloqué — conditions ou informations manquantes : ") + result.messages.join(" ");
    return { valid, effectiveDate: result.effectiveDate };
  }

  function updateIRLCalculation() {
    const rawRent = document.getElementById("loyer-hc").value.trim();
    const rawCharges = document.getElementById("charges").value.trim();
    const loyerHC = Number(rawRent);
    const charges = Number(rawCharges);
    const irlAncien = Number(document.getElementById("irl-ancien").value);
    const irlNouveau = Number(document.getElementById("irl-nouveau").value);
    const dateAnniv = document.getElementById("date-bail-anniv").value;
    const dateEnvoi = document.getElementById("date-envoi").value;
    const dpe = document.getElementById("classe-dpe").value;
    const calculationReady = rawRent !== "" && Number.isFinite(loyerHC) && loyerHC > 0 &&
      rawCharges !== "" && Number.isFinite(charges) && charges >= 0 &&
      Number.isFinite(irlAncien) && irlAncien > 0 &&
      Number.isFinite(irlNouveau) && irlNouveau > 0;

    let nouveauHC = null, diffMensuelle = null, pctVariation = null;
    let ancienCC = null, nouveauCC = null, impactAnnuel = null;
    let sign = "";
    if (calculationReady) {
      nouveauHC = Math.round((loyerHC * (irlNouveau / irlAncien)) * 100) / 100;
      diffMensuelle = Math.round((nouveauHC - loyerHC) * 100) / 100;
      pctVariation = loyerHC > 0 ? ((nouveauHC - loyerHC) / loyerHC) * 100 : 0;
      ancienCC = Math.round((loyerHC + charges) * 100) / 100;
      nouveauCC = Math.round((nouveauHC + charges) * 100) / 100;
      impactAnnuel = Math.round(diffMensuelle * 12 * 100) / 100;
      sign = diffMensuelle >= 0 ? "+" : "";
    }

    document.getElementById("res-nouveau-hc").textContent = calculationReady ? euroFmt.format(nouveauHC) : "—";
    document.getElementById("res-variation").textContent = calculationReady ? `${sign}${euroFmt.format(diffMensuelle)} / mois (${sign}${pctFmt.format(pctVariation)} %)` : "Renseignez le loyer et les indices applicables.";
    document.getElementById("res-nouveau-cc").textContent = calculationReady ? euroFmt.format(nouveauCC) : "—";
    document.getElementById("res-ancien-cc").textContent = calculationReady ? `Ancien total : ${euroFmt.format(ancienCC)}` : "Total en attente";
    document.getElementById("res-impact-annuel").textContent = calculationReady ? `${sign}${euroFmt.format(impactAnnuel)}` : "—";
    document.getElementById("formula-detail").textContent = calculationReady
      ? `${euroFmt.format(loyerHC)} × (${irlNouveau.toFixed(2)} ÷ ${irlAncien.toFixed(2)}) = ${euroFmt.format(nouveauHC)}`
      : "Calcul indisponible tant que les montants et indices ne sont pas renseignés.";

    const compliance = evaluateLegalCompliance(dpe, dateAnniv, dateEnvoi);
    lastLegalCheckAllowsPrint = compliance.valid;

    const bailleurNom = escapeText(document.getElementById("bailleur-nom").value, "Nom du Bailleur");
    const bailleurAdresse = escapeText(document.getElementById("bailleur-adresse").value, "Adresse du Bailleur");
    const locataireNom = escapeText(document.getElementById("locataire-nom").value, "Nom du Locataire");
    const bienAdresse = escapeText(document.getElementById("bien-adresse").value, "Adresse du logement loué");
    const dateBailFR = formatDateFR(document.getElementById("date-signature-bail").value);
    const dateEnvoiFR = formatDateFR(dateEnvoi);
    const ville = escapeText(document.getElementById("ville-redaction").value, "À compléter");
    const trimestre = selectedIRLPair?.quarter || "";
    const trimestreLabel = selectedIRLPair ? `${trimestre} — indice officiel INSEE` : "Trimestre à vérifier";

    document.getElementById("doc-bailleur-nom").textContent = bailleurNom;
    document.getElementById("doc-bailleur-adresse").textContent = bailleurAdresse;
    document.getElementById("doc-locataire-nom").textContent = locataireNom;
    document.getElementById("doc-bien-adresse").textContent = bienAdresse;
    document.getElementById("doc-bien-adresse-2").textContent = bienAdresse;
    document.getElementById("doc-ville").textContent = ville;
    document.getElementById("doc-date-envoi").textContent = dateEnvoiFR;
    document.getElementById("doc-date-bail").textContent = dateBailFR;
    document.getElementById("doc-date-bail-2").textContent = dateBailFR;
    document.getElementById("doc-trimestre").textContent = trimestreLabel;
    document.getElementById("doc-trimestre-2").textContent = trimestre || "—";
    document.getElementById("doc-trimestre-3").textContent = trimestre || "—";
    document.getElementById("doc-ancien-hc").textContent = calculationReady ? euroFmt.format(loyerHC) : "—";
    document.getElementById("doc-irl-ancien").textContent = calculationReady ? irlAncien.toFixed(2) : "—";
    document.getElementById("doc-irl-nouveau").textContent = calculationReady ? irlNouveau.toFixed(2) : "—";
    document.getElementById("doc-formule").textContent = calculationReady
      ? `${euroFmt.format(loyerHC)} × (${irlNouveau.toFixed(2)} / ${irlAncien.toFixed(2)})`
      : "Calcul en attente des indices et du loyer";
    document.getElementById("doc-variation").textContent = calculationReady ? `${sign}${euroFmt.format(diffMensuelle)} (${sign}${pctFmt.format(pctVariation)} %)` : "—";
    document.getElementById("doc-nouveau-hc").textContent = calculationReady ? euroFmt.format(nouveauHC) : "—";
    document.getElementById("doc-charges").textContent = rawCharges !== "" && Number.isFinite(charges) ? euroFmt.format(charges) : "—";
    document.getElementById("doc-nouveau-cc").textContent = calculationReady ? euroFmt.format(nouveauCC) : "—";
    const chargesType = document.getElementById("type-charges").value;
    const chargeLabels = {
      provision: "Provision mensuelle pour charges locatives",
      forfait: "Forfait mensuel de charges (non révisé par BailClear)",
      aucune: "Aucune charge récupérable",
      inconnu: "Type de charges à vérifier"
    };
    document.getElementById("doc-charges-label").textContent = chargeLabels[chargesType] || chargeLabels.inconnu;
    document.getElementById("doc-charges-note").textContent = chargesType === "forfait"
      ? "Le forfait peut faire l’objet d’une révision distincte selon le bail. Le présent total le reprend sans le réviser."
      : "";
    document.getElementById("q-charges-label").textContent = chargeLabels[chargesType] || chargeLabels.inconnu;
    document.getElementById("doc-prise-effet").textContent = compliance.effectiveDate
      ? "Date de prise d’effet indicative : " + formatDateFR(compliance.effectiveDate) + ". Vérifiez la date contractuelle avant envoi."
      : "Date de prise d’effet à vérifier.";
    document.getElementById("doc-bailleur-sig").textContent = bailleurNom;

    document.getElementById("q-bailleur-nom").textContent = bailleurNom;
    document.getElementById("q-bailleur-adresse").textContent = bailleurAdresse;
    document.getElementById("q-locataire-nom").textContent = locataireNom;
    document.getElementById("q-bien-adresse").textContent = bienAdresse;
    document.getElementById("q-loyer-hc").textContent = calculationReady ? euroFmt.format(nouveauHC) : "—";
    document.getElementById("q-charges").textContent = rawCharges !== "" && Number.isFinite(charges) ? euroFmt.format(charges) : "—";
    document.getElementById("q-total-table").textContent = calculationReady ? euroFmt.format(nouveauCC) : "—";
    document.getElementById("q-ville").textContent = ville;
    document.getElementById("q-date").textContent = dateEnvoiFR;
    document.getElementById("q-bailleur-sig").textContent = bailleurNom;
  }

  function updateProrataCalculation() {
    const rentRaw = document.getElementById("prorata-loyer").value.trim();
    const chargesRaw = document.getElementById("prorata-charges").value.trim();
    const loyer = Number(rentRaw);
    const charges = Number(chargesRaw);
    const type = document.getElementById("prorata-type").value;
    const dateStr = document.getElementById("prorata-date").value;
    const totalEl = document.getElementById("prorata-total-du");
    const detailEl = document.getElementById("prorata-detail");

    if (!rentRaw || !chargesRaw || !window.BailClearLegalRules.isValidISODate(dateStr) ||
        !Number.isFinite(loyer) || loyer <= 0 ||
        !Number.isFinite(charges) || charges < 0) {
      totalEl.textContent = "—";
      detailEl.textContent = "Renseignez un loyer positif, un montant de charges valide et une date.";
      return;
    }

    const parts = dateStr.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const occupiedDays = type === "entree" ? (daysInMonth - day + 1) : day;

    const loyerProrata = Math.round(((loyer * occupiedDays) / daysInMonth) * 100) / 100;
    const chargesProrata = Math.round(((charges * occupiedDays) / daysInMonth) * 100) / 100;
    const totalDu = Math.round((loyerProrata + chargesProrata) * 100) / 100;

    totalEl.textContent = euroFmt.format(totalDu);
    detailEl.textContent =
      `${occupiedDays} jour${occupiedDays > 1 ? "s" : ""} occupé${occupiedDays > 1 ? "s" : ""} sur ${daysInMonth} jours (Loyer : ${euroFmt.format(loyerProrata)} + Charges : ${euroFmt.format(chargesProrata)})`;
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      if (cb) cb();
    } finally {
      document.body.removeChild(ta);
    }
  }

  function copyLetterToClipboard() {
    if (!lastLegalCheckAllowsPrint) {
      window.alert("Le courrier est bloqué. Vérifiez les conditions juridiques et les champs obligatoires avant de le copier. Le contrôle reste partiel et ne constitue pas un avis juridique.");
      return;
    }
    const bailleur = document.getElementById("doc-bailleur-nom").textContent;
    const bailleurAdr = document.getElementById("doc-bailleur-adresse").textContent;
    const locataire = document.getElementById("doc-locataire-nom").textContent;
    const bienAdr = document.getElementById("doc-bien-adresse").textContent;
    const ville = document.getElementById("doc-ville").textContent;
    const dateEnvoi = document.getElementById("doc-date-envoi").textContent;
    const dateBail = document.getElementById("doc-date-bail").textContent;
    const ancienHC = document.getElementById("doc-ancien-hc").textContent;
    const nouveauHC = document.getElementById("doc-nouveau-hc").textContent;
    const charges = document.getElementById("doc-charges").textContent;
    const nouveauCC = document.getElementById("doc-nouveau-cc").textContent;
    const formule = document.getElementById("doc-formule").textContent;

    const plainText = [
      `${bailleur}`,
      `${bailleurAdr}`,
      ``,
      `À l'attention de : ${locataire}`,
      `${bienAdr}`,
      ``,
      `Fait à ${ville}, le ${dateEnvoi}`,
      `Objet : Révision annuelle du loyer (IRL)`,
      ``,
      `Madame, Monsieur,`,
      ``,
      `Conformément à notre contrat de location conclu ou reconduit le ${dateBail} et à l'article 17-1 de la loi n° 89-462 du 6 juillet 1989, je vous informe de la révision annuelle de votre loyer :`,
      `- Ancien loyer hors charges : ${ancienHC}`,
      `- Calcul IRL : ${formule}`,
      `- Nouveau loyer hors charges : ${nouveauHC}`,
      `- ${document.getElementById("doc-charges-label").textContent} : ${charges}`,
      `- Nouveau total mensuel charges comprises : ${nouveauCC}`,
      `${document.getElementById("doc-prise-effet").textContent}`,
      ``,
      `Cordialement,`,
      `${bailleur}`
    ].join("\n");

    const onCopied = () => {
      const btn = document.getElementById("btn-copy-text");
      const original = btn.textContent;
      btn.textContent = "Texte copié dans le presse-papiers";
      setTimeout(() => {
        btn.textContent = original;
      }, 2200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(plainText).then(onCopied).catch(() => {
        fallbackCopy(plainText, onCopied);
      });
    } else {
      fallbackCopy(plainText, onCopied);
    }
  }


  const OWNER_KEY = "bailclear_owner_data_v1";
  function readOwnerData() {
    try { const v=JSON.parse(localStorage.getItem(OWNER_KEY)||'{"properties":[],"history":[]}'); return {properties:Array.isArray(v.properties)?v.properties:[],history:Array.isArray(v.history)?v.history:[]}; }
    catch (_) { return {properties:[],history:[]}; }
  }
  function writeOwnerData(v) { localStorage.setItem(OWNER_KEY,JSON.stringify(v)); }
  function currentProperty() {
    const g=id=>(document.getElementById(id)?.value||"").trim();
    return {id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),savedAt:new Date().toISOString(),owner:g("bailleur-nom"),tenant:g("locataire-nom"),address:g("bien-adresse"),rent:g("loyer-hc"),charges:g("charges"),chargesType:g("type-charges"),quarter:g("trimestre-ref"),dpe:g("classe-dpe"),dpeDate:g("date-dpe"),oldIndex:g("irl-ancien"),newIndex:g("irl-nouveau"),anniversary:g("date-bail-anniv"),sentDate:g("date-envoi"),landlordAddress:g("bailleur-adresse"),leaseDate:g("date-signature-bail"),renewalStatus:g("bail-reconduit"),lastRenewalDate:g("date-derniere-reconduction"),zone:g("zone-logement"),contractType:g("type-contrat"),specialRegime:g("regime-logement"),revisionClause:g("clause-revision"),city:g("ville-redaction")};
  }
  function renderOwnerData() {
    const data=readOwnerData(), list=document.getElementById("saved-properties"), hist=document.getElementById("revision-history"), alerts=document.getElementById("owner-alerts");
    if(!list||!hist||!alerts)return; list.replaceChildren();hist.replaceChildren();
    if(!data.properties.length)list.textContent="Aucun dossier enregistré.";
    data.properties.forEach(p=>{
      const row=document.createElement("div");row.className="saved-row";const label=document.createElement("span");label.textContent=(p.address||"Bien sans adresse")+" — "+(p.tenant||"Locataire non renseigné");
      const load=document.createElement("button");load.type="button";load.className="btn btn-secondary";load.textContent="Charger";
      load.addEventListener("click",()=>{const m={owner:"bailleur-nom",tenant:"locataire-nom",address:"bien-adresse",rent:"loyer-hc",charges:"charges",chargesType:"type-charges",quarter:"trimestre-ref",dpe:"classe-dpe",dpeDate:"date-dpe",oldIndex:"irl-ancien",newIndex:"irl-nouveau",anniversary:"date-bail-anniv",sentDate:"date-envoi",landlordAddress:"bailleur-adresse",leaseDate:"date-signature-bail",renewalStatus:"bail-reconduit",lastRenewalDate:"date-derniere-reconduction",zone:"zone-logement",contractType:"type-contrat",specialRegime:"regime-logement",revisionClause:"clause-revision",city:"ville-redaction"};Object.entries(m).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&p[k]!==undefined)el.value=p[k];});if (refreshIRLSelection) refreshIRLSelection(); else updateIRLCalculation();});
      const del=document.createElement("button");del.type="button";del.className="btn btn-secondary";del.textContent="Supprimer";del.addEventListener("click",()=>{const d=readOwnerData();writeOwnerData({...d,properties:d.properties.filter(x=>x.id!==p.id)});renderOwnerData();});row.append(label,load,del);list.append(row);
    });
    if(!data.history.length)hist.textContent="Aucune révision enregistrée.";
    data.history.slice().reverse().forEach(p=>{const row=document.createElement("div");row.className="saved-row";row.textContent=(p.address||"Bien")+" — "+p.newRent+" € HC — "+new Date(p.savedAt).toLocaleDateString("fr-FR");hist.append(row);});
    const today=new Date();today.setHours(0,0,0,0);
    const horizon=new Date(today);horizon.setDate(horizon.getDate()+30);
    const due=data.properties.map(p=>{if(!p.anniversary||!window.BailClearLegalRules.isValidISODate(p.anniversary))return null;const parts=p.anniversary.split("-").map(Number);let d=new Date(today.getFullYear(),parts[1]-1,parts[2]);d.setHours(0,0,0,0);if(d<today)d=new Date(today.getFullYear()+1,parts[1]-1,parts[2]);return {p,d};}).filter(x=>x&&x.d>=today&&x.d<=horizon);
    alerts.className="alert alert-warning";
    alerts.textContent=due.length?"Révision à anticiper dans les 30 jours : "+due.map(x=>(x.p.address||"Bien")+" ("+x.d.toLocaleDateString("fr-FR")+")").join(" ; ")+".":"Aucun anniversaire de bail dans les 30 prochains jours. Rappel visible uniquement à l’ouverture du site.";
  }
  function initOwnerTools() {
    renderOwnerData();
    document.getElementById("save-property")?.addEventListener("click",()=>{const p=currentProperty();if(!p.address&&!p.tenant){alert("Renseignez au moins l’adresse du logement ou le nom du locataire.");return;}const d=readOwnerData(),i=d.properties.findIndex(x=>x.address===p.address&&x.tenant===p.tenant);if(i>=0){p.id=d.properties[i].id;d.properties[i]=p;}else d.properties.push(p);if(lastLegalCheckAllowsPrint){const amount=Number((Number(p.rent)*Number(p.newIndex)/Number(p.oldIndex)).toFixed(2));d.history.push({id:p.id,address:p.address,newRent:amount.toFixed(2),savedAt:p.savedAt});}writeOwnerData(d);renderOwnerData();alert("Dossier enregistré sur cet appareil.");});
    document.getElementById("export-data")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(readOwnerData(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="bailclear-dossiers.json";a.click();URL.revokeObjectURL(url);});
    document.getElementById("import-data")?.addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(!Array.isArray(v.properties)||!Array.isArray(v.history))throw Error();writeOwnerData(v);renderOwnerData();alert("Import terminé.");}catch(_){alert("Fichier invalide : export JSON BailClear attendu.");}e.target.value="";});
  }

  document.addEventListener("DOMContentLoaded", function () {
    initOwnerTools();
    initDefaultDates();
    checkUrlUnlock();
    applyLicenseUI();
    updateProrataCalculation();
    loadIRLData().then(() => { if (refreshIRLSelection) refreshIRLSelection(); });

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab-btn").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

        this.classList.add("active");
        this.setAttribute("aria-selected", "true");
        const target = document.getElementById(this.dataset.tab);
        if (target) target.classList.add("active");
      });
    });

    function applyIRLDefaults() {
      const result = irlDataset ? window.BailClearIRLIndex.resolvePair(irlDataset, {
        territory: document.getElementById("zone-logement")?.value || "metropole",
        quarterMode: document.getElementById("trimestre-ref")?.value || "auto",
        signatureDate: document.getElementById("date-signature-bail")?.value || "",
        revisionDate: document.getElementById("date-bail-anniv")?.value || ""
      }) : { valid: false, message: selectedIRLPairError };
      selectedIRLPair = result.valid ? result : null;
      selectedIRLPairError = result.valid ? "" : (result.message || "Paire IRL non disponible.");
      document.getElementById("irl-ancien").value = selectedIRLPair ? selectedIRLPair.oldIndex.value.toFixed(2) : "";
      document.getElementById("irl-nouveau").value = selectedIRLPair ? selectedIRLPair.newIndex.value.toFixed(2) : "";
      const hint = document.getElementById("irl-source-note");
      if (hint) {
        hint.textContent = selectedIRLPair
          ? "Source INSEE BDM — " + selectedIRLPair.oldIndex.period + " / " + selectedIRLPair.newIndex.period +
            ". La parution au Journal officiel sert de date prudente ; vérifiez les dates proches d'une publication."
          : selectedIRLPairError;
      }
      updateIRLCalculation();
    }
    refreshIRLSelection = applyIRLDefaults;
    ["trimestre-ref","zone-logement","date-signature-bail","date-bail-anniv"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", applyIRLDefaults);
    });

    document.getElementById("irl-form").addEventListener("input", updateIRLCalculation);
    document.getElementById("irl-form").addEventListener("change", updateIRLCalculation);

    ["prorata-loyer", "prorata-charges", "prorata-type", "prorata-date"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateProrataCalculation);
        el.addEventListener("change", updateProrataCalculation);
      }
    });

    document.getElementById("btn-reset").addEventListener("click", function () {
      document.getElementById("loyer-hc").value = "";
      document.getElementById("charges").value = "";
      document.getElementById("trimestre-ref").value = "auto";
      document.getElementById("classe-dpe").value = "INCONNU";
      document.getElementById("type-contrat").value = "inconnu";
      document.getElementById("clause-revision").value = "inconnu";
      document.getElementById("date-bail-anniv").value = "";
      document.getElementById("date-signature-bail").value = "";
      document.getElementById("date-dpe").value = "";
      document.getElementById("bail-reconduit").value = "inconnu";
      document.getElementById("date-derniere-reconduction").value = "";
      document.getElementById("regime-logement").value = "inconnu";
      document.getElementById("type-charges").value = "inconnu";
      ["bailleur-nom","bailleur-adresse","locataire-nom","bien-adresse","ville-redaction"].forEach(id => document.getElementById(id).value = "");
      applyIRLDefaults();
    });

    document.getElementById("btn-copy-text").addEventListener("click", copyLetterToClipboard);

    document.getElementById("btn-download-pdf").addEventListener("click", function () {
      if (!lastLegalCheckAllowsPrint) { window.alert("Le document est bloqué. Vérifiez le type de bail, la clause de révision, le DPE, les dates et tous les champs du document. Le contrôle ne constitue pas un avis juridique."); return; }
      window.print();
    });

  });
})();
