/* KidEdu Reading Game
   - 100+ words, first ~50 very easy
   - Level selector 1–5 controls which words appear
   - Prefers native audio files if present:
       games/reading/audio/lt/<id>.mp3
       games/reading/audio/en/<id>.mp3
*/

const LESSONS = [
  // ===== Level 1 (very easy) =====
  { id:"cat", level:1, emoji:"🐱", en:{word:"CAT", say:"cat"}, lt:{word:"KATĖ", say:"katė"} },
  { id:"dog", level:1, emoji:"🐶", en:{word:"DOG", say:"dog"}, lt:{word:"ŠUO", say:"šuo"} },
  { id:"mom", level:1, emoji:"👩", en:{word:"MOM", say:"mom"}, lt:{word:"MAMA", say:"mama"} },
  { id:"dad", level:1, emoji:"👨", en:{word:"DAD", say:"dad"}, lt:{word:"TĖTIS", say:"tėtis"} },
  { id:"sun", level:1, emoji:"☀️", en:{word:"SUN", say:"sun"}, lt:{word:"SAULĖ", say:"saulė"} },
  { id:"moon", level:1, emoji:"🌙", en:{word:"MOON", say:"moon"}, lt:{word:"MĖNULIS", say:"mėnulis"} },
  { id:"car", level:1, emoji:"🚗", en:{word:"CAR", say:"car"}, lt:{word:"MAŠINA", say:"mašina"} },
  { id:"bus", level:1, emoji:"🚌", en:{word:"BUS", say:"bus"}, lt:{word:"AUTOBUSAS", say:"autobusas"} },
  { id:"book", level:1, emoji:"📘", en:{word:"BOOK", say:"book"}, lt:{word:"KNYGA", say:"knyga"} },
  { id:"ball", level:1, emoji:"⚽", en:{word:"BALL", say:"ball"}, lt:{word:"KAMUOLYS", say:"kamuolys"} },
  { id:"hat", level:1, emoji:"🧢", en:{word:"HAT", say:"hat"}, lt:{word:"KEPURĖ", say:"kepurė"} },
  { id:"shoe", level:1, emoji:"👟", en:{word:"SHOE", say:"shoe"}, lt:{word:"BATAS", say:"batas"} },
  { id:"bed", level:1, emoji:"🛏️", en:{word:"BED", say:"bed"}, lt:{word:"LOVA", say:"lova"} },
  { id:"home", level:1, emoji:"🏠", en:{word:"HOME", say:"home"}, lt:{word:"NAMAS", say:"namas"} },
  { id:"tree", level:1, emoji:"🌳", en:{word:"TREE", say:"tree"}, lt:{word:"MEDIS", say:"medis"} },
  { id:"flower", level:1, emoji:"🌸", en:{word:"FLOWER", say:"flower"}, lt:{word:"GĖLĖ", say:"gėlė"} },
  { id:"fish", level:1, emoji:"🐟", en:{word:"FISH", say:"fish"}, lt:{word:"ŽUVIS", say:"žuvis"} },
  { id:"bird", level:1, emoji:"🐦", en:{word:"BIRD", say:"bird"}, lt:{word:"PAUKŠTIS", say:"paukštis"} },
  { id:"cow", level:1, emoji:"🐄", en:{word:"COW", say:"cow"}, lt:{word:"KARVĖ", say:"karvė"} },
  { id:"pig", level:1, emoji:"🐷", en:{word:"PIG", say:"pig"}, lt:{word:"KIAULĖ", say:"kiaulė"} },
  { id:"milk", level:1, emoji:"🥛", en:{word:"MILK", say:"milk"}, lt:{word:"PIENAS", say:"pienas"} },
  { id:"water", level:1, emoji:"💧", en:{word:"WATER", say:"water"}, lt:{word:"VANDUO", say:"vanduo"} },
  { id:"juice", level:1, emoji:"🧃", en:{word:"JUICE", say:"juice"}, lt:{word:"SULTYS", say:"sultys"} },
  { id:"bread", level:1, emoji:"🍞", en:{word:"BREAD", say:"bread"}, lt:{word:"DUONA", say:"duona"} },
  { id:"egg", level:1, emoji:"🥚", en:{word:"EGG", say:"egg"}, lt:{word:"KIAUŠINIS", say:"kiaušinis"} },
  { id:"apple", level:1, emoji:"🍎", en:{word:"APPLE", say:"apple"}, lt:{word:"OBUOLYS", say:"obuolys"} },
  { id:"banana", level:1, emoji:"🍌", en:{word:"BANANA", say:"banana"}, lt:{word:"BANANAS", say:"bananas"} },
  { id:"ice", level:1, emoji:"🧊", en:{word:"ICE", say:"ice"}, lt:{word:"LEDAS", say:"ledas"} },
  { id:"hand", level:1, emoji:"✋", en:{word:"HAND", say:"hand"}, lt:{word:"RANKA", say:"ranka"} },
  { id:"leg", level:1, emoji:"🦵", en:{word:"LEG", say:"leg"}, lt:{word:"KOJA", say:"koja"} },
  { id:"eye", level:1, emoji:"👁️", en:{word:"EYE", say:"eye"}, lt:{word:"AKIS", say:"akis"} },
  { id:"nose", level:1, emoji:"👃", en:{word:"NOSE", say:"nose"}, lt:{word:"NOSIS", say:"nosis"} },
  { id:"mouth", level:1, emoji:"👄", en:{word:"MOUTH", say:"mouth"}, lt:{word:"BURNA", say:"burna"} },
  { id:"ear", level:1, emoji:"👂", en:{word:"EAR", say:"ear"}, lt:{word:"AUSIS", say:"ausis"} },
  { id:"door", level:1, emoji:"🚪", en:{word:"DOOR", say:"door"}, lt:{word:"DURYS", say:"durys"} },
  { id:"window", level:1, emoji:"🪟", en:{word:"WINDOW", say:"window"}, lt:{word:"LANGAS", say:"langas"} },
  { id:"spoon", level:1, emoji:"🥄", en:{word:"SPOON", say:"spoon"}, lt:{word:"ŠAUKŠTAS", say:"šaukštas"} },
  { id:"cup", level:1, emoji:"☕", en:{word:"CUP", say:"cup"}, lt:{word:"PUODELIS", say:"puodelis"} },
  { id:"phone", level:1, emoji:"📱", en:{word:"PHONE", say:"phone"}, lt:{word:"TELEFONAS", say:"telefonas"} },
  { id:"toy", level:1, emoji:"🧸", en:{word:"TOY", say:"toy"}, lt:{word:"ŽAISLAS", say:"žaislas"} },

  // ===== Level 2 (still easy) =====
  { id:"girl", level:2, emoji:"👧", en:{word:"GIRL", say:"girl"}, lt:{word:"MERGAITĖ", say:"mergaitė"} },
  { id:"boy", level:2, emoji:"👦", en:{word:"BOY", say:"boy"}, lt:{word:"BERNIUKAS", say:"berniukas"} },
  { id:"child", level:2, emoji:"🧒", en:{word:"CHILD", say:"child"}, lt:{word:"VAIKAS", say:"vaikas"} },
  { id:"baby", level:2, emoji:"👶", en:{word:"BABY", say:"baby"}, lt:{word:"KŪDIKIS", say:"kūdikis"} },
  { id:"friend", level:2, emoji:"🤝", en:{word:"FRIEND", say:"friend"}, lt:{word:"DRAUGAS", say:"draugas"} },
  { id:"grandma", level:2, emoji:"👵", en:{word:"GRANDMA", say:"grandma"}, lt:{word:"MOČIUTĖ", say:"močiutė"} },
  { id:"grandpa", level:2, emoji:"👴", en:{word:"GRANDPA", say:"grandpa"}, lt:{word:"SENELIS", say:"senelis"} },
  { id:"school", level:2, emoji:"🏫", en:{word:"SCHOOL", say:"school"}, lt:{word:"MOKYKLA", say:"mokykla"} },
  { id:"park", level:2, emoji:"🏞️", en:{word:"PARK", say:"park"}, lt:{word:"PARKAS", say:"parkas"} },
  { id:"shop", level:2, emoji:"🏪", en:{word:"SHOP", say:"shop"}, lt:{word:"PARDUOTUVĖ", say:"parduotuvė"} },
  { id:"bike", level:2, emoji:"🚲", en:{word:"BIKE", say:"bike"}, lt:{word:"DVIRATIS", say:"dviratis"} },
  { id:"plane", level:2, emoji:"✈️", en:{word:"PLANE", say:"plane"}, lt:{word:"LĖKTUVAS", say:"lėktuvas"} },
  { id:"clock", level:2, emoji:"⏰", en:{word:"CLOCK", say:"clock"}, lt:{word:"LAIKRODIS", say:"laikrodis"} },
  { id:"music", level:2, emoji:"🎵", en:{word:"MUSIC", say:"music"}, lt:{word:"MUZIKA", say:"muzika"} },
  { id:"happy", level:2, emoji:"😄", en:{word:"HAPPY", say:"happy"}, lt:{word:"LAIMINGAS", say:"laimingas"} },
  { id:"sad", level:2, emoji:"😢", en:{word:"SAD", say:"sad"}, lt:{word:"LIŪDNAS", say:"liūdnas"} },
  { id:"yes", level:2, emoji:"✅", en:{word:"YES", say:"yes"}, lt:{word:"TAIP", say:"taip"} },
  { id:"no", level:2, emoji:"❌", en:{word:"NO", say:"no"}, lt:{word:"NE", say:"ne"} },
  { id:"hello", level:2, emoji:"👋", en:{word:"HELLO", say:"hello"}, lt:{word:"LABAS", say:"labas"} },
  { id:"thanks", level:2, emoji:"🙌", en:{word:"THANKS", say:"thanks"}, lt:{word:"AČIŪ", say:"ačiū"} },

  // ===== Level 3 (foods/animals/actions) =====
  { id:"cheese", level:3, emoji:"🧀", en:{word:"CHEESE", say:"cheese"}, lt:{word:"SŪRIS", say:"sūris"} },
  { id:"cookie", level:3, emoji:"🍪", en:{word:"COOKIE", say:"cookie"}, lt:{word:"SAUSAINIS", say:"sausainis"} },
  { id:"candy", level:3, emoji:"🍬", en:{word:"CANDY", say:"candy"}, lt:{word:"SALDAINIS", say:"saldainis"} },
  { id:"honey", level:3, emoji:"🍯", en:{word:"HONEY", say:"honey"}, lt:{word:"MEDUS", say:"medus"} },
  { id:"orange", level:3, emoji:"🍊", en:{word:"ORANGE", say:"orange"}, lt:{word:"APELSINAS", say:"apelsinas"} },
  { id:"grape", level:3, emoji:"🍇", en:{word:"GRAPE", say:"grape"}, lt:{word:"VYNUOGĖ", say:"vynuogė"} },
  { id:"strawberry", level:3, emoji:"🍓", en:{word:"STRAWBERRY", say:"strawberry"}, lt:{word:"BRAŠKĖ", say:"braškė"} },
  { id:"potato", level:3, emoji:"🥔", en:{word:"POTATO", say:"potato"}, lt:{word:"BULVĖ", say:"bulvė"} },
  { id:"carrot", level:3, emoji:"🥕", en:{word:"CARROT", say:"carrot"}, lt:{word:"MORKA", say:"morka"} },
  { id:"butter", level:3, emoji:"🧈", en:{word:"BUTTER", say:"butter"}, lt:{word:"SVIESTAS", say:"sviestas"} },
  { id:"sheep", level:3, emoji:"🐑", en:{word:"SHEEP", say:"sheep"}, lt:{word:"AVIS", say:"avis"} },
  { id:"horse", level:3, emoji:"🐴", en:{word:"HORSE", say:"horse"}, lt:{word:"ARKLYS", say:"arklys"} },
  { id:"rabbit", level:3, emoji:"🐇", en:{word:"RABBIT", say:"rabbit"}, lt:{word:"TRIUŠIS", say:"triušis"} },
  { id:"bear", level:3, emoji:"🐻", en:{word:"BEAR", say:"bear"}, lt:{word:"MEŠKA", say:"meška"} },
  { id:"fox", level:3, emoji:"🦊", en:{word:"FOX", say:"fox"}, lt:{word:"LAPĖ", say:"lapė"} },
  { id:"frog", level:3, emoji:"🐸", en:{word:"FROG", say:"frog"}, lt:{word:"VARLĖ", say:"varlė"} },
  { id:"play", level:3, emoji:"🎮", en:{word:"PLAY", say:"play"}, lt:{word:"ŽAISTI", say:"žaisti"} },
  { id:"run", level:3, emoji:"🏃", en:{word:"RUN", say:"run"}, lt:{word:"BĖGTI", say:"bėgti"} },
  { id:"eat", level:3, emoji:"🍽️", en:{word:"EAT", say:"eat"}, lt:{word:"VALGYTI", say:"valgyti"} },
  { id:"drink", level:3, emoji:"🥤", en:{word:"DRINK", say:"drink"}, lt:{word:"GERTI", say:"gerti"} },

  // ===== Level 4 (concepts/objects) =====
  { id:"hot", level:4, emoji:"🌡️", en:{word:"HOT", say:"hot"}, lt:{word:"KARŠTA", say:"karšta"} },
  { id:"cold", level:4, emoji:"🥶", en:{word:"COLD", say:"cold"}, lt:{word:"ŠALTA", say:"šalta"} },
  { id:"help", level:4, emoji:"🆘", en:{word:"HELP", say:"help"}, lt:{word:"PADĖK", say:"padėk"} },
  { id:"love", level:4, emoji:"❤️", en:{word:"LOVE", say:"love"}, lt:{word:"MEILĖ", say:"meilė"} },
  { id:"family", level:4, emoji:"👨‍👩‍👧‍👦", en:{word:"FAMILY", say:"family"}, lt:{word:"ŠEIMA", say:"šeima"} },
  { id:"circle", level:4, emoji:"⭕", en:{word:"CIRCLE", say:"circle"}, lt:{word:"APSKRITIMAS", say:"apskritimas"} },
  { id:"square", level:4, emoji:"⬜", en:{word:"SQUARE", say:"square"}, lt:{word:"KVADRATAS", say:"kvadratas"} },
  { id:"triangle", level:4, emoji:"🔺", en:{word:"TRIANGLE", say:"triangle"}, lt:{word:"TRIKAMPIS", say:"trikampis"} },
  { id:"rain", level:4, emoji:"🌧️", en:{word:"RAIN", say:"rain"}, lt:{word:"LIETUS", say:"lietus"} },
  { id:"snow", level:4, emoji:"❄️", en:{word:"SNOW", say:"snow"}, lt:{word:"SNIEGAS", say:"sniegas"} },
  { id:"wind", level:4, emoji:"💨", en:{word:"WIND", say:"wind"}, lt:{word:"VĖJAS", say:"vėjas"} },
  { id:"river", level:4, emoji:"🏞️", en:{word:"RIVER", say:"river"}, lt:{word:"UPĖ", say:"upė"} },
  { id:"sea", level:4, emoji:"🌊", en:{word:"SEA", say:"sea"}, lt:{word:"JŪRA", say:"jūra"} },

  // ===== Level 5 (extra) =====
  { id:"robot", level:5, emoji:"🤖", en:{word:"ROBOT", say:"robot"}, lt:{word:"ROBOTAS", say:"robotas"} },
  { id:"dino", level:5, emoji:"🦖", en:{word:"DINO", say:"dino"}, lt:{word:"DINOZAURAS", say:"dinozauras"} },
  { id:"gift", level:5, emoji:"🎁", en:{word:"GIFT", say:"gift"}, lt:{word:"DOVANA", say:"dovana"} },
  { id:"party", level:5, emoji:"🥳", en:{word:"PARTY", say:"party"}, lt:{word:"VAKARĖLIS", say:"vakarėlis"} }
];

// Settings
let currentLang = localStorage.getItem("reading_lang") || "en";
let maxLevel = parseInt(localStorage.getItem("reading_level") || "2", 10);
if (!Number.isFinite(maxLevel) || maxLevel < 1) maxLevel = 2;
if (maxLevel > 5) maxLevel = 5;

const btnEN = document.getElementById("btnEN");
const btnLT = document.getElementById("btnLT");
const btnSpeak = document.getElementById("btnSpeak");
const btnNew = document.getElementById("btnNew");
const levelSel = document.getElementById("levelSel");

const elEmoji = document.getElementById("emoji");
const elHintTop = document.getElementById("hintTop");
const elHintWord = document.getElementById("hintWord");
const elSlots = document.getElementById("slots");
const elLetters = document.getElementById("letters");
const elStatus = document.getElementById("status");
const elXpFill = document.getElementById("xpFill");
const elXpText = document.getElementById("xpText");

let xp = parseInt(localStorage.getItem("reading_xp") || "0", 10);
if (!Number.isFinite(xp) || xp < 0) xp = 0;

let currentLesson = null;
let placed = []; // letters placed in slots

function setLang(lang) {
  currentLang = lang === "lt" ? "lt" : "en";
  localStorage.setItem("reading_lang", currentLang);
  renderLangButtons();
  startNewWord();
}

function renderLangButtons() {
  if (btnEN) btnEN.classList.toggle("primary", currentLang === "en");
  if (btnLT) btnLT.classList.toggle("primary", currentLang === "lt");
}

function pool() {
  const p = LESSONS.filter((x) => (x.level || 1) <= maxLevel);
  return p.length ? p : LESSONS.slice();
}

function pickLesson() {
  const p = pool();
  if (!p.length) return LESSONS[0];

  const lastId = window.__lastLessonId || null;
  let pick = p[Math.floor(Math.random() * p.length)];
  if (lastId && p.length > 1) {
    let guard = 0;
    while (pick.id === lastId && guard++ < 20) {
      pick = p[Math.floor(Math.random() * p.length)];
    }
  }
  window.__lastLessonId = pick.id;
  return pick;
}

function normWord(w) {
  return (w || "").toString().trim().toUpperCase();
}

function buildSlots(word) {
  elSlots.innerHTML = "";
  placed = new Array(word.length).fill(null);

  for (let i = 0; i < word.length; i++) {
    const s = document.createElement("div");
    s.className = "slot";
    s.dataset.index = String(i);

    // allow drop
    s.addEventListener("dragover", (e) => e.preventDefault());
    s.addEventListener("drop", (e) => {
      e.preventDefault();
      const ch = e.dataTransfer.getData("text/plain") || "";
      placeLetter(i, ch);
    });

    // touch support (tap letter then tap slot)
    s.addEventListener("click", () => {
      const selected = window.__tapLetter || "";
      if (selected) placeLetter(i, selected);
    });

    elSlots.appendChild(s);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function buildLetters(word) {
  elLetters.innerHTML = "";

  // include correct letters + a few distractors
  const alphabet = "AĄBCČDEĘĖFGHIĮYJKLMNOPRSŠTUŲŪVZŽ".split("");
  const needed = word.split("");
  const letters = [...needed];

  while (letters.length < Math.min(needed.length + 4, 12)) {
    letters.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }

  shuffle(letters);

  for (const ch of letters) {
    const b = document.createElement("div");
    b.className = "letter";
    b.textContent = ch;

    b.draggable = true;
    b.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", ch);
    });

    // tap-select for touch
    b.addEventListener("click", () => {
      window.__tapLetter = ch;
      flashStatus(`Selected: ${ch}`, "muted", 450);
    });

    elLetters.appendChild(b);
  }
}

function placeLetter(i, ch) {
  if (!ch) return;
  const slot = elSlots.querySelector(`.slot[data-index="${i}"]`);
  if (!slot) return;

  placed[i] = ch.toUpperCase();
  slot.textContent = placed[i];
  slot.classList.add("filled");

  checkWin();
}

function getTargetWord() {
  const l = currentLang === "lt" ? currentLesson.lt : currentLesson.en;
  return normWord(l.word);
}

function checkWin() {
  const target = getTargetWord();
  const attempt = placed.map((x) => x || "").join("");

  if (!attempt.includes("")) {
    // full
  }

  if (attempt === target) {
    win();
  }
}

function flashStatus(msg, kind, ms) {
  elStatus.textContent = msg;
  elStatus.style.color =
    kind === "good" ? "var(--good)" :
    kind === "bad" ? "var(--bad)" :
    "var(--muted)";
  if (ms) {
    clearTimeout(window.__statusT);
    window.__statusT = setTimeout(() => {
      elStatus.textContent = "";
      elStatus.style.color = "var(--muted)";
    }, ms);
  }
}

function updateXP() {
  localStorage.setItem("reading_xp", String(xp));
  elXpText.textContent = `XP ${xp}`;
  const pct = Math.min(100, (xp % 100));
  elXpFill.style.width = `${pct}%`;
}

async function handleSpeak() {
  if (!currentLesson) return;
  const l = currentLang === "lt" ? currentLesson.lt : currentLesson.en;
  const lang = currentLang === "lt" ? "lt" : "en";
  const text = (l.say || l.word || "").toString();
  const id = currentLesson.id || "";
  if (window.kideduSpeak) await window.kideduSpeak({ text, lang, id });
}

function win() {
  xp += 10;
  updateXP();
  flashStatus("✅ Nice! +10 XP", "good", 900);

  // auto-say the word
  handleSpeak();

  // small delay then new word
  setTimeout(startNewWord, 900);
}

function startNewWord() {
  currentLesson = pickLesson();
  const l = currentLang === "lt" ? currentLesson.lt : currentLesson.en;

  elEmoji.textContent = currentLesson.emoji || "✨";
  elHintTop.textContent = currentLang === "lt" ? "Sudėk žodį:" : "Build the word:";
  elHintWord.textContent = l.word;

  const target = normWord(l.word);
  buildSlots(target);
  buildLetters(target);
  elStatus.textContent = "";
  window.__tapLetter = "";
}

// UI hooks
if (btnEN) btnEN.addEventListener("click", () => setLang("en"));
if (btnLT) btnLT.addEventListener("click", () => setLang("lt"));
if (btnSpeak) btnSpeak.addEventListener("click", handleSpeak);
if (btnNew) btnNew.addEventListener("click", startNewWord);

if (levelSel) {
  levelSel.value = String(maxLevel);
  levelSel.addEventListener("change", () => {
    maxLevel = parseInt(levelSel.value || "2", 10);
    if (!Number.isFinite(maxLevel)) maxLevel = 2;
    if (maxLevel < 1) maxLevel = 1;
    if (maxLevel > 5) maxLevel = 5;
    localStorage.setItem("reading_level", String(maxLevel));
    startNewWord();
  });
}

renderLangButtons();
updateXP();
startNewWord();
