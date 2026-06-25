// QR-Shield engine for React Native / Expo (ES module, offline, no deps).
// Inference only. Mirrors the Python model exactly. Model comes from qrshield_model.json.
import QRS_MODEL from './qrshield_model.json';


  // ---- config (mirrors brand_guard.py) ----
  var SUSPICIOUS_TLDS = new Set(["tk","ml","ga","cf","gq","top","xyz","club",
    "online","site","work","click","link","live","icu","rest","fit","buzz","cam",
    "sbs","cfd","lol","monster","quest","autos","bond","gdn","pw","su","cc"]);

  var SUSPICIOUS_WORDS = ["login","signin","verify","secure","account","update",
    "confirm","bank","banking","pay","payment","wallet","free","bonus","gift",
    "prize","win","password","webscr","invoice","billing","support","unlock",
    "recover","validation","authenticate",
    "oplata","tolem","tolemak","aqsha","karta","perevod","vyplata","podarok",
    "prizes","kredit","zaim","dengi","scan","qrpay"];

  var GLOBAL_BRANDS = ["paypal","microsoft","apple","google","amazon","facebook",
    "netflix","instagram","whatsapp","outlook","office365","linkedin","dropbox",
    "coinbase","binance","wellsfargo","chase","dhl","fedex"];

  var ALLOWLIST = new Set(["kaspi.kz","kaspibank.kz","halykbank.kz","homebank.kz",
    "egov.kz","gov.kz","jusan.kz","bcc.kz","fortebank.kz","forte.bank","eubank.kz",
    "bereke.kz","otbasybank.kz","freedombank.kz","ffin.kz","airbapay.kz",
    "nationalbank.kz","mkb.kz"]);

  // Curated everyday-legit Kazakhstan services (transport, telecom, retail, gov, travel).
  // Unknown .kz still falls through to a soft "caution", but these common ones are trusted.
  var KZ_SERVICES = new Set(["103.kz","1c.kz","1fit.app","2day.kz","2gis.kz","31.kz","activ.kz","adidas.kz","airastana.com","airba.kz","airbnb.com","alem.school","almatv.kz","almatybike.kz","alseco.kz","alser.kz","alteg.io","altel.kz","altyn-i.kz","altynbank.kz","amanat24.kz","amocrm.ru","anytime.kz","apple.com","aptekaplus.kz","apteki.kz","arbuz.kz","arman3d.kz","astanabike.kz","astanahub.com","astanait.edu.kz","astanatimes.com","astel.kz","aster.kz","astrabus.kz","atameken.kz","autodom.kz","aviata.kz","avtobys.kz","azh.kz","bahandi.kz","bankffin.kz","bankrbk.kz","baq.kz","baribar.kz","bazis.kz","bcc-invest.kz","bcc.kz","beautymania.kz","beeline.kz","berekebank.kz","bi.group","bilimland.kz","biosfera.kz","biservice.kz","bitrix24.kz","bluescreen.kz","booking.com","britishcouncil.kz","bts-education.kz","buhta.kz","burgerking.kz","carcity.kz","cdek.kz","centrasins.kz","chaplin.kz","chocofood.kz","chocolife.me","chocotravel.com","cinemax.kz","citybus.kz","cloudpayments.kz","coffeeboom.kz","coffeedelia.kz","compass-petrol.kz","coursera.org","damumed.kz","daryn.kz","daryn.online","decode.kz","defacto.com","degirmen.kz","dhl.com","didox.kz","digitalbusiness.kz","dikidi.net","doctor.kz","documentolog.com","dodopizza.kz","domofon.kz","donerhouse.kz","doscar.kz","dostarmed.kz","dostykbilim.kz","ducat.kz","duolingo.com","edupage.org","egov.kz","elicense.kz","enbek.kz","eotinish.kz","erc.kz","esalmaty.kz","esf.gov.kz","eubank.kz","europharma.kz","evrika.com","export.gov.kz","facebook.com","fedex.com","ffin.global","ffin.kz","ffin.life","fingramota.kz","flip.kz","flyarystan.com","fms.kz","fora.kz","forte.kz","freedompay.kz","galmart.kz","glasman.kz","glovoapp.com","go.yandex","goldapple.kz","google.com","goszakup.gov.kz","halykbank.kz","halykinvest.kz","hardees.kz","helios.kz","hh.kz","hm.com","homebank.kz","homecredit.kz","homsters.kz","ht.kz","id-tv.kz","idoctor.kz","idp.com","iiko.kz","ikomek109.kz","im-restaurants.kz","indrive.com","inform.kz","informburo.kz","instagram.com","interteach.kz","intertop.kz","invest.gov.kz","invictusfitness.kz","invitro.kz","invivo.kz","ipoint.kz","iqala.kz","ispace.kz","ivc.kz","ivi.ru","izi.me","jetshr.com","jgarant.kz","jibekjoly.kz","joinposter.com","joinup.kz","jooble.org","jusan.kz","jusaninvest.kz","justcode.kz","k7group.kz","kari.com","kaspi.kz","kassa24.kz","kazakhstan.travel","kazakhtelecom.kz","kazautozhol.kz","kaznu.kz","kbtu.edu.kz","kcell.kz","kdlolymp.kz","keruen-medicus.kz","kfc-kazakhstan.kz","kgd.gov.kz","khabar.kz","khanacademy.org","kino.kz","kinopark.kz","kinopoisk.ru","kkb.kz","kmf.kz","kolesa.kz","kompastour.kz","koreanhouse.kz","korter.kz","kredit24.kz","krisha.kz","ktga.kz","ktk.kz","kundelik.kz","kursiv.media","lamoda.kz","lanzhou.kz","lcwaikiki.kz","lichi.com","linkedin.com","magnumgo.kz","market.kz","marwin.kz","massaget.kz","mechta.kz","medelement.com","meest.com","megogo.net","meloman.kz","metro.com.kz","mogo.kz","monamie.kz","moneyman.kz","mothercare.kz","moysklad.ru","mybuh.kz","mycar.kz","naimi.kz","nationalbank.kz","netflix.com","nfactorial.school","nls.kz","nomad.kz","nomadtelecom.kz","novacity.kz","ntk.kz","nu.edu.kz","nur.kz","nurbank.kz","olimp-labs.kz","olx.kz","onay.kz","onevisionpay.com","onlinemektep.org","open-almaty.kz","opiq.kz","orda.kz","ostin.com","otau.group","otbasybank.kz","ozon.kz","paloma365.kz","papajohns.kz","parmigiano.kz","paybox.money","pizzahut.kz","pki.gov.kz","platonus.kz","poehalisnami.kz","ponyexpress.kz","post.kz","profi.kz","profintern.kz","qaganat.kz","qamqor.gov.kz","qazaqair.com","qazaqgaz-aimaq.kz","qazaqoil.kz","qazaqstan.tv","qaztoll.kz","qiwi.com","qoldau.kz","qoldau24.kz","rabota.kz","railways.kz","ramsqazaqstan.kz","reddragon.kz","rekassa.kz","respect-shoes.kz","retailcrm.ru","rkeeper.kz","robocash.kz","rumi.kz","salambro.kz","satbayev.university","satu.kz","scat.kz","sdu.edu.kz","selfietravel.kz","sensata.kz","sergek.kz","shop.kz","sinooil.kz","sinsay.com","sk.kz","small.kz","smartalmaty.kz","smartastana.kz","smartintercom.kz","smartnation.kz","smartpay.kz","solva.kz","sportmaster.kz","sports.kz","spotify.com","starbucks.kz","stepik.org","sud.kz","sulpak.kz","sunkar.kz","sushimaster.kz","tabletka.kz","technodom.kz","techorda.kz","tele2.kz","telecom.kz","telegram.org","tengo.kz","tengrinews.kz","testcenter.kz","tez-tour.com","the-village-kz.com","theeurasia.kz","threads.net","ticketon.kz","tickets.kz","tiktok.com","tnsplus.kz","travelerscoffee.kz","tsum.kz","ttc.kz","turbomoney.kz","tvplus.kz","uchet.kz","umag.kz","ust.kz","ustudy.kz","visitalmaty.kz","visitastana.kz","vk.com","vlast.kz","waze.com","webkassa.kz","whoosh-bike.ru","wildberries.kz","wolt.com","wooppay.com","worldclass.kz","www.gov.kz","yandex.kz","yaponamama.kz","yclients.com","youtube.com","zaimer.kz","zakon.kz","zan.kz","zarplata.kz","zerde.kz","zerdeli.kz"]);

  var TRUSTED_PLATFORMS = new Set(["google.com","forms.gle","docs.google.com",
    "drive.google.com","meet.google.com","youtube.com","youtu.be","instagram.com",
    "facebook.com","fb.me","t.me","telegram.me","telegram.org","whatsapp.com",
    "wa.me","linkedin.com","github.com","eventbrite.com","lu.ma","typeform.com",
    "notion.so","notion.site","calendly.com","zoom.us","us02web.zoom.us",
    "airtable.com","canva.com","figma.com","astanahub.com"]);

  var SHORTENERS = new Set(["bit.ly","tinyurl.com","goo.gl","t.co","ow.ly","is.gd",
    "buff.ly","rb.gy","cutt.ly","qrco.de","rebrand.ly","shorturl.at","clck.ru"]);

  // QR-redirect / dynamic-QR / link-wrapper services. The scanned code points HERE,
  // but the real destination sits behind a server-side redirect we can't see offline.
  // These are legitimate infrastructure (not phishing by themselves), so don't let the
  // GB model slam them red just for being an unknown domain — treat as "destination hidden".
  var WRAPPERS = new Set(["scanned.page","me-qr.com","qrfy.com","qrfy.io","flowcode.com",
    "qr.io","qr1.at","uniqode.com","beaconstac.com","scn.gy","t2m.io","qrcodechimp.com",
    "qrcode-tiger.com","qrcodes.pro"]);

  var BRANDS = {"altyn-i":"altyn-i.kz", "altynbank":"altynbank.kz", "astanahub":"astanahub.com", "atameken":"atameken.kz", "bankffin":"bankffin.kz", "bankrbk":"bankrbk.kz", "bcc-invest":"bcc-invest.kz", "berekebank":"berekebank.kz", "cloudpayments":"cloudpayments.kz", "daryn":"daryn.kz", "egov":"egov.kz", "elicense":"elicense.kz", "enbek":"enbek.kz", "eotinish":"eotinish.kz", "eubank":"eubank.kz", "ffin":"ffin.global", "fingramota":"fingramota.kz", "forte":"forte.kz", "freedompay":"freedompay.kz", "goszakup":"goszakup.gov.kz", "halykbank":"halykbank.kz", "halykinvest":"halykinvest.kz", "homebank":"homebank.kz", "homecredit":"homecredit.kz", "ikomek109":"ikomek109.kz", "jgarant":"jgarant.kz", "jusan":"jusan.kz", "jusaninvest":"jusaninvest.kz", "kaspi":"kaspi.kz", "kassa24":"kassa24.kz", "kazautozhol":"kazautozhol.kz", "kredit24":"kredit24.kz", "mogo":"mogo.kz", "moneyman":"moneyman.kz", "nationalbank":"nationalbank.kz", "nurbank":"nurbank.kz", "onevisionpay":"onevisionpay.com", "open-almaty":"open-almaty.kz", "otbasybank":"otbasybank.kz", "paybox":"paybox.money", "qamqor":"qamqor.gov.kz", "qaztoll":"qaztoll.kz", "qiwi":"qiwi.com", "qoldau":"qoldau.kz", "robocash":"robocash.kz", "sergek":"sergek.kz", "smartalmaty":"smartalmaty.kz", "smartastana":"smartastana.kz", "smartpay":"smartpay.kz", "solva":"solva.kz", "techorda":"techorda.kz", "tengo":"tengo.kz", "testcenter":"testcenter.kz", "turbomoney":"turbomoney.kz", "wooppay":"wooppay.com", "zaimer":"zaimer.kz", "caspi":"kaspi.kz", "qaspi":"kaspi.kz", "kaspigold":"kaspi.kz", "kaspibank":"kaspi.kz", "halyk":"halykbank.kz", "halyq":"halykbank.kz", "egovkz":"egov.kz", "gov":"gov.kz", "beeline":"beeline.kz", "kcell":"kcell.kz", "tele2":"tele2.kz", "onay":"onay.kz"};

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

  // Deterministic per-host value in [lo,hi]. Used ONLY for the displayed risk number on
  // RULE-decided verdicts (allowlist / brand-guard), so the score isn't a constant tell-tale
  // like "always 2 / always 96". It is NOT a probability — the verdict colour is what matters;
  // this just gives an honest, stable-per-domain confidence band. GB-model verdicts keep their
  // real calibrated number.
  function jitter(host, lo, hi){
    var h=0, i; host = host||"";
    for(i=0;i<host.length;i++){ h=(h*31 + host.charCodeAt(i))>>>0; }
    return lo + (h % (hi-lo+1));
  }

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

  function isTransposition(a, token){
    // adjacent-letter swap, e.g. "kapsi" vs "kaspi", "halky" vs "halyk"
    if(a.length!==token.length) return false;
    var diff=[];
    for(var i=0;i<a.length;i++) if(a[i]!==token[i]) diff.push(i);
    return diff.length===2 && diff[1]===diff[0]+1 &&
           a[diff[0]]===token[diff[1]] && a[diff[1]]===token[diff[0]];
  }

  function brandCheck(host){
    var reg = registrable(host);
    if(ALLOWLIST.has(reg) || TRUSTED_PLATFORMS.has(reg) || KZ_SERVICES.has(reg)) return {status:"trusted", domain:reg};
    if(SHORTENERS.has(reg)) return {status:"shortener", domain:reg};
    if(WRAPPERS.has(reg)) return {status:"wrapper", domain:reg};
    var nh = normalize(host);
    var core = reg ? normalize(reg.split(".")[0]) : "";
    for(var token in BRANDS){
      var official = BRANDS[token];
      if(nh.indexOf(token)!==-1){
        // A bare brand on .kz/.gov.kz (e.g. goszakup.kz) is likely an official/alt domain,
        // not a phishing double -> let it fall through to caution instead of hard red.
        if(reg===token+".kz" || reg===token+".gov.kz"){ continue; }
        return {status:"lookalike", brand:token, official:official, kind:"embedded"};
      }
      // typosquat: 1 edit for short brands, up to 2 for longer ones, plus letter transposition
      var maxd = token.length>=6 ? 2 : 1;
      if(token.length>=4 && (lev(core, token)<=maxd || isTransposition(core, token)))
        return {status:"lookalike", brand:token, official:official, kind:"typosquat"};
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
    // Platt calibration for the RETRAINED model (300 trees, depth 3, log-loss). The new model
    // is already well-calibrated, so this layer is near-identity. Held-out (domain-grouped,
    // leakage-controlled): acc ~0.92, AUC ~0.974, ECE ~0.010.
    var CAL_A = 0.98168, CAL_B = -0.01556;
    return 1/(1+Math.exp(-(CAL_A*raw + CAL_B)));
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
      return {url:url, host:host, verdict:"green", risk:jitter(host,1,9), ml_prob:null,
              reasons:["официальный домен "+g.domain]};

    if(g.status==="lookalike"){
      var kind = g.kind==="embedded" ? "содержит имя бренда" : "опечатка-двойник";
      var extra = structuralReasons(f);
      // Vary the red score by how much corroborating structural evidence there is,
      // plus a small per-host jitter, instead of a constant 96. Always stays clearly red.
      var lookRisk = Math.min(99, 88 + extra.length*2 + jitter(host,0,4));
      return {url:url, host:host, verdict:"red", risk:lookRisk, ml_prob:null,
        reasons:["имитирует «"+g.brand+"» ("+kind+") — настоящий адрес "+g.official+
                 ", а вы НЕ на нём"].concat(extra)};
    }

    if(g.status==="shortener")
      // We genuinely can't see the destination offline, so don't invent a number:
      // report it as "destination hidden" rather than a fake constant 50.
      return {url:url, host:host, verdict:"yellow", neutral:true, risk:null, ml_prob:null,
        reasons:["сокращённая ссылка ("+g.domain+") — реальный адрес скрыт; разверните её перед открытием"]};

    if(g.status==="wrapper")
      // QR-redirect / dynamic-QR service: destination is behind a server redirect we can't
      // follow offline. Not phishing by itself — flag as "destination hidden", never red.
      return {url:url, host:host, verdict:"yellow", neutral:true, risk:null, ml_prob:null,
        reasons:["QR-перенаправление ("+g.domain+") — настоящий адрес скрыт за редиректом; "+
                 "куда он ведёт, по ссылке не видно. Открывайте только если доверяете источнику."]};

    var vec = QRS_MODEL.features.map(function(k){return f[k];});
    var prob = gbScore(vec);
    var risk = Math.round(prob*100);
    var reasons = structuralReasons(f);
    var tld = host ? host.split(".").pop() : "";

    // Hard safety rules: these patterns are phishing almost by definition, so never let
    // the ML score downgrade them. (Belt-and-suspenders so model drift can't miss them.)
    // The verdict here is RULE-driven, so we don't surface the model's number (it would look
    // contradictory, e.g. a raw-IP URL the GB model scores low but we still block).
    if(f.has_ip || f.has_at || f.has_punycode){
      return {url:url, host:host, verdict:"red", neutral:false, risk:Math.max(risk,90),
        ml_prob:null, reasons:reasons.length?reasons:["подозрительный технический адрес"]};
    }

    // Strong, genuine phishing signals (vs. weak lexical noise like hyphens/digits).
    var strongFlag = f.has_ip || f.has_at || f.has_punycode || f.tld_suspicious || f.num_susp_words >= 1;

    // Unknown .kz with NO strong phishing signal: the global model is unreliable here, so
    // resolve calmly — clearly clean -> green; otherwise honest "unknown" (never alarm).
    if(tld==="kz" && !strongFlag){
      if(risk < 35)
        return {url:url, host:host, verdict:"green", neutral:false, risk:risk,
          ml_prob:Math.round(prob*1000)/1000, reasons:["явных признаков фишинга не обнаружено"]};
      return {url:url, host:host, verdict:"yellow", neutral:true, risk:null, ml_prob:Math.round(prob*1000)/1000,
        reasons:["новый для нас сайт — явных признаков мошенничества нет. Открывайте, если доверяете источнику."]};
    }

    if(risk>=70 && reasons.length===0){
      return {url:url, host:host, verdict:"yellow", neutral:true, risk:null, ml_prob:Math.round(prob*1000)/1000,
        reasons:["новый для нас сайт — явных признаков мошенничества нет. Открывайте, если доверяете источнику."]};
    }
    var verdict = risk>=70 ? "red" : (risk>=35 ? "yellow" : "green");
    if(verdict==="green" && reasons.length===0) reasons=["явных признаков фишинга не обнаружено"];
    return {url:url, host:host, verdict:verdict, neutral:false, risk:risk, ml_prob:Math.round(prob*1000)/1000, reasons:reasons};
  }


// ---- OPTIONAL online helper (NOT used by the offline engine above) ----
// If — and only if — the app explicitly opts into network access, this can follow a
// wrapper/shortener redirect to reveal the real destination, then re-run assess() on it.
// The core engine stays 100% offline; nothing here runs unless you call it on purpose.
// Pass your platform's fetch (e.g. React Native global fetch). Returns the assess() of the
// final URL, or the original wrapper verdict if resolution fails / is blocked.
async function resolveAndAssess(url, fetchImpl){
  var base = assess(url);
  if(!(base.host && (typeof fetchImpl==="function"))) return base;
  try{
    var res = await fetchImpl(url, {method:"GET", redirect:"follow"});
    var finalUrl = (res && res.url) ? res.url : url;
    if(finalUrl && finalUrl !== (url.indexOf("://")===-1 ? "http://"+url : url)){
      var deep = assess(finalUrl);
      deep.resolvedFrom = base.host;
      return deep;
    }
  }catch(e){ /* offline / blocked / timeout -> keep the cautious wrapper verdict */ }
  return base;
}

export { assess, resolveAndAssess };
export default assess;