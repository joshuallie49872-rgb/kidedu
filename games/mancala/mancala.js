/* KidEdu Mancala (Kalah) — 10-level bot + 2P mode (mobile-safe) */
(() => {
  const $ = (id) => document.getElementById(id);

  const boardEl = $("board");
  const btnNew = $("btnNew");
  const modeSel = $("mode");
  const levelSel = $("level");
  const statusEl = $("status");
  const hintEl = $("hint");
  const logEl = $("log");
  const scoreEl = $("scoreline");

  const P1 = 1;  // bottom row
  const P2 = -1; // top row (bot or player 2)

  // State = 14 slots (0-5 p1 pits, 6 p1 store, 7-12 p2 pits, 13 p2 store)
  let s = null;
  let turn = P1;
  let busy = false;

  function setStatus(t){ if(statusEl) statusEl.textContent = t; }
  function setHint(t){ if(hintEl) hintEl.textContent = t; }
  function logLine(t){
    if(!logEl) return;
    const d = document.createElement("div");
    d.textContent = t;
    logEl.prepend(d);
  }

  function clampInt(v, a, b){
    const n = Math.max(a, Math.min(b, parseInt(v,10) || a));
    return n;
  }

  function qs(){
    const p = new URLSearchParams(location.search);
    return {
      mode: p.get("mode") || "bot",
      level: clampInt(p.get("level") || "5", 1, 10)
    };
  }

  function newGame(){
    s = new Array(14).fill(0);
    for(let i=0;i<6;i++) s[i]=4;
    for(let i=7;i<13;i++) s[i]=4;
    s[6]=0; s[13]=0;
    turn = P1;
    busy = false;
    if(logEl) logEl.textContent = "";
    setStatus(modeSel.value==="2p" ? "Player 1 turn" : "Your turn");
    setHint("Tap a pit on your side (bottom row).");
    render();
  }

  function buildBoardDOM(){
    boardEl.innerHTML = "";

    // Left store (P2 store at index 13) on left
    const storeL = document.createElement("div");
    storeL.className = "store";
    storeL.dataset.idx = "13";
    storeL.innerHTML = `<div class="big" id="storeP2">0</div><div class="who">${modeSel.value==="2p" ? "P2" : "Bot"}</div>`;
    boardEl.appendChild(storeL);

    // Top row pits (P2 pits 12..7 left-to-right)
    for(let col=0; col<6; col++){
      const idx = 12 - col;
      const pit = document.createElement("div");
      pit.className = "pit";
      pit.dataset.idx = String(idx);
      pit.innerHTML = `<div class="label">${modeSel.value==="2p" ? "P2" : "Bot"}</div><div class="count"></div><div class="stones"></div>`;
      boardEl.appendChild(pit);
    }

    // Right store (P1 store at index 6) on right
    const storeR = document.createElement("div");
    storeR.className = "store";
    storeR.dataset.idx = "6";
    storeR.innerHTML = `<div class="big" id="storeP1">0</div><div class="who">${modeSel.value==="2p" ? "P1" : "You"}</div>`;
    boardEl.appendChild(storeR);

    // Bottom row pits (P1 pits 0..5 left-to-right)
    for(let col=0; col<6; col++){
      const idx = col;
      const pit = document.createElement("div");
      pit.className = "pit";
      pit.dataset.idx = String(idx);
      pit.innerHTML = `<div class="label">${modeSel.value==="2p" ? "P1" : "You"}</div><div class="count"></div><div class="stones"></div>`;
      boardEl.appendChild(pit);
    }

    // Better for iOS than click
    boardEl.addEventListener("pointerdown", onPointerDown, { passive:false });
  }

  function isPlayablePit(idx, side){
    if(side===P1) return idx>=0 && idx<=5;
    return idx>=7 && idx<=12;
  }

  function render(){
    const sp1 = $("storeP1");
    const sp2 = $("storeP2");
    if(sp1) sp1.textContent = String(s[6]);
    if(sp2) sp2.textContent = String(s[13]);

    if(scoreEl) scoreEl.textContent = `You: ${s[6]}  ·  ${modeSel.value==="2p" ? "P2" : "Bot"}: ${s[13]}`;

    const pits = boardEl.querySelectorAll(".pit");
    pits.forEach(p => {
      const idx = parseInt(p.dataset.idx,10);
      const cnt = s[idx] || 0;
      p.classList.remove("disabled","highlight");

      const countEl = p.querySelector(".count");
      const stonesEl = p.querySelector(".stones");
      if(countEl) countEl.textContent = String(cnt);

      if(stonesEl){
        stonesEl.innerHTML = "";
        const whoClass = (idx>=0 && idx<=5) ? "p1" : "p2";
        const maxDraw = Math.min(cnt, 24);
        for(let i=0;i<maxDraw;i++){
          const st = document.createElement("div");
          st.className = `stone ${whoClass}`;
          const seed = (idx*97 + i*131) % 997;
          const x = (seed % 100) / 100;
          const y = ((seed*7) % 100) / 100;
          st.style.left = (8 + x*84).toFixed(2) + "%";
          st.style.top  = (8 + y*84).toFixed(2) + "%";
          stonesEl.appendChild(st);
        }
        if(cnt > maxDraw){
          const extra = document.createElement("div");
          extra.className = "count";
          extra.style.position = "absolute";
          extra.style.left = "10px";
          extra.style.bottom = "10px";
          extra.textContent = `+${cnt-maxDraw}`;
          stonesEl.appendChild(extra);
        }
      }

      const playable = isPlayablePit(idx, turn);
      if(!playable || cnt===0 || busy) p.classList.add("disabled");
      if(playable && cnt>0 && !busy) p.classList.add("highlight");
    });
  }

  function onPointerDown(e){
    if(busy) return;
    const pit = e.target.closest(".pit");
    if(!pit) return;
    e.preventDefault();
    const idx = parseInt(pit.dataset.idx,10);
    makeMove(idx);
  }

  function opposite(idx){
    // 0<->12, 1<->11, ..., 5<->7
    return 12 - idx;
  }

  function cloneState(st){ return st.slice(); }

  function sideEmpty(st, side){
    if(side===P1){
      for(let i=0;i<6;i++) if(st[i]>0) return false;
      return true;
    }else{
      for(let i=7;i<13;i++) if(st[i]>0) return false;
      return true;
    }
  }

  function collectRemainder(st){
    let sum1=0, sum2=0;
    for(let i=0;i<6;i++){ sum1 += st[i]; st[i]=0; }
    for(let i=7;i<13;i++){ sum2 += st[i]; st[i]=0; }
    st[6] += sum1;
    st[13] += sum2;
  }

  function applyMove(st, side, pitIdx){
    const isP1 = side===P1;
    const ownStore = isP1 ? 6 : 13;
    const oppStore = isP1 ? 13 : 6;

    let stones = st[pitIdx];
    st[pitIdx]=0;
    let idx = pitIdx;

    while(stones>0){
      idx = (idx + 1) % 14;
      if(idx===oppStore) continue;
      st[idx] += 1;
      stones--;
    }

    let captured = 0;
    if(idx!==ownStore){
      if(isP1 && idx>=0 && idx<=5 && st[idx]===1){
        const opp = opposite(idx);
        if(st[opp] > 0){
          captured = st[opp] + st[idx];
          st[ownStore] += captured;
          st[opp] = 0;
          st[idx] = 0;
        }
      }
      if(!isP1 && idx>=7 && idx<=12 && st[idx]===1){
        const opp = opposite(idx);
        if(st[opp] > 0){
          captured = st[opp] + st[idx];
          st[ownStore] += captured;
          st[opp] = 0;
          st[idx] = 0;
        }
      }
    }

    const extraTurn = (idx===ownStore);
    const nextSide = extraTurn ? side : (side===P1 ? P2 : P1);

    let gameOver = false;
    if(sideEmpty(st, P1) || sideEmpty(st, P2)){
      collectRemainder(st);
      gameOver = true;
    }

    return { nextSide, extraTurn, captured, gameOver };
  }

  function legalMoves(st, side){
    const moves = [];
    if(side===P1){
      for(let i=0;i<6;i++) if(st[i]>0) moves.push(i);
    }else{
      for(let i=7;i<13;i++) if(st[i]>0) moves.push(i);
    }
    return moves;
  }

  function pitLabel(idx){
    if(idx>=0 && idx<=5) return String.fromCharCode(65+idx);
    if(idx>=7 && idx<=12) return String.fromCharCode(97 + (12-idx));
    return "—";
  }

  function makeMove(pitIdx){
    if(!isPlayablePit(pitIdx, turn)) return;
    if(s[pitIdx]===0) return;

    const isTwoP = modeSel.value==="2p";
    const who = (turn===P1) ? (isTwoP ? "P1" : "You") : (isTwoP ? "P2" : "Bot");

    const res = applyMove(s, turn, pitIdx);
    logLine(`${who} played pit ${pitLabel(pitIdx)}${res.captured ? ` (captured ${res.captured})` : ""}${res.extraTurn ? " (extra turn)" : ""}`);

    turn = res.nextSide;
    render();

    if(res.gameOver){
      endGame();
      return;
    }

    if(!isTwoP && turn===P2){
      botThink();
    }else{
      setStatus(turn===P1 ? (isTwoP ? "Player 1 turn" : "Your turn") : "Player 2 turn");
      setHint(turn===P1 ? "Tap a bottom pit." : "Tap a top pit.");
    }
  }

  function endGame(){
    const p1 = s[6], p2 = s[13];
    const isTwoP = modeSel.value==="2p";
    if(p1>p2) setStatus(isTwoP ? "Player 1 wins" : "You win!");
    else if(p2>p1) setStatus(isTwoP ? "Player 2 wins" : "Bot wins");
    else setStatus("Draw");
    setHint("Tap New game to play again.");
  }

  function evalState(st){
    let score = (st[13]-st[6]) * 2.5;
    let p1p=0, p2p=0;
    for(let i=0;i<6;i++) p1p += st[i];
    for(let i=7;i<13;i++) p2p += st[i];
    score += (p2p - p1p) * 0.15;
    return score; // + is good for bot
  }

  function depthForLevel(level){
    if(level<=1) return 1;
    if(level<=2) return 2;
    if(level<=3) return 3;
    if(level<=5) return 4;
    if(level<=7) return 5;
    if(level<=8) return 6;
    if(level<=9) return 7;
    return 8;
  }

  function minimax(st, depth, side, alpha, beta){
    if(depth<=0 || sideEmpty(st,P1) || sideEmpty(st,P2)){
      const t = cloneState(st);
      if(sideEmpty(t,P1) || sideEmpty(t,P2)) collectRemainder(t);
      return evalState(t);
    }

    const moves = legalMoves(st, side);
    if(!moves.length) return evalState(st);

    if(side===P2){
      let best=-Infinity;
      for(const m of moves){
        const ns=cloneState(st);
        const res=applyMove(ns, P2, m);
        const v=minimax(ns, depth-1, res.nextSide, alpha, beta);
        best=Math.max(best,v);
        alpha=Math.max(alpha,best);
        if(beta<=alpha) break;
      }
      return best;
    }else{
      let best=Infinity;
      for(const m of moves){
        const ns=cloneState(st);
        const res=applyMove(ns, P1, m);
        const v=minimax(ns, depth-1, res.nextSide, alpha, beta);
        best=Math.min(best,v);
        beta=Math.min(beta,best);
        if(beta<=alpha) break;
      }
      return best;
    }
  }

  function pickBotMove(st, depth, level){
    const moves = legalMoves(st, P2);
    if(!moves.length) return null;

    if(level<=2){
      return moves[Math.floor(Math.random()*moves.length)];
    }

    let best = moves[0];
    let bestVal = -Infinity;
    const noise = (level<=6) ? 0.25 : 0.0;

    for(const m of moves){
      const ns=cloneState(st);
      const res=applyMove(ns, P2, m);
      const val=minimax(ns, depth-1, res.nextSide, -Infinity, Infinity);
      const noisy = val + (noise ? (Math.random()*2-1)*noise : 0);
      if(noisy > bestVal){
        bestVal = noisy;
        best = m;
      }
    }
    return best;
  }

  function botThink(){
    const level = clampInt(levelSel.value || "5", 1, 10);
    const depth = depthForLevel(level);

    setStatus("Bot thinking...");
    setHint("—");
    busy = true;

    setTimeout(() => {
      try{
        const move = pickBotMove(s, depth, level);
        if(move == null){
          endGame();
          return;
        }
        makeMove(move);
      } finally {
        busy = false;
        render();
      }
    }, 120);
  }

  function syncFromQuery(){
    const p = qs();
    if(modeSel) modeSel.value = (p.mode==="2p") ? "2p" : "bot";
    if(levelSel) levelSel.value = String(p.level);
  }

  btnNew && btnNew.addEventListener("click", newGame);
  modeSel && modeSel.addEventListener("change", () => { buildBoardDOM(); newGame(); });
  levelSel && levelSel.addEventListener("change", () => logLine(`Level: ${levelSel.value}`));

  if(!boardEl) return;
  syncFromQuery();
  buildBoardDOM();
  newGame();
})();
