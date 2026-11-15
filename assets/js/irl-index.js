/* Résolution temporelle des indices IRL par trimestre et date de disponibilité INSEE. */
(function (root) {
"use strict";
const MAX_REFRESH_AGE_DAYS=14, PUBLICATION_AMBIGUITY_DAYS=3;
function validDate(v){if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
function diffDays(a,b){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000);}
function parts(p){const m=/^(\d{4})-Q([1-4])$/.exec(p||"");return m?{year:Number(m[1]),q:m[2],quarter:"T"+m[2]}:null;}
function isFinal(x){return Boolean(x&&["A","R"].includes(x.status)&&(!x.quality||["DEF","SD"].includes(x.quality))&&Number.isFinite(x.value)&&x.value>0);}
function failure(code,message){return{valid:false,code,message};}
function latestAtDate(observations,date,context){
 const known=observations.filter(x=>validDate(x.dateJo)),undated=observations.filter(x=>!validDate(x.dateJo));
 const before=known.filter(x=>x.dateJo<=date).sort((a,b)=>a.period.localeCompare(b.period));
 const next=known.filter(x=>x.dateJo>date).sort((a,b)=>a.dateJo.localeCompare(b.dateJo)||a.period.localeCompare(b.period))[0];
 const selected=before.at(-1);
 if(!selected){if(next&&diffDays(date,next.dateJo)<=PUBLICATION_AMBIGUITY_DAYS)return failure(context+"_publication_ambiguous","La date est proche d'une publication IRL. Vérifiez la date exacte de mise en ligne sur insee.fr avant de retenir le trimestre.");return failure(context+"_index_missing","Aucun indice IRL définitif du trimestre demandé n'est disponible à la date considérée.");}
 if(undated.find(x=>x.period>selected.period))return failure(context+"_publication_date_unknown","Un indice IRL plus récent existe sans date de publication vérifiable. Le calcul est suspendu.");
 if(next&&diffDays(date,next.dateJo)<=PUBLICATION_AMBIGUITY_DAYS)return failure(context+"_publication_ambiguous","La date est proche d'une publication IRL. Vérifiez la date exacte de mise en ligne sur insee.fr avant de retenir le trimestre.");
 return{valid:true,observation:selected};
}
function resolvePair(dataset,input){
 if(!dataset||dataset.schemaVersion!==1||!dataset.territories)return failure("dataset_missing","La base IRL officielle n'est pas disponible.");
 if(!validDate(dataset.refreshedAt?.slice(0,10)))return failure("dataset_timestamp_missing","La date de mise à jour de la base IRL n'est pas vérifiable.");
 const today=new Date().toISOString().slice(0,10),age=diffDays(dataset.refreshedAt.slice(0,10),today);
 if(age< -1||age>MAX_REFRESH_AGE_DAYS)return failure("dataset_stale","La dernière récupération INSEE date de plus de 14 jours. Le calcul est suspendu jusqu'à vérification de la source.");
 if(!["metropole","corse","outremer"].includes(input.territory))return failure("territory_unknown","Territoire IRL non pris en charge.");
 if(!validDate(input.signatureDate)||!validDate(input.revisionDate))return failure("dates_missing","Renseignez la date de signature initiale et la date de révision prévue au bail.");
 const all=dataset.territories[input.territory];
 if(!Array.isArray(all)||!all.length)return failure("series_missing","Série IRL territoriale indisponible.");
 let quarter=input.quarterMode;
 if(quarter==="auto"){
  const selected=latestAtDate(all.filter(isFinal),input.signatureDate,"signature");
  if(!selected.valid)return selected;
  quarter=parts(selected.observation.period)?.quarter;
  if(!quarter)return failure("reference_quarter_invalid","Trimestre de référence introuvable.");
 }else if(!/^T[1-4]$/.test(quarter||""))return failure("quarter_missing","Sélectionnez le trimestre prévu au bail ou le dernier IRL connu à la date de signature si le bail ne précise pas de trimestre.");
 const matching=all.filter(x=>isFinal(x)&&parts(x.period)?.q===quarter.slice(1)).sort((a,b)=>a.period.localeCompare(b.period));
 const latest=latestAtDate(matching,input.revisionDate,"revision");
 if(!latest.valid)return latest;
 const newIndex=latest.observation,parsed=parts(newIndex.period),oldPeriod=(parsed.year-1)+"-Q"+parsed.q;
 const oldIndex=all.find(x=>x.period===oldPeriod);
 if(!isFinal(oldIndex)||!validDate(oldIndex.dateJo))return failure("old_index_missing","L'ancien indice IRL du même trimestre, un an auparavant, manque ou sa date de publication n'est pas vérifiable.");
 return{valid:true,quarter,oldIndex:{...oldIndex},newIndex:{...newIndex},referenceMode:input.quarterMode,message:input.quarterMode==="auto"?"Trimestre automatique : dernier IRL publié à la date de signature. La date au Journal officiel sert de borne prudente ; les dates proches d'une publication sont suspendues pour contrôle.":"Trimestre explicite : les indices correspondent au trimestre prévu au bail et à la dernière observation définitive disponible à la date de révision."};
}
root.BailClearIRLIndex={resolvePair,validDate};
if(typeof module!=="undefined"&&module.exports)module.exports=root.BailClearIRLIndex;
})(typeof globalThis!=="undefined"?globalThis:this);
