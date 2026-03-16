/* ==========================================================
   SCRIPT.JS — PART 1 / 5
   INTRO + VIDEO + AUDIO ENGINE
   ========================================================== */

/* AUDIO ENGINE */
let audioCtx = null;
let masterGain = null;
let bgmGain = null;
let bgmNodes = [];
let soundOn = true;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();

    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.9;

    bgmGain = audioCtx.createGain();
    bgmGain.connect(masterGain);
    bgmGain.gain.value = 0.0;
  }
}

async function unlockAudio() {
  ensureAudio();
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
}

function playClick() {
  if (!soundOn) return;
  ensureAudio();

  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const hp = audioCtx.createBiquadFilter();

  hp.type = "highpass";
  hp.frequency.value = 600;

  o.type = "triangle";
  o.frequency.setValueAtTime(880, now);
  o.frequency.exponentialRampToValueAtTime(220, now + 0.08);

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.25, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  o.connect(hp);
  hp.connect(g);
  g.connect(masterGain);

  o.start(now);
  o.stop(now + 0.15);
}

function playStart() {
  if (!soundOn) return;
  ensureAudio();
  const now = audioCtx.currentTime;

  const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;

  const lp = audioCtx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  lp.frequency.exponentialRampToValueAtTime(4000, now + 0.35);

  const g1 = audioCtx.createGain();
  g1.gain.setValueAtTime(0, now);
  g1.gain.linearRampToValueAtTime(0.6, now + 0.05);
  g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  noise.connect(lp).connect(g1).connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.42);

  const o = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();

  o.type = "sine";
  o.frequency.setValueAtTime(1200, now + 0.1);
  o.frequency.exponentialRampToValueAtTime(600, now + 0.32);

  g2.gain.setValueAtTime(0, now + 0.1);
  g2.gain.linearRampToValueAtTime(0.45, now + 0.13);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  o.connect(g2).connect(masterGain);
  o.start(now + 0.1);
  o.stop(now + 0.42);
}

/* BGM */
function startBgm() {
  ensureAudio();
  stopBgm();
  const now = audioCtx.currentTime;

  function voice(freq, detune) {
    const o = audioCtx.createOscillator();
    const lp = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    const mod = audioCtx.createOscillator();
    const mg = audioCtx.createGain();

    o.type = "sawtooth";
    o.frequency.value = freq;
    o.detune.value = detune;

    lp.type = "lowpass";
    lp.frequency.value = 600;

    g.gain.value = 0;

    mod.type = "sine";
    mod.frequency.value = 0.075;

    mg.gain.value = 40;

    o.connect(lp).connect(g).connect(bgmGain);
    mod.connect(mg).connect(o.detune);

    o.start();
    mod.start();
    g.gain.linearRampToValueAtTime(0.18, now + 2.4);

    return { o, lp, g, mod, mg };
  }

  bgmNodes.push(voice(110, -7), voice(220, +6));
  bgmGain.gain.linearRampToValueAtTime(0.35, now + 2.0);
}

function stopBgm() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  bgmNodes.forEach((n) => {
    try { n.g.gain.linearRampToValueAtTime(0.0001, now + 0.6); } catch {}
    try { n.o.stop(now + 0.7); } catch {}
    try { n.mod.stop(now + 0.7); } catch {}
  });

  bgmNodes = [];
  if (bgmGain) {
    bgmGain.gain.linearRampToValueAtTime(0, now + 0.5);
  }
}

/* INTRO & VIDEO */
const introEl = document.getElementById("intro");
const startIntroBtn = document.getElementById("startIntro");
const skipIntroBtn = document.getElementById("skipIntro");
const videoOverlay = document.getElementById("videoOverlay");
const vidCanvas = document.getElementById("vidCanvas");
const videoSkipBtn = document.getElementById("videoSkip");

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

startIntroBtn.addEventListener("click", async () => {
  await unlockAudio();
  playStart();
  introEl.style.display = "none";
  showCyberVideo();
});

skipIntroBtn.addEventListener("click", () => {
  introEl.style.display = "none";
  showCyberVideo();
});

let videoReq = null;
let videoStartTime = 0;

function showCyberVideo() {
  videoOverlay.style.display = "flex";
  startCyberVideo();
}

function hideCyberVideo() {
  videoOverlay.style.display = "none";
  stopCyberVideo();
  startFinalGame();
}

videoSkipBtn.addEventListener("click", hideCyberVideo);

function startCyberVideo() {
  const ctx = vidCanvas.getContext("2d");
  videoStartTime = performance.now();

  const messages = [
    "GEEN GEVOELIGE DATA IN AI‑TOOLS",
    "MASKER PII (naam, adres, BSN, wachtwoord)",
    "Gebruik alleen goedgekeurde AI‑platformen",
    "Controleer altijd: ‘Mag dit gedeeld worden?’",
    "Cyber Awareness: Level ↑"
  ];

  function loop(now) {
    const t = (now - videoStartTime) / 16.6;

    ctx.fillStyle = "#060b18";
    ctx.fillRect(0, 0, vidCanvas.width, vidCanvas.height);

    const idx = Math.min(messages.length - 1, Math.floor(t / 70));

    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#00e5ff";
    ctx.textAlign = "center";
    ctx.fillText(messages[idx], vidCanvas.width / 2, vidCanvas.height / 2);

    if (now - videoStartTime > 15000) {
      hideCyberVideo();
      return;
    }

    videoReq = requestAnimationFrame(loop);
  }

  videoReq = requestAnimationFrame(loop);
}

function stopCyberVideo() {
  if (videoReq) cancelAnimationFrame(videoReq);
}

function startFinalGame() {
  unlockAudio().then(() => {
    if (soundOn) startBgm();
  });

  if (typeof start === "function") start();
}
/* ==========================================================
   SCRIPT.JS — PART 2 / 5
   i18n, UI Helpers, Global State, Missions Loader
   ========================================================== */

/* ---------------- I18N (dil sistemi) ---------------- */
const I18N = {
  nl: {
    status_active: 'STATUS: ACTIEF',
    status_corp: 'STATUS: CORPORATE',
    comms: 'COMMUNICATIELOGBOEK',
    start: 'SYSTEEM STARTEN (Klik om te starten)',
    close_fact: 'Ik begrijp het risico',
    end_title: 'Resultaten van de Operatie',
    score1: 'NALEVINGSSCORE',
    score2: 'BEVEILIGDE DATAPAKKETTEN',
    risk: 'RISICONIVEAU',
    syslog: 'SYSTEEMLOG:',
    waiting: 'Wachten op operatorauthenticatie...',
    low: 'LAAG',
    mid: 'MIDDEL',
    high: 'HOOG',
    lbl_corp: 'Corporate Mode (BIO/NIS2/AVG)',
    lbl_sound: 'Geluid aan',
    lbl_lang: 'Taal',
    lbl_brand: 'Merk‑kleur',
    lbl_logo: 'Logo',
    fact_title: '💡 Wist je dat? (Casestudy)',
    net_stream: 'NETWORK_PACKET_STREAM',
    risk_pkt: '[RISK] API_KEY_SYNC',
    safe_pkt: '[SAFE] UI_REFRESH',
    send_ai: 'VERZENDEN NAAR CLOUD AI',
    retry: 'OPNIEUW',
    tip_mask: 'Tip: Masker naam, adres, BSN, wachtwoord, e‑mail, IP…',
    mission: 'Missie',
    standard: '(Standaard)',
    corporate: '(Corporate)',
    accepted: 'Beslissing geaccepteerd.',
    detected: 'Risico op beveiligingsincident gedetecteerd.',
    see_case: 'Bekijk de casestudy.',
    name_prompt: 'Naam (pseudoniem is prima):',
    masked_ok: 'Maskeren: VOLLEDIG',
    masked_bad: 'Maskeren: ONVOLDOENDE',
    choice: 'Jouw keuze',
    correct: '✔ Correct',
    wrong: '✖ Fout'
  },

  en: {
    status_active: 'STATUS: ACTIVE',
    status_corp: 'STATUS: CORPORATE',
    comms: 'COMMUNICATIONS LOG',
    start: 'SYSTEM START (Click to Init)',
    close_fact: 'I understand the risk',
    end_title: 'Operation Results',
    score1: 'COMPLIANCE SCORE',
    score2: 'SECURED DATA BATCHES',
    risk: 'RISK LEVEL',
    syslog: 'SYSTEM LOG:',
    waiting: 'Waiting for operator authentication...',
    low: 'LOW',
    mid: 'MEDIUM',
    high: 'HIGH',
    lbl_corp: 'Corporate Mode (BIO/NIS2/AVG)',
    lbl_sound: 'Sound on',
    lbl_lang: 'Language',
    lbl_brand: 'Brand color',
    lbl_logo: 'Logo',
    fact_title: '💡 Did you know? (Case Study)',
    net_stream: 'NETWORK_PACKET_STREAM',
    risk_pkt: '[RISK] API_KEY_SYNC',
    safe_pkt: '[SAFE] UI_REFRESH',
    send_ai: 'SEND TO CLOUD AI',
    retry: 'RETRY',
    tip_mask: 'Tip: Mask name, address, national ID, password, email, IP…',
    mission: 'Mission',
    standard: '(Standard)',
    corporate: '(Corporate)',
    accepted: 'Decision accepted.',
    detected: 'Security incident risk detected.',
    see_case: 'See case study.',
    name_prompt: 'Name (pseudonym is fine):',
    masked_ok: 'Masking: COMPLETE',
    masked_bad: 'Masking: INCOMPLETE',
    choice: 'Your choice',
    correct: '✔ Correct',
    wrong: '✖ Wrong'
  }
};

let LANG = localStorage.getItem("lang") || "nl";

/* Çeviri fonksiyonu */
function t(k) {
  return (I18N[LANG] && I18N[LANG][k]) || I18N["nl"][k] || k;
}

/* ---------------- GLOBAL STATE ---------------- */
let PLAYER = localStorage.getItem("player_name") || null;
let step = 0;
let hp = 100;
let score = 0;
let corporateMode = false;
const decisions = [];

/* ---------------- DOM HELPERS ---------------- */
function $(s, root = document) {
  return root.querySelector(s);
}
function $all(s, root = document) {
  return Array.from(root.querySelectorAll(s));
}

/* ---------------- UI LANGUAGE APPLY ---------------- */
function applyLanguage() {
  $("#status").textContent = corporateMode ? t("status_corp") : t("status_active");
  $("#lbl-comms").textContent = t("comms");
  $("#btn-start") && ($("#btn-start").textContent = t("start"));
  $("#fact-title").textContent = t("fact_title");
  $("#btn-close-fact").textContent = t("close_fact");
  $("#end-title").textContent = t("end_title");

  $("#lbl-m1").textContent = t("score1");
  $("#lbl-m2").textContent = t("score2");
  $("#lbl-m3").textContent = t("risk");

  $("#lbl-log").textContent = t("syslog");
  $("#log-line").textContent = t("waiting");

  $("#lbl-corp").textContent = t("lbl_corp");
  $("#lbl-sound").textContent = t("lbl_sound");
  $("#lbl-lang").textContent = t("lbl_lang");
  $("#lbl-brand").textContent = t("lbl_brand");
  $("#lbl-logo").textContent = t("lbl_logo");
}

/* ---------------- RISK LEVEL ---------------- */
function riskLevelFromHP(v) {
  if (v >= 80) return t("low");
  if (v >= 50) return t("mid");
  return t("high");
}

function refreshRiskUI() {
  const r = riskLevelFromHP(hp);
  const el = $("#risk-val");
  el.textContent = r;
  el.style.color =
    r === t("low")
      ? "#00ff41"
      : r === t("mid")
      ? "#f1c40f"
      : "#ff3131";
}

/* ---------------- CHAT LOGGER ---------------- */
function appendChat(msg) {
  const cb = $("#chat-box");
  const d = document.createElement("div");
  d.className = "chat-msg";

  const h = document.createElement("span");
  h.style.color = "var(--accent)";
  h.style.fontSize = "10px";
  h.textContent = "[INCOMING]";

  const br = document.createElement("br");
  const b = document.createElement("span");
  b.textContent = msg;

  d.appendChild(h);
  d.appendChild(br);
  d.appendChild(b);

  cb.appendChild(d);
  cb.scrollTop = cb.scrollHeight;
}

/* ---------------- TERMINAL TYPE EFFECT ---------------- */
function typeTerminal(text, i = 0, done = null) {
  const el = $("#terminal-content");
  if (i === 0) el.textContent = "";

  if (i < text.length) {
    el.textContent += text.charAt(i);
    Sound.play("snd-type");
    setTimeout(() => typeTerminal(text, i + 1, done), 24);
  } else if (done) {
    done();
  }
}

/* ---------------- BADGES ---------------- */
function pushBadge() {
  const lb = $("#live-badges");
  lb.innerHTML = "";

  const badges = [];

  if (score >= 2) {
    badges.push({
      cls: "green",
      text: LANG === "nl" ? "Privacybeschermer" : "Privacy Guardian"
    });
  }

  if (score >= 3) {
    badges.push({
      cls: "blue",
      text: LANG === "nl" ? "Shadow‑AI‑jager" : "Shadow‑AI Hunter"
    });
  }

  const allMissions = getActiveMissions();
  if (decisions.length === allMissions.length && decisions.every((d) => d.ok)) {
    badges.push({
      cls: corporateMode ? "purple" : "gold",
      text:
        corporateMode
          ? LANG === "nl"
            ? "Compliance‑kampioen (BIO/NIS2/AVG)"
            : "Compliance Champion (BIO/NIS2/GDPR)"
          : LANG === "nl"
          ? "Beleidsbewaker"
          : "Policy Enforcer"
    });
  }

  badges.forEach((b) => {
    const s = document.createElement("span");
    s.className = `badge ${b.cls}`;
    s.innerHTML = `<span class="dot"></span>${b.text}`;
    lb.appendChild(s);
  });
}

/* ---------------- DEFAULT MISSIONS ---------------- */
function buildDefaultMissions() {
  const m = [];

  /* Mission 1 */
  m.push({
    type: "choice",
    sender: "Dev-Team Lead",
    msg: {
      nl: "Hé, we hebben een bug in de code van de betaalmodule. Ik wil de broncode even door ChatGPT laten checken op fouten. Goed?",
      en: "Hey, we found a bug in the payment module. Can I paste the source code into ChatGPT to check for errors?"
    },
    terminal: {
      nl: "> WAARSCHUWING: Uploaden van bedrijfseigen broncode gedetecteerd.",
      en: "> WARNING: Upload of proprietary source code detected."
    },
    fact: {
      nl: "In 2023 lekte personeel van Samsung per ongeluk vertrouwelijke broncode door het in ChatGPT te plakken.",
      en: "In 2023, confidential source code leaked when staff pasted it into ChatGPT."
    },
    choices: [
      {
        text: {
          nl: "STOP: Broncode delen is verboden.",
          en: "STOP: Sharing source code is forbidden."
        },
        ok: true,
        feedback: {
          nl: "Correct! Gebruik alleen goedgekeurde interne code‑analyzers.",
          en: "Correct! Use approved internal code analyzers only."
        }
      },
      {
        text: {
          nl: "DOEN: Alleen de specifieke functie.",
          en: "DO IT: Just the specific function."
        },
        ok: false,
        feedback: {
          nl: "LEK: De broncode kan nu door de AI‑leverancier worden gebruikt.",
          en: "LEAK: The code may now be used by the AI vendor."
        }
      }
    ]
  });

  /* Mission 2 */
  m.push({
    type: "choice",
    sender: "HR‑manager",
    msg: {
      nl: "Ik wil de cv's van 50 kandidaten samenvatten met een handige AI‑tool.",
      en: "I want to summarize 50 candidates’ resumes with a handy AI tool."
    },
    terminal: {
      nl: "> PRIVACYCHECK: Bevat 50× PII (persoonsgegevens).",
      en: "> PRIVACY CHECK: Contains 50× PII (personal data)."
    },
    fact: {
      nl: "Een Italiaanse privacytoezichthouder blokkeerde ChatGPT tijdelijk i.v.m. AVG.",
      en: "An Italian DPA temporarily blocked ChatGPT due to GDPR concerns."
    },
    choices: [
      {
        text: {
          nl: "ANONIMISEREN: Namen/BSN eerst verwijderen.",
          en: "ANONYMIZE: Remove names/IDs first."
        },
        ok: true,
        feedback: {
          nl: "Heel goed. Dataminimalisatie is de sleutel.",
          en: "Good. Data minimization is key."
        }
      },
      {
        text: {
          nl: "UPLOADEN: De AI is beveiligd.",
          en: "UPLOAD: The AI is secure."
        },
        ok: false,
        feedback: {
          nl: "AVG‑overtreding: Ongeoorloofde verwerking.",
          en: "GDPR violation: Unlawful processing."
        }
      }
    ]
  });

  /* Mission 3 */
  m.push({
    type: "choice",
    sender: "Systeembericht",
    msg: {
      nl: "Een medewerker heeft een gratis ‘AI‑PDF‑Unlocker’ extensie geïnstalleerd.",
      en: "An employee installed a free ‘AI‑PDF‑Unlocker’ extension."
    },
    terminal: {
      nl: "> MALWARESCAN: Extensie heeft ‘Read All Data’‑rechten.",
      en: "> MALWARE SCAN: Extension has ‘Read All Data’ permissions."
    },
    fact: {
      nl: "Veel ‘gratis’ AI‑tools verdienen aan data die je uploadt.",
      en: "Many ‘free’ AI tools monetize the data you upload."
    },
    choices: [
      {
        text: {
          nl: "VERWIJDEREN: Extensie blokkeren.",
          en: "REMOVE: Block the extension."
        },
        ok: true,
        feedback: {
          nl: "Veiligheid hersteld. Shadow AI is een groot risico.",
          en: "Security restored. Shadow AI is a major risk."
        }
      },
      {
        text: {
          nl: "NEGEREN: Handige tool.",
          en: "IGNORE: It’s a handy tool."
        },
        ok: false,
        feedback: {
          nl: "INFILTRATIE: Extensie kopieert data.",
          en: "INFILTRATION: The extension copies data."
        }
      }
    ]
  });

  return m;
}

/* ---------------- CORPORATE MISSIONS ---------------- */
function buildCorporateMissions() {
  const m = [];

  m.push({
    type: "choice",
    sender: "Zaakbeheerder (Gemeente)",
    msg: {
      nl: "BRP‑export met naam/adres/BSN — AI samenvatten?",
      en: "BRP export with name/address/ID — summarize with AI?"
    },
    terminal: {
      nl: "> AVG/UAVG‑CHECK: BSN en persoonsgegevens aanwezig.",
      en: "> GDPR/Local ID check: contains national IDs."
    },
    fact: {
      nl: "BSN verwerken alleen met grondslag; geen externe AI zonder DPA.",
      en: "National IDs require legal basis; no external AI without DPA."
    },
    choices: [
      {
        text: {
          nl: "STOP & ANONIMISEREN (on‑prem).",
          en: "STOP & ANONYMIZE (on‑prem)."
        },
        ok: true,
        feedback: {
          nl: "Juist. Minimaliseer data, werk met verwerker + DPA.",
          en: "Right. Minimize data; use processor + DPA."
        }
      },
      {
        text: {
          nl: "Upload naar publieke AI met “no training”.",
          en: "Upload to public AI with 'no training'."
        },
        ok: false,
        feedback: {
          nl: "Onvoldoende waarborgen.",
          en: "Insufficient safeguards."
        }
      }
    ]
  });

  m.push({
    type: "choice",
    sender: "Woo‑coördinator",
    msg: {
      nl: "Woo‑verzoek met duizenden e‑mails.",
      en: "FOI request with thousands of emails."
    },
    terminal: {
      nl: "> BIO: BBN2/BBN3 mogelijk. Pseudonimisering.",
      en: "> Security baseline applies. Pseudonymization required."
    },
    fact: {
      nl: "Gebruik verwerkers met DPA en logging.",
      en: "Use processors with DPA and logging."
    },
    choices: [
      {
        text: {
          nl: "Interne AI met DPA + logging.",
          en: "Internal AI with DPA + logging."
        },
        ok: true,
        feedback: {
          nl: "Goed. Minimalisatie + logging.",
          en: "Good. Minimization + logging."
        }
      },
      {
        text: {
          nl: "Gratis webtool gebruiken.",
          en: "Use a free web tool."
        },
        ok: false,
        feedback: {
          nl: "Risico op datalek.",
          en: "Risk of data leak."
        }
      }
    ]
  });

  return m;
}
/* ==========================================================
   SCRIPT.JS — PART 3 / 5
   MASK MISSIONS (PII Masking Engine)
   ========================================================== */

function renderMaskMission(mission) {
  const area = $("#choices-area");
  area.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "mask-wrap";
  wrap.id = "mask-editor";

  // PII bloklarını ayırıyoruz
  const parts = (mission.body[LANG] || mission.body["nl"]).split(/(\{\{.*?\}\})/g);

  parts.forEach((p) => {
    if (p.startsWith("{{") && p.endsWith("}}")) {
      const val = p.slice(2, -2);

      const span = document.createElement("span");
      span.className = "pii";
      span.tabIndex = 0;
      span.setAttribute("role", "button");
      span.setAttribute("aria-pressed", "false");
      span.textContent = val;

      span.addEventListener("click", () => toggleMask(span));
      span.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleMask(span);
        }
      });

      wrap.appendChild(span);
      wrap.appendChild(document.createTextNode(" "));
    } else {
      wrap.appendChild(document.createTextNode(p));
    }
  });

  area.appendChild(wrap);

  /* Kontrol butonları */
  const ctr = document.createElement("div");
  ctr.className = "mask-controls";

  const sendBtn = document.createElement("button");
  sendBtn.className = "choice-btn";
  sendBtn.textContent = t("send_ai");
  sendBtn.onclick = () => evaluateMaskMission(mission);

  const retryBtn = document.createElement("button");
  retryBtn.className = "choice-btn";
  retryBtn.style.borderColor = "var(--accent)";
  retryBtn.style.color = "var(--accent)";
  retryBtn.textContent = t("retry");
  retryBtn.onclick = () => renderMaskMission(mission);

  const note = document.createElement("div");
  note.className = "note";
  note.textContent = t("tip_mask");

  ctr.appendChild(sendBtn);
  ctr.appendChild(retryBtn);

  area.appendChild(ctr);
  area.appendChild(note);
}

function toggleMask(el) {
  el.classList.toggle("masked");
  const prev = el.getAttribute("aria-pressed") === "true";
  el.setAttribute("aria-pressed", String(!prev));
  Sound.play("snd-type");
}

function evaluateMaskMission(mission) {
  const unmasked = [...document.querySelectorAll("#mask-editor .pii")]
    .filter((x) => !x.classList.contains("masked"));

  if (unmasked.length > 0) {
    // HATA — Maskelenmeyen PII var
    hp -= 34;
    if (hp < 0) hp = 0;

    $("#hp-val").textContent = hp + "%";
    refreshRiskUI();
    Sound.play("snd-alarm");

    const list = unmasked.map((x) => x.textContent).join(", ");

    $("#fact-text").textContent =
      (mission.fact_fail[LANG] || mission.fact_fail["nl"]) +
      "\n\n" +
      (LANG === "nl" ? "Niet gemaskeerd: " : "Unmasked: ") +
      list;

    decisions.push({
      missionIndex: step,
      choiceText: t("masked_bad"),
      ok: false,
      feedback: "PII incomplete"
    });

    $("#log-line").textContent = t("detected");
  } else {
    // BAŞARI
    score += 1;
    $("#score-val").textContent = String(score);
    Sound.play("snd-success");

    $("#fact-text").textContent =
      mission.fact_ok[LANG] || mission.fact_ok["nl"];

    decisions.push({
      missionIndex: step,
      choiceText: t("masked_ok"),
      ok: true,
      feedback: "PII correct"
    });

    $("#log-line").textContent = t("accepted");
  }

  pushBadge();
  showFact();
}
/* ==========================================================
   SCRIPT.JS — PART 4 / 5
   SCANNER MISSIONS (Network Packet Interception Game)
   ========================================================== */

let scInt = null;
let scTick = null;
let scEndTo = null;

function renderScannerMission(m) {
  const area = $("#choices-area");
  area.innerHTML = "";

  /* Kutu */
  const box = document.createElement("div");
  box.className = "scanner";

  const head = document.createElement("div");
  head.className = "sc-head";

  const left = document.createElement("div");
  left.textContent = t("net_stream");

  const timer = document.createElement("div");
  timer.id = "sc-timer";
  timer.style.color = "var(--neon-red)";
  timer.textContent = formatTime(m.duration);

  head.appendChild(left);
  head.appendChild(timer);

  const stream = document.createElement("div");
  stream.className = "sc-stream";
  stream.id = "sc-stream";

  const legend = document.createElement("div");
  legend.className = "sc-legend";
  legend.innerHTML = `
    <span><span class="sc-dot r"></span>[RISK]</span>
    <span><span class="sc-dot s"></span>[SAFE]</span>
  `;

  box.appendChild(head);
  box.appendChild(stream);
  box.appendChild(legend);

  area.appendChild(box);

  /* Sayaç */
  let tsec = m.duration;
  let hits = 0;
  let miss = 0;
  let fals = 0;

  scTick = setInterval(() => {
    tsec--;
    timer.textContent = formatTime(tsec);
    if (tsec <= 0) finish();
  }, 1000);

  /* Paket oluşturma */
  scInt = setInterval(() => {
    const p = document.createElement("div");
    const danger = Math.random() > 0.6;

    p.className = "packet " + (danger ? "danger" : "safe");
    p.textContent = danger ? t("risk_pkt") : t("safe_pkt");
    p.style.left = Math.random() * 80 + 5 + "%";

    p.onclick = () => {
      if (danger) {
        hits++;
        score += m.hitReward;
        Sound.play("snd-success");
      } else {
        fals++;
        hp -= m.falsePenalty;
        if (hp < 0) hp = 0;
        Sound.play("snd-alarm");
      }
      p.remove();
      updateUI();
    };

    stream.appendChild(p);

    setTimeout(() => {
      if (p.parentNode) {
        if (danger) {
          miss++;
          hp -= m.missPenalty;
          if (hp < 0) hp = 0;
        }
        p.remove();
        updateUI();
      }
    }, 5200);

    function updateUI() {
      $("#hp-val").textContent = hp + "%";
      $("#score-val").textContent = String(score);
      refreshRiskUI();
    }
  }, m.spawnInterval);

  /* Bitiş */
  scEndTo = setTimeout(finish, m.duration * 1000);

  function finish() {
    clearInterval(scInt);
    clearInterval(scTick);
    clearTimeout(scEndTo);

    const ok =
      hits >= m.successThreshold &&
      miss < m.successThreshold + 2;

    if (!ok) {
      Sound.play("snd-alarm");
      $("#fact-text").textContent =
        (m.fact_fail[LANG] || m.fact_fail["nl"]) +
        "\n\n" +
        `${LANG === "nl" ? "Geïntercepteerd" : "Intercepted"}: ${hits}` +
        `\n${LANG === "nl" ? "Gemist" : "Missed"}: ${miss}` +
        `\n${LANG === "nl" ? "Vals alarm" : "False alarm"}: ${fals}`;

      decisions.push({
        missionIndex: step,
        choiceText: `Scanner: hits=${hits}, miss=${miss}`,
        ok: false,
        feedback: "Netwerkbewaking onvoldoende"
      });

      $("#log-line").textContent = t("detected");
    } else {
      Sound.play("snd-success");
      score += 1;
      $("#score-val").textContent = String(score);

      $("#fact-text").textContent =
        (m.fact_ok[LANG] || m.fact_ok["nl"]) +
        "\n\n" +
        `${LANG === "nl" ? "Geïntercepteerd" : "Intercepted"}: ${hits}` +
        `\n${LANG === "nl" ? "Gemist" : "Missed"}: ${miss}` +
        `\n${LANG === "nl" ? "Vals alarm" : "False alarm"}: ${fals}`;

      decisions.push({
        missionIndex: step,
        choiceText: `Scanner: hits=${hits}, miss=${miss}`,
        ok: true,
        feedback: "Netwerkbewaking effectief"
      });

      $("#log-line").textContent = t("accepted");
    }

    pushBadge();
    showFact();
  }
}

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
/* ==========================================================
   SCRIPT.JS — PART 5 / 5
   Endgame, Replay, HMAC Submission, Init Engine
   ========================================================== */

/* ---------------- SHOW END SCREEN ---------------- */
function showEndScreen() {
  const missions = getActiveMissions();

  $("#end-hp").textContent = hp + "%";
  $("#end-score").textContent = String(score);
  $("#end-risk").textContent = riskLevelFromHP(hp);
  $("#earned-badges").innerHTML = $("#live-badges").innerHTML;

  const list = $("#decisions-list");
  list.innerHTML = "";

  decisions.forEach((d) => {
    const m = missions[d.missionIndex];

    const box = document.createElement("div");
    box.className = "summary";

    const statusTag = d.ok
      ? `<span class="ok">${t("correct")}</span>`
      : `<span class="fail">${t("wrong")}</span>`;

    box.innerHTML = `
      <div><strong>${t("mission")} ${d.missionIndex + 1}:</strong> ${m.sender}</div>
      <div style="margin:6px 0; color:#bbb;">${m.msg[LANG] || m.msg["nl"]}</div>
      <div>${t("choice")}: <em>${d.choiceText}</em> — ${statusTag}</div>
      <div style="margin-top:6px;">Feedback: ${d.feedback}</div>
    `;

    list.appendChild(box);
  });

  typeTerminal(
    LANG === "nl"
      ? "> OPERATIE VOLTOOID. RESULTATEN WORDEN GETOOND..."
      : "> OPERATION COMPLETE. SHOWING RESULTS..."
  );

  submitScore();

  $("#end-modal").style.display = "block";
  $("#log-line").textContent =
    LANG === "nl" ? "Alle missies voltooid." : "All missions completed.";
}

/* ---------------- REPLAY ---------------- */
function replay() {
  step = 0;
  hp = 100;
  score = 0;
  decisions.length = 0;

  $("#hp-val").textContent = "100%";
  $("#score-val").textContent = "0";
  $("#risk-val").textContent = riskLevelFromHP(100);

  $("#live-badges").innerHTML = "";
  $("#chat-box").innerHTML = `<div id="lbl-comms" class="muted">${t("comms")}</div>`;
  $("#terminal-content").textContent = "";
  $("#choices-area").innerHTML = "";

  $("#end-modal").style.display = "none";

  renderMission();
}

/* ---------------- HMAC SECURITY ENGINE ---------------- */
const API_KEY = "c6f3e0a9b1d24f7c9e2a5d3f7a0b4c5d";
const SHARED_SECRET =
  "9e3f2a1b0c4d5e6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f";

let WEBHOOK_URL = null;

function base64Url(buf) {
  let bin = "";
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hex(buf) {
  const b = new Uint8Array(buf);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function canonicalStringify(o) {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonicalStringify).join(",") + "]";
  const keys = Object.keys(o).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(o[k])).join(
      ","
    ) +
    "}"
  );
}

async function sha256Hex(msg) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(msg));
  return hex(hash);
}

async function hmacSignB64(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return base64Url(sig);
}

async function submitScore() {
  try {
    if (!WEBHOOK_URL) {
      const promptMsg =
        LANG === "nl"
          ? "Admin: Plak hier de Google Apps Script Web App URL (…/exec):"
          : "Admin: Paste Google Apps Script Web App URL (…/exec):";
      const val = prompt(promptMsg);
      if (!val || !val.trim()) return;

      WEBHOOK_URL = val.trim();
      localStorage.setItem("webhook_url", WEBHOOK_URL);
    }

    if (!WEBHOOK_URL.includes("/exec")) return;

    const missions = getActiveMissions();

    const okCount = decisions.filter((d) => d.ok).length;
    const failCount = decisions.length - okCount;

    const data = {
      name: PLAYER || "Anonymous",
      mode: corporateMode ? "Corporate" : "Standard",
      lang: LANG,
      score,
      hp,
      risk: $("#risk-val")?.textContent || "",
      missions: missions.length,
      ok: okCount,
      fail: failCount,
      client: navigator.userAgent,
      repo: location.origin + location.pathname,
      page: document.title
    };

    const canonical = canonicalStringify(data);
    const hash = await sha256Hex(canonical);
    const ts = Date.now();
    const sign = await hmacSignB64(SHARED_SECRET, `${ts}.${hash}`);

    const body = {
      apiKey: API_KEY,
      ts,
      hash,
      sign,
      data
    };

    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).catch(() => {});
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- ADMIN RESET ---------------- */
function adminResetPrompts() {
  localStorage.removeItem("player_name");
  localStorage.removeItem("webhook_url");
}

/* ---------------- START ENGINE ---------------- */
function start() {
  const btn = $("#btn-start");
  if (btn) btn.remove();
  renderMission();
}

/* ---------------- INIT (DOMContentLoaded) ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* Admin reset */
  try {
    const p = new URLSearchParams(location.search);
    if (p.get("reset") === "1") adminResetPrompts();
  } catch {}

  /* Dil */
  const sel = $("#lang-select");
  if (sel) {
    sel.value = LANG;
    sel.addEventListener("change", () => {
      LANG = sel.value;
      localStorage.setItem("lang", LANG);
      replay();
      applyLanguage();
    });
  }

  /* İlk dil ayarı */
  applyLanguage();

  /* Sound toggle */
  $("#toggle-sound")?.addEventListener("change", (e) => {
    Sound.on = e.target.checked;
  });

  /* Corporate toggle */
  $("#toggle-corp")?.addEventListener("change", (e) => {
    corporateMode = e.target.checked;
    $("#status").textContent = corporateMode
      ? t("status_corp")
      : t("status_active");
    replay();
  });

  /* Brand color */
  $("#brand-color")?.addEventListener("input", (e) => {
    document.documentElement.style.setProperty("--accent", e.target.value);
    document.documentElement.style.setProperty("--neon-blue", e.target.value);
  });

  /* Logo */
  const savedLogo = localStorage.getItem("logo");
  if (savedLogo) {
    $("#brand-logo").src = savedLogo;
    $("#logo-url").value = savedLogo;
  }

  $("#btn-apply-logo")?.addEventListener("click", () => {
    const v = $("#logo-url").value.trim() || "assets/logo.svg";
    $("#brand-logo").src = v;
    localStorage.setItem("logo", v);
  });

  /* Player name */
  if (!PLAYER) {
    const ask = t("name_prompt");
    const v = prompt(ask);
    PLAYER = v && v.trim() ? v.trim() : "Anonymous";
    localStorage.setItem("player_name", PLAYER);
  }

  /* Start button */
  $("#btn-start")?.addEventListener("click", (e) => {
    if (e.shiftKey) {
      adminResetPrompts();
      alert("Admin reset: Naam & Webhook reset.");
      location.reload();
      return;
    }
    start();
  });

  $("#btn-close-fact")?.addEventListener("click", closeFact);
  $("#btn-replay")?.addEventListener("click", replay);
  $("#btn-close-end")?.addEventListener("click", () => {
    $("#end-modal").style.display = "none";
  });
});
