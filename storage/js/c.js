(function () {
    const skip = localStorage.getItem("skiploading") === "true";
    const targets = [
        "/home.html",
        "/study.html",
        "/settings.html",
        "/apps.html",
    ];
    const path = window.location.pathname;
    const matchesTarget = targets.some(t => path.endsWith(t));
    if (skip || !matchesTarget) return;
    if (window.__loadingInjected) return;
    window.__loadingInjected = true;
    const iframe = document.createElement("iframe");
    iframe.src = "loading.html";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";
    iframe.style.border = "none";
    iframe.style.zIndex = "999999999";
    iframe.style.background = "#000";
    iframe.style.opacity = "1";
    document.documentElement.appendChild(iframe);
    let loaded = 0;
    let total = 0;
    function sendProgress() {
        const percent = total === 0 ? 0 : (loaded / total) * 100;
        iframe.contentWindow?.postMessage({
            type: "progress",
            value: percent
        }, "*");
    }
    function setupTracking() {
        const resources = performance.getEntriesByType("resource");
        loaded = resources.length;
        const scripts = document.querySelectorAll("script[src]");
        const styles = document.querySelectorAll("link[rel='stylesheet'], link[rel='preload']");
        const bgImages = Array.from(document.querySelectorAll(".study-card"))
            .map(card => {
                const bg = card.style.backgroundImage;
                if (!bg || !bg.startsWith("url(")) return null;
                const url = bg.slice(5, -2);
                return new Promise(res => {
                    const img = new Image();
                    img.onload = img.onerror = res;
                    img.src = url;
                });
            })
            .filter(Boolean);
        const imgs = document.querySelectorAll("img[src]");
        total = scripts.length + styles.length + imgs.length + bgImages.length;
        sendProgress();
        const observer = new PerformanceObserver(list => {
            list.getEntries().forEach(() => {
                loaded++;
                if (loaded > total) total = loaded;
                sendProgress();
            });
        });
        try { observer.observe({ entryTypes: ["resource"] }); } catch(e){}
        const allBgLoaded = Promise.all(bgImages).then(() => {
            loaded += bgImages.length;
            sendProgress();
        });
        if (document.readyState === "complete") {
            loaded = total;
            sendProgress();
        } else {
            window.addEventListener("load", () => {
                loaded = total;
                sendProgress();
            });
        }
    }
    iframe.onload = () => {
        setupTracking();
    };
    window.addEventListener("message", (e) => {
        if (e.data === "xylora-loading-done") {
            iframe.style.transition = "opacity 0.25s ease";
            iframe.style.opacity = "0";
            setTimeout(() => {
                iframe.remove();
            }, 250);
        }
    });
})();

(function () {
  let icon = document.querySelector("link[rel='icon']");
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = "/images/icons/favicon.ico";
    document.head.appendChild(icon);
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  (function () {
    const PRESETS = {
      google: { icon: "/images/icons/google.ico", title: "Google" },
      bing: { icon: "/images/icons/bing.ico", title: "Bing" },
      gmail: { icon: "/images/icons/gmail.ico", title: "Gmail" },
      desmos: { icon: "/images/icons/desmos.ico", title: "Desmos | Graphing Calculator" },
      googleclassroom: { icon: "/images/icons/googleclassroom.ico", title: "Home - Classroom" },
      wikipedia: { icon: "/images/icons/wikipedia.ico", title: "Wikipedia" },
      chrometab: { icon: "/images/icons/chromenewtab.ico", title: "New Tab" },
      googledrive: { icon: "/images/icons/googledrive.ico", title: "My Drive - Google Drive" },
      clever: { icon: "/images/icons/clever.ico", title: "Clever | Portal" },

    };
    const K = "tabcloak";
    const key = localStorage.getItem("tabCloakPreset");
    if (!key) return;
    const p = PRESETS[key];
    if (!p) return;
    if (p.title) document.title = p.title;
    const applyCloak = (doc) => {
      doc.querySelectorAll("link[rel~='icon'],link[rel='shortcut icon']").forEach(n => {
        if (n.getAttribute("data-" + K) !== "1") n.remove();
      });
      const l1 = doc.createElement("link");
      l1.rel = "icon";
      l1.href = p.icon;
      l1.type = "image/x-icon";
      l1.setAttribute("data-" + K, "1");
      const l2 = doc.createElement("link");
      l2.rel = "shortcut icon";
      l2.href = p.icon;
      l2.type = "image/x-icon";
      l2.setAttribute("data-" + K, "1");
      doc.head.appendChild(l1);
      doc.head.appendChild(l2);
      if (p.title) doc.title = p.title;
    };

    const observeHeadChanges = (doc) => {
      const head = doc.head || doc.querySelector("head");
      if (!head) return;
      const observer = new MutationObserver(() => {
        if (!head.querySelector("link[data-" + K + "='1']")) applyCloak(doc);
      });
      observer.observe(head, { childList: true });
      return observer;
    };
    applyCloak(document);
    const obs = observeHeadChanges(document);
    const overrideOpen = window.open;
    window.open = function (...args) {
      const win = overrideOpen.apply(this, args);
      try {
        if (win && win.document) {
          win.document.title = p.title;
          const link = win.document.createElement("link");
          link.rel = "icon";
          link.href = p.icon;
          win.document.head.appendChild(link);
        }
      } catch {}
      return win;
    };
    window.addEventListener("beforeunload", () => { try { if (obs) obs.disconnect(); } catch {} });
  })();
});

(function(){
    const k=localStorage.getItem("panicKey"),
    u=localStorage.getItem("panicUrl")||"https://www.google.com/";
    if(!k)return;
    const keys=new Set(k.split("+")),pressed=new Set();
    function down(e){
        pressed.add(e.key);
        for(let key of keys)if(!pressed.has(key))return;
        document.body.innerHTML="",window.top.location.href=u;
    }
    function up(e){pressed.delete(e.key);}
    document.addEventListener("keydown",down);
    document.addEventListener("keyup",up);
})();

let warn = localStorage.getItem("warningonclose") === "true";
let allowRedirect = false;
document.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.tagName === "A") {
        allowRedirect = true;
        setTimeout(() => { allowRedirect = false; }, 250);
    }
}, true);
window.addEventListener("beforeunload", (e) => {
    if (!allowRedirect && warn && window.top === window.self) {
        e.preventDefault();
        e.returnValue = "";
    }
});

function _isSvgContext() {
    try {
        const p = window.location.pathname;
        return p.endsWith(".svg") || p.endsWith("xylora.svg");
    } catch { return false; }
}

function _getFrameSrc(origin) {
    if (_isSvgContext()) {
        return origin + window.location.pathname;
    }
    return origin + "/index.html";
}

function openAbout() {
    const newWin = window.open("about:blank", "_blank");
    if (!newWin) return;
    const src = _getFrameSrc(window.location.origin);

    newWin.document.write(`
        <html>
        <head></head>
        <body style="margin:0;overflow:hidden">
            <iframe id="xyloraframe" src="${src}" style="width:100vw;height:100vh;border:none"></iframe>
        </body>
        <script>
            const inBlank = true;
            let warn = ${localStorage.getItem("warningonclose") === "true"};
            let allowRedirect = false;
            document.addEventListener("click", function(e) {
                if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.tagName === "A") {
                    allowRedirect = true;
                    setTimeout(() => { allowRedirect = false; }, 250);
                }
            }, true);
            window.addEventListener("beforeunload", (e) => {
                if (!allowRedirect && warn && window.top === window.self) {
                    e.preventDefault();
                    e.returnValue = "";
                }
            });
        </script>
        </html>
    `);
    newWin.document.close();
    const key = localStorage.getItem("tabCloakPreset");
    const PRESETS = {
      google: { icon: "/images/icons/google.ico", title: "Google" },
      bing: { icon: "/images/icons/bing.ico", title: "Bing" },
      gmail: { icon: "/images/icons/gmail.ico", title: "Gmail" },
      desmos: { icon: "/images/icons/desmos.ico", title: "Desmos | Graphing Calculator" },
      googleclassroom: { icon: "/images/icons/googleclassroom.ico", title: "Home" },
      wikipedia: { icon: "/images/icons/wikipedia.ico", title: "Wikipedia" },
      chrometab: { icon: "/images/icons/chromenewtab.ico", title: "New Tab" },
      googledrive: { icon: "/images/icons/googledrive.ico", title: "My Drive" },
      clever: { icon: "/images/icons/clever.ico", title: "Clever | Portal" },

    };
    const p = key && PRESETS[key];
    if (p) {
        if (p.title) newWin.document.title = p.title;
        const link = newWin.document.createElement("link");
        link.rel = "shortcut icon";
        link.href = p.icon;
        link.type = "image/x-icon";
        newWin.document.head.appendChild(link);
    }

    window.top.location.replace("https://google.com");
}
function openBlob() {
    const src = _getFrameSrc(window.location.origin);

    const html = `
        <html>
        <head></head>
        <body style="margin:0;overflow:hidden">
            <iframe id="xyloraframe" src="${src}" style="width:100vw;height:100vh;border:none"></iframe>
        </body>
        <script>
            const inBlank = true;
            let warn = ${localStorage.getItem("warningonclose") === "true"};
            let allowRedirect = false;
            document.addEventListener("click", function(e) {
                if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.tagName === "A") {
                    allowRedirect = true;
                    setTimeout(() => { allowRedirect = false; }, 250);
                }
            }, true);
            window.addEventListener("beforeunload", (e) => {
                if (!allowRedirect && warn && window.top === window.self) {
                    e.preventDefault();
                    e.returnValue = "";
                }
            });
        </script>
        </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const newWin = window.open(url, "_blank");
    if (!newWin) return;
    const key = localStorage.getItem("tabCloakPreset");
    const PRESETS = {
        google: { icon: "/images/icons/google.ico", title: "Google" },
        bing: { icon: "/images/icons/bing.ico", title: "Bing" },
        gmail: { icon: "/images/icons/gmail.ico", title: "Gmail" },
        desmos: { icon: "/images/icons/desmos.ico", title: "Desmos | Graphing Calculator" },
        googleclassroom: { icon: "/images/icons/googleclassroom.ico", title: "Home" },
        wikipedia: { icon: "/images/icons/wikipedia.ico", title: "Wikipedia" },
        chrometab: { icon: "/images/icons/chromenewtab.ico", title: "New Tab" },
        googledrive: { icon: "/images/icons/googledrive.ico", title: "My Drive" },
        clever: { icon: "/images/icons/clever.ico", title: "Clever | Portal" },
    };
    const p = key && PRESETS[key];
    if (p) {
        if (p.title) newWin.document.title = p.title;
        const link = newWin.document.createElement("link");
        link.rel = "shortcut icon";
        link.href = p.icon;
        link.type = "image/x-icon";
        newWin.document.head.appendChild(link);
    }
    
    window.top.location.replace("https://google.com");
}

function loadCustomBg() {
    const bg = localStorage.getItem("customBg")
    if (!bg) return
    let style = document.getElementById("__bgSheet")
    if (!style) {
        style = document.createElement("style")
        style.id = "__bgSheet"
        document.head.appendChild(style)
    }
    style.textContent = `body::before { background-image: url("${bg}") !important }`
}

loadCustomBg()

// html guard im testing
//const HtmlGuard={protections:{antiDevTools(){function e(e){return"function"==typeof e&&!1===window.eval.toString().includes("return")&&window.eval.toString().includes("[native code]")&&window.eval.toString().length<40}let t=setInterval(()=>{e(Date.now)&&e(window.eval)&&4===window.eval("2+2")||(alert("Do not spoof functions!"),document.head.innerHTML="",document.body.innerHTML="",location.reload(),clearInterval(t));let o=Date.now(),r;window.eval("// The use of DevTools is prohibited in this web application\ndebugger"),(r=Date.now())-o>50&&(alert("DevTools not allowed!"),document.head.innerHTML="",document.body.innerHTML="",location.reload(),clearInterval(t))},150)},blockContextMenu(){document.oncontextmenu=()=>!1},blockDrag(){document.ondragstart=()=>!1},blockSelection(){document.onselectstart=()=>!1},blockConsoleOutput(){["log","debug","warn","error","dir","dirxml","assert","table"].forEach(e=>{console[e]=()=>null})}},loader:{loadStyleByRef(e){let t=document.createElement("link");t.rel="stylesheet",t.href=e,document.head.appendChild(t)},loadScriptBySrc(e){let t=document.createElement("script");t.src=e,document.head.appendChild(t)},loadScriptBySrc_ContentLoaded(e){document.addEventListener("DOMContentLoaded",()=>{HtmlGuard.loader.loadScriptBySrc(e)})}}};Math.random()==Math.random()==Math.random()&&(document.head.innerHTML="",document.body.innerHTML="",location.reload()),document.onkeydown=e=>{if(123==event.keyCode||e.ctrlKey&&e.shiftKey&&73==e.keyCode||e.ctrlKey&&e.shiftKey&&74==e.keyCode||e.ctrlKey&&85==e.keyCode)return!1},document.addEventListener("DOMContentLoaded",()=>{function e(){let e="html-guard-attribute",r=":not(["+e+"])";for(let n of document.querySelectorAll("*"+r))for(var l=0;l<o(5,15);l++){let a="";for(var i=0;i<o(10,20);i++)a+=t(1,5)+"\n";n.parentNode.insertBefore(document.createComment(a),n)}for(let d of document.querySelectorAll(":not([id])"+r))d.id=t(5,15);for(let c of document.querySelectorAll("*")){let s=c.attributes;for(let f of s)f.name.startsWith("_")&&(c.setAttribute(f.name.substring(1),f.value),c.removeAttribute(f.name))}for(let u of document.querySelectorAll("*"+r)){for(let h=0;h<o(1,8);h++)u.classList.add(t(6,20));for(let y=0;y<o(10,55);y++)u.setAttribute(t(6,12),1==o(0,1)?t(1,5):"");u.setAttribute(e,"")}}function t(e,t){if(e>t)throw RangeError("min > max");let o=Math.floor(Math.random()*(t-e+1))+e,r="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",n="";for(let l=0;l<o;l++)n+=r.charAt(Math.floor(Math.random()*r.length));return n}function o(e,t){if(e>t)throw RangeError("min > max");return Math.floor(Math.random()*(t-e+1))+e}e(),setInterval(()=>{e()},6e3)});
//HtmlGuard.protections.blockConsoleOutput();
    //HtmlGuard.protections.blockDrag();
    //  HtmlGuard.protections.blockContextMenu();