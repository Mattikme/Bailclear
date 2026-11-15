(function () {
  "use strict";

  const CONFIG = {
    STORAGE_KEY: "bailclear_owner_data_v1"
  };

  const IRL_PRESETS = {
    T1: { ancien: 143.46, nouveau: 145.47, label: "1er Trimestre (T1)" },
    T2: { ancien: 145.17, nouveau: 146.68, label: "2e Trimestre (T2)" },
    T3: { ancien: 144.51, nouveau: 145.78, label: "3e Trimestre (T3)" },
    T4: { ancien: 144.64, nouveau: 145.78, label: "4e Trimestre (T4)" }
  };

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
    const unlocked = isProUnlocked();
    const badge = document.getElementById("license-badge");
    const sheet = document.getElementById("printable-sheet");
    const watermarkStatus = document.getElementById("watermark-status");
    const btnDownload = document.getElementById("btn-download-pdf");
    const unlockHelp = document.getElementById("unlock-help");

    if (unlocked) {
      badge.textContent = "Pack Pro Activé";
      badge.className = "badge badge-pro";
      sheet.classList.remove("watermarked");
      watermarkStatus.textContent = "Document officiel sans filigrane";
      btnDownload.textContent = "Imprimer / Enregistrer en PDF (Débloqué)";
      if (unlockHelp) unlockHelp.style.display = "none";
    } else {
      badge.textContent = "Version Gratuite";
      badge.className = "badge badge-neutral";
      sheet.classList.add("watermarked");
      watermarkStatus.textContent = "Aperçu avec filigrane";
      btnDownload.textContent = "PDF Pro indisponible — paiement à configurer";
    }
  }

  function initDefaultDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayISO = `${yyyy}-${mm}-${dd}`;

    const dateEnvoiInput = document.getElementById("date-envoi");
    const dateAnnivInput = document.getElementById("date-bail-anniv");
    const dateProrataInput = document.getElementById("prorata-date");

    if (!dateEnvoiInput.value) dateEnvoiInput.value = todayISO;
    if (!dateAnnivInput.value) dateAnnivInput.value = `${yyyy}-${mm}-01`;
    if (!dateProrataInput.value) dateProrataInput.value = todayISO;
  }

  function evaluateLegalCompliance(dpe, dateAnnivStr, dateEnvoiStr) {
    const diagEl = document.getElementById("legal-diagnostic");

    if (dpe === "F" || dpe === "G") {
      diagEl.className = "alert alert-danger";
      diagEl.innerHTML = `<strong>Alerte Interdiction Légale (DPE ${dpe}) :</strong> En France métropolitaine, toute augmentation de loyer est strictement interdite pour les logements classés F ou G (art. 17-1 modifié par la loi Climat et Résilience). Le loyer doit rester gelé à son montant actuel.`;
      return { valid: false, effectiveDate: formatDateFR(dateEnvoiStr) };
    }

    if (dpe === "OUTREMER") {
      diagEl.className = "alert alert-warning";
      diagEl.innerHTML = `<strong>Vigilance Outre-Mer :</strong> Depuis le 1er juillet 2024, le gel des loyers s'applique également aux logements classés F ou G en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte. Vérifiez la classe DPE avant envoi.`;
    }

    if (dateAnnivStr && dateEnvoiStr) {
      const dAnniv = new Date(dateAnnivStr + "T00:00:00");
      const dEnvoi = new Date(dateEnvoiStr + "T00:00:00");
      const diffDays = Math.floor((dEnvoi - dAnniv) / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        diagEl.className = "alert alert-danger";
        diagEl.innerHTML = `<strong>Révision Prescrite (+ de 1 an) :</strong> La date d'envoi dépasse de ${diffDays} jours la date de révision prévue au bail. Conformément à la loi ALUR, la révision pour cette échéance annuelle est définitivement perdue.`;
        return { valid: false, effectiveDate: formatDateFR(dateEnvoiStr) };
      }

      if (diffDays > 0) {
        diagEl.className = "alert alert-warning";
        diagEl.innerHTML = `<strong>Demande tardive (${diffDays} jours après la date anniversaire) :</strong> La révision reste valable, mais la loi ALUR interdit toute rétroactivité. Le nouveau loyer s'applique uniquement à compter du <strong>${formatDateFR(dateEnvoiStr)}</strong> (prorata à appliquer sur le mois en cours).`;
        return { valid: true, effectiveDate: formatDateFR(dateEnvoiStr) };
      }
    }

    if (dpe !== "OUTREMER") {
      diagEl.className = "alert alert-success";
      diagEl.innerHTML = `<strong>Conformité validée :</strong> La demande respecte le délai légal de prescription d'un an (art. 17-1 loi du 6 juillet 1989) et le logement n'est pas soumis au gel énergétique DPE F/G.`;
    }

    return {
      valid: true,
      effectiveDate: formatDateFR(dateAnnivStr || dateEnvoiStr)
    };
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
    document.getElementById("q-bailleur-nom-2").textContent = bailleurNom;
    document.getElementById("q-bailleur-adresse").textContent = bailleurAdresse;
    document.getElementById("q-locataire-nom").textContent = locataireNom;
    document.getElementById("q-locataire-nom-2").textContent = locataireNom;
    document.getElementById("q-bien-adresse").textContent = bienAdresse;
    document.getElementById("q-total-somme").textContent = euroFmt.format(nouveauCC);
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
    return {id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),savedAt:new Date().toISOString(),owner:g("bailleur-nom"),tenant:g("locataire-nom"),address:g("bien-adresse"),rent:g("loyer-hc"),charges:g("charges"),quarter:g("trimestre-ref"),dpe:g("classe-dpe"),oldIndex:g("irl-ancien"),newIndex:g("irl-nouveau"),anniversary:g("date-bail-anniv"),sentDate:g("date-envoi"),landlordAddress:g("bailleur-adresse"),leaseDate:g("date-signature-bail"),city:g("ville-redaction")};
  }
  function renderOwnerData() {
    const data=readOwnerData(), list=document.getElementById("saved-properties"), hist=document.getElementById("revision-history"), alerts=document.getElementById("owner-alerts");
    if(!list||!hist||!alerts)return; list.replaceChildren();hist.replaceChildren();
    if(!data.properties.length)list.textContent="Aucun dossier enregistré.";
    data.properties.forEach(p=>{
      const row=document.createElement("div");row.className="saved-row";const label=document.createElement("span");label.textContent=(p.address||"Bien sans adresse")+" — "+(p.tenant||"Locataire non renseigné");
      const load=document.createElement("button");load.type="button";load.className="btn btn-secondary";load.textContent="Charger";
      load.addEventListener("click",()=>{const m={owner:"bailleur-nom",tenant:"locataire-nom",address:"bien-adresse",rent:"loyer-hc",charges:"charges",quarter:"trimestre-ref",dpe:"classe-dpe",oldIndex:"irl-ancien",newIndex:"irl-nouveau",anniversary:"date-bail-anniv",sentDate:"date-envoi",landlordAddress:"bailleur-adresse",leaseDate:"date-signature-bail",city:"ville-redaction"};Object.entries(m).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&p[k]!==undefined)el.value=p[k];});updateIRLCalculation();});
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
      if (preset) {
        document.getElementById("irl-ancien").value = preset.ancien.toFixed(2);
        document.getElementById("irl-nouveau").value = preset.nouveau.toFixed(2);
      }
      updateIRLCalculation();
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
      document.getElementById("loyer-hc").value = "850.00";
      document.getElementById("charges").value = "65.00";
      document.getElementById("trimestre-ref").value = "T3";
      document.getElementById("classe-dpe").value = "A-E";
      document.getElementById("irl-ancien").value = "144.51";
      document.getElementById("irl-nouveau").value = "145.78";
      updateIRLCalculation();
    });

    document.getElementById("btn-copy-text").addEventListener("click", copyLetterToClipboard);

    document.getElementById("btn-download-pdf").addEventListener("click", function () {
      if (isProUnlocked()) { window.print(); } else { window.alert("Le paiement et l’activation Pro sécurisée ne sont pas configurés. L’aperçu avec filigrane va être imprimé."); window.print(); }
    });

    const modal = document.getElementById("unlock-modal");
    const manualUnlock = document.getElementById("btn-manual-unlock");
    if (manualUnlock) document.getElementById("unlock-help").style.display = "none";
    document.getElementById("btn-manual-unlock").addEventListener("click", function () {
      document.getElementById("unlock-error").hidden = true;
      modal.showModal();
    });

    document.getElementById("btn-close-modal").addEventListener("click", function () {
      modal.close();
    });

    document.getElementById("btn-confirm-code").addEventListener("click", function () {
      const code = (document.getElementById("unlock-code-input").value || "").trim().toUpperCase();
      document.getElementById("unlock-error").textContent = "L’activation par code est désactivée : elle doit être vérifiée par le serveur de paiement.";
      document.getElementById("unlock-error").hidden = false;
    });
  });
})();
