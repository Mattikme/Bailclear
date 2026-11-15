(function () {
  "use strict";

  const CONFIG = {
    STRIPE_PAYMENT_LINK: "https://buy.stripe.com/VOTRE_LIEN_STRIPE_9EUR",
    VALID_UNLOCK_CODES: ["BAILCLEAR-PRO-2026", "BAILCLEAR-2026"],
    STORAGE_KEY: "bailclear_pro_unlocked_v1"
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

  function isProUnlocked() {
    return localStorage.getItem(CONFIG.STORAGE_KEY) === "true";
  }

  function unlockPro() {
    localStorage.setItem(CONFIG.STORAGE_KEY, "true");
    applyLicenseUI();
  }

  function checkUrlUnlock() {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("unlocked") || "").trim().toUpperCase();
    if (CONFIG.VALID_UNLOCK_CODES.includes(code)) {
      unlockPro();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

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
      btnDownload.textContent = "Télécharger PDF Officiel sans filigrane — 9 €";
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

  document.addEventListener("DOMContentLoaded", function () {
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
      if (isProUnlocked()) {
        window.print();
      } else {
        window.location.href = CONFIG.STRIPE_PAYMENT_LINK;
      }
    });

    const modal = document.getElementById("unlock-modal");
    document.getElementById("btn-manual-unlock").addEventListener("click", function () {
      document.getElementById("unlock-error").hidden = true;
      modal.showModal();
    });

    document.getElementById("btn-close-modal").addEventListener("click", function () {
      modal.close();
    });

    document.getElementById("btn-confirm-code").addEventListener("click", function () {
      const code = (document.getElementById("unlock-code-input").value || "").trim().toUpperCase();
      if (CONFIG.VALID_UNLOCK_CODES.includes(code)) {
        unlockPro();
        modal.close();
        window.print();
      } else {
        document.getElementById("unlock-error").hidden = false;
      }
    });
  });
})();
