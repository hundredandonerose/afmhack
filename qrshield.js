/* aldanba — on-device engine (pure JavaScript, no backend, no dependencies).
 * Mirrors the Python model exactly. Requires qrshield_model_data.js loaded first
 * (defines QRS_MODEL).  Exposes window.qrShieldAssess(url) -> verdict object.
 */
(function (root) {
  "use strict";

  // ---- config (mirrors brand_guard.py) ----
  var SUSPICIOUS_TLDS = new Set(["tk","ml","ga","cf","gq","top","xyz","club",
    "online","site","work","click","link","live","icu","rest","fit","buzz","cam",
    "sbs","cfd","lol","monster","quest","autos","bond","gdn","pw","su","cc"]);

  var SUSPICIOUS_WORDS = ["login","signin","verify","secure","account","update",
    "confirm","bank","banking","pay","payment","wallet","free","bonus","gift",
    "prize","win","password","webscr","invoice","billing","support","unlock",
    "recover","validation","authenticate"];

  var GLOBAL_BRANDS = ["paypal","microsoft","apple","google","amazon","facebook",
    "netflix","instagram","whatsapp","outlook","office365","linkedin","dropbox",
    "coinbase","binance","wellsfargo","chase","dhl","fedex"];

  var ALLOWLIST = new Set(["kaspi.kz","kaspibank.kz","halykbank.kz","homebank.kz",
    "egov.kz","gov.kz","jusan.kz","bcc.kz","fortebank.kz","forte.bank","eubank.kz",
    "bereke.kz","otbasybank.kz","freedombank.kz","ffin.kz","airbapay.kz",
    "nationalbank.kz","mkb.kz"]);

  var TRUSTED_PLATFORMS = new Set(["google.com","forms.gle","docs.google.com",
    "drive.google.com","meet.google.com","youtube.com","youtu.be","instagram.com",
    "facebook.com","fb.me","t.me","telegram.me","telegram.org","whatsapp.com",
    "wa.me","linkedin.com","github.com","eventbrite.com","lu.ma","typeform.com",
    "notion.so","notion.site","calendly.com","zoom.us","us02web.zoom.us",
    "airtable.com","canva.com","figma.com","astanahub.com"]);

  var SHORTENERS = new Set(["bit.ly","tinyurl.com","goo.gl","t.co","ow.ly","is.gd",
    "buff.ly","rb.gy","cutt.ly","qrco.de","rebrand.ly","shorturl.at","clck.ru"]);

  var BRANDS = {kaspi:"kaspi.kz", halyk:"halykbank.kz", halykbank:"halykbank.kz",
    homebank:"homebank.kz", egov:"egov.kz", jusan:"jusan.kz", forte:"fortebank.kz",
    fortebank:"fortebank.kz", bcc:"bcc.kz", centercredit:"bcc.kz", eubank:"eubank.kz",
    bereke:"bereke.kz", otbasy:"otbasybank.kz", freedom:"freedombank.kz"};

  var HOMOGLYPH = {"а":"a","е":"e","о":"o","р":"p","с":"c","у":"y","х":"x","к":"k",
    "м":"m","т":"t","в":"b","н":"h","і":"i","ѕ":"s","ӏ":"l","ԁ":"d","ɡ":"g",
    "0":"o","1":"l","3":"e","4":"a","5":"s","7":"t","@":"a","$":"s"};

  var KZ_SECOND_LEVEL = new Set(["gov","edu","org","com","net","mil","co","int"]);

  // ---- helpers ----
  function shannon(s){
    if(!s) return 0;
    var m={}, n=s.length, i, c, e=0;
    for(i=0;i<n;i++){c=s[i]; m[c]=(m[c]||0)+1;}
    for(c in m){var p=m[c]/n; e-=p*Math.log2(p);}
    return e;
  }
  function isIP(h){ return /^(\d{1,3}\.){3}\d{1,3}$/.test(h||"") ? 1 : 0; }

  // Manual parser (keeps Unicode host so Cyrillic homoglyphs survive — URL() would punycode it)
  function parse(url){
    url = String(url).trim();
    if(url.indexOf("://")===-1) url = "http://"+url;
    var scheme = url.slice(0, url.indexOf("://")).toLowerCase();
    var rest = url.slice(url.indexOf("://")+3);
    var authEnd = rest.length;
    ["/","?","#"].forEach(function(ch){var p=rest.indexOf(ch); if(p!==-1&&p<authEnd) authEnd=p;});
    var authority = rest.slice(0, authEnd);
    var path = rest.slice(authEnd);
    if(authority.indexOf("@")!==-1) authority = authority.slice(authority.lastIndexOf("@")+1);
    var host = authority.split(":")[0].toLowerCase();
    var q = ""; var qi = path.indexOf("?"); if(qi!==-1) q = path.slice(qi+1);
    var pth = path.split(/[?#]/)[0];
    return {scheme:scheme, host:host, path:pth, query:q, url:url};
  }

  function normalize(s){
    s = (s||"").toLowerCase();
    var out = "", i;
    for(i=0;i<s.length;i++) out += (HOMOGLYPH[s[i]] || s[i]);
    return out.replace(/rn/g,"m").replace(/vv/g,"w");
  }
  function registrable(host){
    host = (host||"").toLowerCase().replace(/^\.+|\.+$/g,"");
    var l = host.split(".");
    if(l.length<=2) return host;
    if(l[l.length-1]==="kz" && KZ_SECOND_LEVEL.has(l[l.length-2]) && l.length>=3)
      return l.slice(-3).join(".");
    return l.slice(-2).join(".");
  }
  function lev(a,b){
    if(a===b) return 0; if(!a) return b.length; if(!b) return a.length;
    var prev=[], i, j; for(j=0;j<=b.length;j++) prev[j]=j;
    for(i=1;i<=a.length;i++){
      var cur=[i];
      for(j=1;j<=b.length;j++)
        cur[j]=Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+(a[i-1]!==b[j-1]?1:0));
      prev=cur;
    }
    return prev[b.length];
  }

  function brandCheck(host){
    var reg = registrable(host);
    if(ALLOWLIST.has(reg) || TRUSTED_PLATFORMS.has(reg)) return {status:"trusted", domain:reg};
    if(SHORTENERS.has(reg)) return {status:"shortener", domain:reg};
    var nh = normalize(host);
    var core = reg ? normalize(reg.split(".")[0]) : "";
    for(var token in BRANDS){
      var official = BRANDS[token];
      if(nh.indexOf(token)!==-1) return {status:"lookalike", brand:token, official:official, kind:"embedded"};
      if(token.length>=4 && lev(core, token)<=1) return {status:"lookalike", brand:token, official:official, kind:"typosquat"};
    }
    return {status:"unknown"};
  }

  // ---- feature extraction (order MUST equal QRS_MODEL.features) ----
  function features(url){
    var p = parse(url), u = p.url, host = p.host;
    var labels = host ? host.split(".") : [];
    var tld = labels.length>=2 ? labels[labels.length-1] : "";
    var core = labels.length>=2 ? labels[labels.length-2] : (labels[0]||"");
    var digits=0, hdig=0, spec=0, vow=0, i, c;
    for(i=0;i<u.length;i++){ c=u[i];
      if(c>="0"&&c<="9") digits++;
      if("@=?&%_~+!*'();:,$".indexOf(c)!==-1) spec++;
    }
    for(i=0;i<host.length;i++){ c=host[i];
      if(c>="0"&&c<="9") hdig++;
      if("aeiou".indexOf(c)!==-1) vow++;
    }
    var toks = host.split(/[.\-]/).filter(Boolean);
    var lens = toks.map(function(t){return t.length;});
    var lower = u.toLowerCase();
    return {
      url_length:u.length, host_length:host.length,
      num_dots:(host.match(/\./g)||[]).length,
      num_hyphens:(u.match(/-/g)||[]).length,
      num_subdomains:Math.max(labels.length-2,0),
      has_ip:isIP(host),
      num_digits_url:digits, digit_ratio_url:digits/Math.max(u.length,1),
      num_digits_host:hdig, digit_ratio_host:hdig/Math.max(host.length,1),
      num_special:spec, special_ratio:spec/Math.max(u.length,1),
      has_at:u.indexOf("@")!==-1?1:0,
      tld_length:tld.length, tld_suspicious:SUSPICIOUS_TLDS.has(tld)?1:0,
      has_punycode:host.indexOf("xn--")!==-1?1:0,
      host_entropy:shannon(host), core_entropy:shannon(core),
      vowel_ratio_host:vow/Math.max(host.length,1),
      longest_token:lens.length?Math.max.apply(null,lens):0,
      avg_token_len:lens.length?lens.reduce(function(a,b){return a+b;},0)/lens.length:0,
      num_susp_words:SUSPICIOUS_WORDS.reduce(function(a,w){return a+(lower.indexOf(w)!==-1?1:0);},0),
      num_brand_tokens:GLOBAL_BRANDS.reduce(function(a,b){return a+(host.indexOf(b)!==-1?1:0);},0),
      num_hyphens_host:(host.match(/-/g)||[]).length
    };
  }

  // ---- the GB model (exact reconstruction) ----
  function gbScore(vec){
    var s=0, t, nodes, n, node;
    for(t=0;t<QRS_MODEL.trees.length;t++){
      nodes = QRS_MODEL.trees[t]; n=0;
      while(nodes[n][0]!==-2){ node=nodes[n]; n = vec[node[0]]<=node[1] ? node[2] : node[3]; }
      s += nodes[n][4];
    }
    var raw = QRS_MODEL.f0 + QRS_MODEL.lr*s;
    return 1/(1+Math.exp(-raw));
  }

  function structuralReasons(f){
    var r=[];
    if(f.has_ip) r.push("адрес — это IP вместо имени сайта");
    if(f.has_at) r.push("в ссылке есть символ «@» (маскировка реального адреса)");
    if(f.has_punycode) r.push("домен закодирован punycode (xn--) — частый приём подделки");
    if(f.tld_suspicious) r.push("дешёвая доменная зона, популярная у мошенников");
    if(f.num_subdomains>=3) r.push("слишком много поддоменов");
    if(f.num_digits_host>=5) r.push("много цифр в имени домена");
    if(f.num_hyphens_host>=2) r.push("много дефисов в имени домена");
    if(f.num_susp_words>=1) r.push("в ссылке слова-приманки (login/pay/verify и т.п.)");
    if(f.url_length>=75) r.push("необычно длинный адрес");
    return r;
  }

  function assess(url){
    var p = parse(url), host = p.host, f = features(url);
    var g = brandCheck(host);

    if(g.status==="trusted")
      return {url:url, host:host, verdict:"green", risk:2, ml_prob:null,
              reasons:["официальный домен "+g.domain]};

    if(g.status==="lookalike"){
      var kind = g.kind==="embedded" ? "содержит имя бренда" : "опечатка-двойник";
      return {url:url, host:host, verdict:"red", risk:96, ml_prob:null,
        reasons:["имитирует «"+g.brand+"» ("+kind+") — настоящий адрес "+g.official+
                 ", а вы НЕ на нём"].concat(structuralReasons(f))};
    }

    if(g.status==="shortener")
      return {url:url, host:host, verdict:"yellow", risk:50, ml_prob:null,
        reasons:["сокращённая ссылка ("+g.domain+") — реальный адрес скрыт; разверните её перед открытием"]};

    var vec = QRS_MODEL.features.map(function(k){return f[k];});
    var prob = gbScore(vec);
    var risk = Math.round(prob*100);
    var reasons = structuralReasons(f);
    var tld = host ? host.split(".").pop() : "";

    if(risk>=70 && reasons.length===0){
      var note = tld==="kz"
        ? "незнакомый домен .kz; автоматическая проверка для .kz пока ограничена — открывайте, только если доверяете источнику"
        : "незнакомый сайт; явных признаков угрозы нет — открывайте, только если доверяете источнику";
      return {url:url, host:host, verdict:"yellow", risk:50, ml_prob:Math.round(prob*1000)/1000, reasons:[note]};
    }
    var verdict = risk>=70 ? "red" : (risk>=35 ? "yellow" : "green");
    if(verdict==="green" && reasons.length===0) reasons=["явных признаков фишинга не обнаружено"];
    return {url:url, host:host, verdict:verdict, risk:risk, ml_prob:Math.round(prob*1000)/1000, reasons:reasons};
  }

  root.qrShieldAssess = assess;
  if(typeof module!=="undefined") module.exports = {assess:assess, features:features, brandCheck:brandCheck};
})(typeof window!=="undefined" ? window : globalThis);
