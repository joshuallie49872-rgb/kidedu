// KidEdu Reading: TTS helper (browser SpeechSynthesis) + optional audio files
// If you add real/native recordings later, drop them here:
//   games/reading/audio/lt/<id>.mp3
//   games/reading/audio/en/<id>.mp3
// Then the game will prefer those files over TTS.

(function () {
  const audioCache = new Map(); // key -> HTMLAudioElement

  function getAudioPath(lang, id) {
    return `./audio/${lang}/${id}.mp3`;
  }

  async function tryPlayAudio(lang, id) {
    if (!id) return false;
    const key = `${lang}:${id}`;

    let a = audioCache.get(key);
    if (!a) {
      a = new Audio();
      a.preload = "auto";
      a.src = getAudioPath(lang, id);
      audioCache.set(key, a);
    }

    // Probe if file exists (works on localhost + GitHub Pages)
    try {
      const r = await fetch(a.src + `?v=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) return false;
    } catch {
      return false;
    }

    try {
      a.currentTime = 0;
      await a.play();
      return true;
    } catch {
      return false;
    }
  }

  function pickVoiceFor(lang) {
    const want = lang === "lt" ? "lt-LT" : "en-US";
    const voices =
      window.speechSynthesis && window.speechSynthesis.getVoices
        ? window.speechSynthesis.getVoices()
        : [];

    if (!voices.length) return null;

    // Exact match first
    let v = voices.find((x) => (x.lang || "").toLowerCase() === want.toLowerCase());
    if (v) return v;

    // Prefix match fallback (en-*, lt-*)
    const prefix = want.split("-")[0].toLowerCase();
    v = voices.find((x) => (x.lang || "").toLowerCase().startsWith(prefix));
    return v || null;
  }

  function speakTTS(text, lang) {
    if (!window.speechSynthesis) return false;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "lt" ? "lt-LT" : "en-US";

    const v = pickVoiceFor(lang);
    if (v) u.voice = v;

    // Kid-friendly
    u.rate = 0.95;
    u.pitch = 1.05;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  }

  // Public API
  window.kideduSpeak = async function ({ text, lang, id }) {
    const played = await tryPlayAudio(lang, id);
    if (played) return true;
    return speakTTS(text, lang);
  };

  // iOS/Safari voice list loads async
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }
})();
