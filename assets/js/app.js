(function () {
  "use strict";

  const CONFIG = {
    STORAGE_KEY: "bailclear_owner_data_v1"
  };

  // Valeurs métropolitaines INSEE, série 001515333, jusqu'au T3 2026.
  const IRL_PRESETS = {
    T1: { ancien: 145.47, nouveau: 146.60, label: "1er Trimestre (T1)" },
    T2: { ancien: 146.68, nouveau: 148.37, label: "2e Trimestre (T2)" },
    T3: { ancien: 145.77, nouveau: 148.06, label: "3e Trimestre (T3)" },
    T4: { ancien: 144.64, nouveau: 145.78, label: "4e Trimestre (T4)" }
  };

  let lastLegalCheckAllowsPrint = false;

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
    const leaseDate = document.getElementById("date-signature-bail")?.value || "";
    const zone = document.getElementById("zone-logement")?.value || "metropole";
    const messages = [];
    let blocked = false;
    let effectiveDate = formatDateFR(dateAnnivStr || dateEnvoiStr);

    if (dpe === "INCONNU") { blocked = true; messages.push("Classe DPE non renseignée : renseignez le diagnostic avant de préparer une demande de hausse."); }

    if (dpe === "F" || dpe === "G") {
      const cutoff = zone === "outremer" ? "2024-07-01" : "2022-08-24";
      if (!leaseDate) {
        messages.push("DPE F/G : date de conclusion ou de dernière reconduction manquante. Impossible de déterminer l'application du gel.");
      } else if (leaseDate >= cutoff) {
        blocked = true;
        messages.push("DPE F/G : au vu de la date et du territoire renseignés, le gel légal des révisions est susceptible de s'appliquer. Ne générez pas de demande de hausse avant vérification.");
      } else {
        messages.push("DPE F/G : la date indiquée précède le seuil légal, mais vérifiez qu'aucun renouvellement ou reconduction ultérieur n'a eu lieu.");
      }
    }

    if (dateAnnivStr && dateEnvoiStr) {
      const anniversary = new Date(dateAnnivStr + "T00:00:00");
      const request = new Date(dateEnvoiStr + "T00:00:00");
      const deadline = new Date(anniversary);
      deadline.setFullYear(deadline.getFullYear() + 1);
      if (Number.isNaN(anniversary.getTime()) || Number.isNaN(request.getTime())) {
        blocked = true;
        messages.push("Dates invalides : vérifiez la date de révision et la date de demande.");
      } else if (request >= deadline) {
        blocked = true;
        messages.push("Délai d'un an dépassé : la révision correspondant à cette échéance est perdue (article 17-1).");
      } else if (request > anniversary) {
        effectiveDate = formatDateFR(dateEnvoiStr);
        messages.push("Demande postérieure à la date de révision : la hausse ne peut prendre effet qu'à compter de la demande, sans rétroactivité.");
      } else {
        effectiveDate = formatDateFR(dateAnnivStr);
        messages.push("Demande effectuée avant ou à la date de révision : vérifiez que la clause du bail prévoit bien cette date.");
      }
    } else {
      blocked = true;
      messages.push("Renseignez la date de révision prévue au bail et la date de demande pour contrôler le délai légal.");
    }

    if (zone !== "metropole") {
      messages.push("Les indices préremplis sont ceux de la métropole : sélectionnez manuellement les indices officiels du territoire concerné.");
    }

    diagEl.className = blocked ? "alert alert-danger" : "alert alert-warning";
    diagEl.textContent = (blocked ? "Vigilance juridique — hausse non validée : " : "Contrôle partiel — vérification humaine nécessaire : ") + messages.join(" ");
    return { valid: !blocked, effectiveDate };
  }

  function updateIRLCalculation() {
    const loyerHC = Math.max(0, parseFloat(document.getElementById("loyer-hc").value) || 0);
    const charges = Math.max(0, parseFloat(document.getElementById("charges").value) || 0);
    const irlAncien = Math.max(1, parseFloat(document.getElementById("irl-ancien").value) || 1);
    const irlNouveau = Math.max(1, parseFloat(document.getElementById("irl-nouveau").value) || 1);
    const trimestreKey = document.getElementById("trimestre-ref").value;
    const dpe = document.getElementById("classe-dpe").value;
    const dateAnniv = document.getElementById("date-bail-anniv").value;
    const dateEnvoi = document.getElementById("date-envoi").value;

    const rawNouveauHC = loyerHC * (irlNouveau / irlAncien);
    const nouveauHC = Math.round(rawNouveauHC * 100) / 100;
    const diffMensuelle = Math.round((nouveauHC - loyerHC) * 100) / 100;
    const pctVariation = loyerHC > 0 ? ((nouveauHC - loyerHC) / loyerHC) * 100 : 0;
    const ancienCC = Math.round((loyerHC + charges) * 100) / 100;
    const nouveauCC = Math.round((nouveauHC + charges) * 100) / 100;
    const impactAnnuel = Math.round(diffMensuelle * 12 * 100) / 100;

    const sign = diffMensuelle >= 0 ? "+" : "";
    document.getElementById("res-nouveau-hc").textContent = euroFmt.format(nouveauHC);
    document.getElementById("res-variation").textContent = `${sign}${euroFmt.format(diffMensuelle)} / mois (${sign}${pctFmt.format(pctVariation)} %)`;
    document.getElementById("res-nouveau-cc").textContent = euroFmt.format(nouveauCC);
    document.getElementById("res-ancien-cc").textContent = `Ancien total : ${euroFmt.format(ancienCC)}`;
    document.getElementById("res-impact-annuel").textContent = `${sign}${euroFmt.format(impactAnnuel)}`;

    const formuleStr = `${euroFmt.format(loyerHC)} × (${irlNouveau.toFixed(2)} ÷ ${irlAncien.toFixed(2)}) = ${euroFmt.format(nouveauHC)}`;
    document.getElementById("formula-detail").textContent = formuleStr;

    const compliance = evaluateLegalCompliance(dpe, dateAnniv, dateEnvoi);
    lastLegalCheckAllowsPrint = compliance.valid;

    const bailleurNom = escapeText(document.getElementById("bailleur-nom").value, "Nom du Bailleur");
    const bailleurAdresse = escapeText(document.getElementById("bailleur-adresse").value, "Adresse du Bailleur");
    const locataireNom = escapeText(document.getElementById("locataire-nom").value, "Nom du Locataire");
    const bienAdresse = escapeText(document.getElementById("bien-adresse").value, "Adresse du logement loué");
    const dateBailFR = formatDateFR(document.getElementById("date-signature-bail").value);
    const dateEnvoiFR = formatDateFR(dateEnvoi);
    const ville = escapeText(document.getElementById("ville-redaction").value, "Paris");
    const trimestreLabel = IRL_PRESETS[trimestreKey] ? IRL_PRESETS[trimestreKey].label : trimestreKey;

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
    document.getElementById("doc-trimestre-2").textContent = trimestreKey;
    document.getElementById("doc-trimestre-3").textContent = trimestreKey;
    document.getElementById("doc-ancien-hc").textContent = euroFmt.format(loyerHC);
    document.getElementById("doc-irl-ancien").textContent = irlAncien.toFixed(2);
    document.getElementById("doc-irl-nouveau").textContent = irlNouveau.toFixed(2);
    document.getElementById("doc-formule").textContent = `${euroFmt.format(loyerHC)} × (${irlNouveau.toFixed(2)} / ${irlAncien.toFixed(2)})`;
    document.getElementById("doc-variation").textContent = `${sign}${euroFmt.format(diffMensuelle)} (${sign}${pctFmt.format(pctVariation)} %)`;
    document.getElementById("doc-nouveau-hc").textContent = euroFmt.format(nouveauHC);
    document.getElementById("doc-charges").textContent = euroFmt.format(charges);
    document.getElementById("doc-nouveau-cc").textContent = euroFmt.format(nouveauCC);
    document.getElementById("doc-prise-effet").innerHTML = `Ce nouveau montant s'appliquera à compter de votre prochaine échéance de loyer à partir du <strong>${compliance.effectiveDate}</strong>.`;
    document.getElementById("doc-bailleur-sig").textContent = bailleurNom;

    document.getElementById("q-bailleur-nom").textContent = bailleurNom;
    document.getElementById("q-bailleur-adresse").textContent = bailleurAdresse;
    document.getElementById("q-locataire-nom").textContent = locataireNom;
    document.getElementById("q-bien-adresse").textContent = bienAdresse;
    document.getElementById("q-loyer-hc").textContent = euroFmt.format(nouveauHC);
    document.getElementById("q-charges").textContent = euroFmt.format(charges);
    document.getElementById("q-total-table").textContent = euroFmt.format(nouveauCC);
    document.getElementById("q-ville").textContent = ville;
    document.getElementById("q-date").textContent = dateEnvoiFR;
    document.getElementById("q-bailleur-sig").textContent = bailleurNom;
  }

  function updateProrataCalculation() {
    const loyer = Math.max(0, parseFloat(document.getElementById("prorata-loyer").value) || 0);
    const charges = Math.max(0, parseFloat(document.getElementById("prorata-charges").value) || 0);
    const type = document.getElementById("prorata-type").value;
    const dateStr = document.getElementById("prorata-date").value;

    if (!dateStr) return;

    const parts = dateStr.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const occupiedDays = type === "entree" ? (daysInMonth - day + 1) : day;

    const loyerProrata = Math.round(((loyer * occupiedDays) / daysInMonth) * 100) / 100;
    const chargesProrata = Math.round(((charges * occupiedDays) / daysInMonth) * 100) / 100;
    const totalDu = Math.round((loyerProrata + chargesProrata) * 100) / 100;

    document.getElementById("prorata-total-du").textContent = euroFmt.format(totalDu);
    document.getElementById("prorata-detail").textContent =
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
      `Conformément à notre bail signé le ${dateBail} et à l'article 17-1 de la loi n° 89-462 du 6 juillet 1989, je vous informe de la révision annuelle de votre loyer :`,
      `- Ancien loyer hors charges : ${ancienHC}`,
      `- Calcul IRL : ${formule}`,
      `- Nouveau loyer hors charges : ${nouveauHC}`,
      `- Provision sur charges : ${charges}`,
      `- Nouveau total mensuel charges comprises : ${nouveauCC}`,
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
    return {id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),savedAt:new Date().toISOString(),owner:g("bailleur-nom"),tenant:g("locataire-nom"),address:g("bien-adresse"),rent:g("loyer-hc"),charges:g("charges"),quarter:g("trimestre-ref"),dpe:g("classe-dpe"),oldIndex:g("irl-ancien"),newIndex:g("irl-nouveau"),anniversary:g("date-bail-anniv"),sentDate:g("date-envoi"),landlordAddress:g("bailleur-adresse"),leaseDate:g("date-signature-bail"),zone:g("zone-logement"),city:g("ville-redaction")};
  }
  function renderOwnerData() {
    const data=readOwnerData(), list=document.getElementById("saved-properties"), hist=document.getElementById("revision-history"), alerts=document.getElementById("owner-alerts");
    if(!list||!hist||!alerts)return; list.replaceChildren();hist.replaceChildren();
    if(!data.properties.length)list.textContent="Aucun dossier enregistré.";
    data.properties.forEach(p=>{
      const row=document.createElement("div");row.className="saved-row";const label=document.createElement("span");label.textContent=(p.address||"Bien sans adresse")+" — "+(p.tenant||"Locataire non renseigné");
      const load=document.createElement("button");load.type="button";load.className="btn btn-secondary";load.textContent="Charger";
      load.addEventListener("click",()=>{const m={owner:"bailleur-nom",tenant:"locataire-nom",address:"bien-adresse",rent:"loyer-hc",charges:"charges",quarter:"trimestre-ref",dpe:"classe-dpe",oldIndex:"irl-ancien",newIndex:"irl-nouveau",anniversary:"date-bail-anniv",sentDate:"date-envoi",landlordAddress:"bailleur-adresse",leaseDate:"date-signature-bail",zone:"zone-logement",city:"ville-redaction"};Object.entries(m).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&p[k]!==undefined)el.value=p[k];});updateIRLCalculation();});
      const del=document.createElement("button");del.type="button";del.className="btn btn-secondary";del.textContent="Supprimer";del.addEventListener("click",()=>{const d=readOwnerData();writeOwnerData({...d,properties:d.properties.filter(x=>x.id!==p.id)});renderOwnerData();});row.append(label,load,del);list.append(row);
    });
    if(!data.history.length)hist.textContent="Aucune révision enregistrée.";
    data.history.slice().reverse().forEach(p=>{const row=document.createElement("div");row.className="saved-row";row.textContent=(p.address||"Bien")+" — "+p.newRent+" € HC — "+new Date(p.savedAt).toLocaleDateString("fr-FR");hist.append(row);});
    const today=new Date();today.setHours(0,0,0,0);
    const due=data.properties.map(p=>({p,d:p.anniversary?new Date(p.anniversary+"T00:00:00"):null})).filter(x=>x.d).map(x=>{x.d.setFullYear(today.getFullYear());return x;}).filter(x=>x.d>=today&&x.d<=new Date(today.getTime()+30*86400000));
    alerts.className=due.length?"alert alert-warning":"alert alert-success";
    alerts.textContent=due.length?"Révision à anticiper dans les 30 jours : "+due.map(x=>(x.p.address||"Bien")+" ("+x.d.toLocaleDateString("fr-FR")+")").join(" ; ")+".":"Aucun anniversaire de bail dans les 30 prochains jours. Rappel visible uniquement à l’ouverture du site.";
  }
  function initOwnerTools() {
    renderOwnerData();
    document.getElementById("save-property")?.addEventListener("click",()=>{const p=currentProperty();if(!p.address&&!p.tenant){alert("Renseignez au moins l’adresse du logement ou le nom du locataire.");return;}const d=readOwnerData(),i=d.properties.findIndex(x=>x.address===p.address&&x.tenant===p.tenant);if(i>=0){p.id=d.properties[i].id;d.properties[i]=p;}else d.properties.push(p);const amount=Number((Number(p.rent||0)*Number(p.newIndex||1)/Number(p.oldIndex||1)).toFixed(2));d.history.push({id:p.id,address:p.address,newRent:amount.toFixed(2),savedAt:p.savedAt});writeOwnerData(d);renderOwnerData();alert("Dossier enregistré sur cet appareil.");});
    document.getElementById("export-data")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(readOwnerData(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="bailclear-dossiers.json";a.click();URL.revokeObjectURL(url);});
    document.getElementById("import-data")?.addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(!Array.isArray(v.properties)||!Array.isArray(v.history))throw Error();writeOwnerData(v);renderOwnerData();alert("Import terminé.");}catch(_){alert("Fichier invalide : export JSON BailClear attendu.");}e.target.value="";});
  }

  document.addEventListener("DOMContentLoaded", function () {
    initOwnerTools();
    initDefaultDates();
    checkUrlUnlock();
    applyLicenseUI();
    updateIRLCalculation();
    updateProrataCalculation();

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

    document.getElementById("trimestre-ref").addEventListener("change", function () {
      const preset = IRL_PRESETS[this.value];
      const zone = document.getElementById("zone-logement")?.value || "metropole";
      if (preset && zone === "metropole") {
        document.getElementById("irl-ancien").value = preset.ancien.toFixed(2);
        document.getElementById("irl-nouveau").value = preset.nouveau.toFixed(2);
      }
      updateIRLCalculation();
    });
    document.getElementById("zone-logement")?.addEventListener("change", updateIRLCalculation);

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
      document.getElementById("loyer-hc").value = "850.00";
      document.getElementById("charges").value = "65.00";
      document.getElementById("trimestre-ref").value = "T3";
      document.getElementById("classe-dpe").value = "A-E";
      document.getElementById("irl-ancien").value = "145.77";
      document.getElementById("irl-nouveau").value = "148.06";
      updateIRLCalculation();
    });

    document.getElementById("btn-copy-text").addEventListener("click", copyLetterToClipboard);

    document.getElementById("btn-download-pdf").addEventListener("click", function () {
      if (!lastLegalCheckAllowsPrint) { window.alert("Le document ne peut pas être imprimé : renseignez les dates et le DPE, puis traitez les alertes juridiques."); return; }
      window.print();
    });

  });
})();
