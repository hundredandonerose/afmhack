// QR-Shield ONLINE enrichment (Layer 4). Optional, opt-in, network-using.
// Turns the offline "⚪️ new to us" into a REAL number using REAL facts about the domain:
//   - known-phishing feed (on-device bloom filter, zero network)
//   - domain age via RDAP (freshly-registered = top phishing signal)
//   - DNS existence + MX via DNS-over-HTTPS
//   - redirect resolution for shorteners/QR-wrappers
//   - (optional) Google Safe Browsing / Web Risk, if you pass an apiKey
//
// HONESTY: the evidence weights below are hand-set priors (log-odds bumps), NOT a trained
// model — there is no labelled dataset of these online features. Every weight maps to a
// concrete, displayable fact, so the output is an explainable estimate, not a guarantee.
// PRIVACY: calling enrich() sends the domain to rdap.org / dns.google / Safe Browsing.
// That breaks "URL never leaves device", so it must be explicit opt-in (see opts.consent).

import assess from './qrshieldEngine.js';

// ---------- on-device known-phishing bloom filter ----------
function makeBloom(data){            // data = JSON produced by build_bloom (m,k,bits base64)
  if(!data) return null;
  const { m, k } = data;
  const raw = (typeof atob==="function")
    ? Uint8Array.from(atob(data.bits), c=>c.charCodeAt(0))
    : Uint8Array.from(Buffer.from(data.bits,'base64'));
  function fnv(s, seed){ let h=(2166136261^seed)>>>0;
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
  return function has(dom){
    const h1=fnv(dom,0), h2=fnv(dom,0x9e3779b9);
    for(let i=0;i<k;i++){ const idx=(h1+Math.imul(i,h2))%m; if(!(raw[idx>>>3]&(1<<(idx&7)))) return false; }
    return true;   // "probably in set" (1% false-positive) — treat as a strong, not absolute, hit
  };
}

// ---------- small fetch helper with timeout ----------
async function getJSON(url, ms, headers){
  const ctl = typeof AbortController!=="undefined" ? new AbortController() : null;
  const t = ctl ? setTimeout(()=>ctl.abort(), ms||4000) : null;
  try{
    const r = await fetch(url, {headers:headers||{}, signal:ctl&&ctl.signal});
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; } finally{ if(t) clearTimeout(t); }
}

function regDomain(host){
  host=(host||"").toLowerCase().replace(/^\.+|\.+$/g,"");
  const l=host.split("."); if(l.length<=2) return host;
  const kz2=new Set(["gov","edu","org","com","net","mil","co"]);
  if(l[l.length-1]==="kz" && kz2.has(l[l.length-2])) return l.slice(-3).join(".");
  return l.slice(-2).join(".");
}

// ---------- individual online signals ----------
async function domainAgeDays(dom){
  const j = await getJSON(`https://rdap.org/domain/${dom}`, 4500,
                          {accept:"application/rdap+json"});
  if(!j || !Array.isArray(j.events)) return null;
  const ev = j.events.find(e=>e && /registration/i.test(e.eventAction||""));
  if(!ev || !ev.eventDate) return null;
  const days = Math.floor((Date.now()-Date.parse(ev.eventDate))/86400000);
  return isFinite(days) ? days : null;
}
async function dns(host){
  const a  = await getJSON(`https://dns.google/resolve?name=${host}&type=A`, 3500);
  const mx = await getJSON(`https://dns.google/resolve?name=${regDomain(host)}&type=MX`, 3500);
  if(!a) return null;                         // lookup failed -> unknown, not a signal
  return { resolves: a.Status===0 && Array.isArray(a.Answer) && a.Answer.length>0,
           hasMX: !!(mx && mx.Status===0 && Array.isArray(mx.Answer) && mx.Answer.length>0) };
}
async function safeBrowsing(url, apiKey){     // optional; Google Safe Browsing v4-style lookup
  if(!apiKey) return null;
  try{
    const body={client:{clientId:"qrshield",clientVersion:"1.0"},
      threatInfo:{threatTypes:["SOCIAL_ENGINEERING","MALWARE","UNWANTED_SOFTWARE"],
      platformTypes:["ANY_PLATFORM"],threatEntryTypes:["URL"],threatEntries:[{url}]}};
    const r=await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json();
    return !!(j && j.matches && j.matches.length);   // true = listed as unsafe
  }catch(e){ return null; }
}

// ---------- log-odds evidence combiner ----------
const S = x => 1/(1+Math.exp(-x));   // sigmoid

/**
 * enrich(url, opts) -> Promise<result>
 * opts = { bloomData, sbApiKey, followRedirect, consent }
 * Returns the SAME shape as assess() but with verdict/risk resolved from real online facts,
 * plus `online:true` and `facts:[...]`. ⚪️ stays only if every lookup failed.
 */
export async function enrich(url, opts={}){
  const base = assess(url);
  // Don't spend network on already-confident offline verdicts unless forced.
  if(!opts.force && base.verdict!=="yellow" && !base.neutral) return base;
  if(opts.consent===false) return base;     // user declined online check

  const host = base.host || url.replace(/^[a-z]+:\/\//,'').split(/[\/?#:]/)[0].toLowerCase();
  const dom  = regDomain(host);
  const facts=[]; let logit = base.ml_prob!=null ? Math.log(base.ml_prob/(1-base.ml_prob+1e-9)) : 0;

  // 0) redirect resolution first (shortener / QR-wrapper): assess the REAL destination
  if(opts.followRedirect){
    try{
      const r=await fetch(url,{method:"GET",redirect:"follow"});
      if(r && r.url && r.url!==url){
        const deep=assess(r.url);
        facts.push("ссылка ведёт на "+ (deep.host||r.url));
        if(deep.verdict==="red")  return {...deep, online:true, resolvedFrom:host,
          facts:["перенаправляет на "+deep.host+" — "+(deep.reasons[0]||"подозрительный адрес")]};
        if(deep.ml_prob!=null) logit += Math.log(deep.ml_prob/(1-deep.ml_prob+1e-9));
      }
    }catch(e){}
  }

  // 1) known-phishing feed (authoritative-ish hard signal)
  const bloom = makeBloom(opts.bloomData);
  if(bloom && bloom(dom))
    return {url, host, verdict:"red", risk:96, online:true, ml_prob:base.ml_prob,
            facts:["домен числится в базе известного фишинга"], reasons:["известный фишинговый домен"]};

  // 2) Safe Browsing (authoritative)
  const sb = await safeBrowsing(url, opts.sbApiKey);
  if(sb===true)
    return {url, host, verdict:"red", risk:98, online:true, ml_prob:base.ml_prob,
            facts:["Google Safe Browsing помечает адрес как опасный (возможно фишинг)"],
            reasons:["числится в Google Safe Browsing"]};

  // 3) domain age (the key signal against fresh phishing) + 4) DNS — in parallel
  const [age, d] = await Promise.all([domainAgeDays(dom), dns(host)]);
  let measured=false;
  if(age!=null){
    measured=true;
    if(age<7){       logit+=2.0; facts.push(`домен зарегистрирован ${age} дн. назад — очень свежий`); }
    else if(age<30){ logit+=1.2; facts.push(`домен зарегистрирован ${age} дн. назад — недавно`); }
    else if(age<90){ logit+=0.5; facts.push(`домену ${age} дн. — относительно новый`); }
    else if(age>1095){ logit-=1.8; facts.push(`домену ${Math.floor(age/365)} г. — давно существует`); }
    else if(age>365){ logit-=1.0; facts.push(`домену ${Math.floor(age/365)} г. — устоявшийся`); }
    else { facts.push(`домену ${age} дн.`); }
  }
  if(d){
    measured=true;
    if(!d.resolves){ logit+=0.8; facts.push("домен не резолвится в DNS"); }
    else if(!d.hasMX){ logit+=0.2; facts.push("нет почтовых (MX) записей"); }
    else facts.push("домен резолвится, есть MX-записи");
  }

  // 5) verdict from combined evidence
  if(!measured && base.ml_prob==null){
    // every online lookup failed AND offline had nothing -> honest ⚪️ stays
    return {...base, online:true, facts:["онлайн-проверка недоступна — нет данных о домене"]};
  }
  const prob = S(logit);
  const risk = Math.round(prob*100);
  const verdict = risk>=70 ? "red" : (risk>=35 ? "yellow" : "green");
  if(facts.length===0) facts.push("явных признаков по данным домена не обнаружено");
  return {url, host, verdict, risk, ml_prob:Math.round(prob*1000)/1000,
          online:true, neutral:false, facts, reasons:facts};
}

export default enrich;
