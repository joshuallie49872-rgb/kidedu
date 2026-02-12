/* KidEdu Checkers — 10-level AI + Audio + GameOver overlay (mobile-safe) */
(() => {
  const $ = (id) => document.getElementById(id);

  const boardEl = $("board");
  const btnNew = $("btnNew");
  const btnBack = $("btnBack");
  const btnSound = $("btnSound");
  const levelSel = $("level");

  const statusEl = $("status");
  const hintEl = $("hint");
  const logEl = $("log");
  const scoreEl = $("scoreline");

  const overlay = $("overlay");
  const overlayTitle = $("overlayTitle");
  const overlayMsg = $("overlayMsg");
  const btnOverlayNew = $("btnOverlayNew");
  const btnOverlayBack = $("btnOverlayBack");
  const btnOverlayClose = $("btnOverlayClose");

  const EMPTY = 0;
  const R = 1, RK = 2;     // Red (human)
  const B = -1, BK = -2;   // Blue (bot)

  // --- Sound Engine (no assets) ---
  const SFX = (() => {
    let enabled = false;
    let ctx = null;

    function ensure(){
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    }

    async function startFromUserGesture(){
      const c = ensure();
      if (c.state !== "running") {
        try { await c.resume(); } catch {}
      }
    }

    function beep(freq=440, dur=0.08, type="sine", gain=0.06){
      if (!enabled) return;
      const c = ensure();
      if (c.state !== "running") return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    }

    function select(){ beep(520, 0.05, "triangle", 0.05); }
    function invalid(){ beep(180, 0.08, "sawtooth", 0.05); }
    function move(){ beep(420, 0.06, "square", 0.045); }
    function capture(){ beep(260, 0.07, "square", 0.06); setTimeout(()=>beep(180,0.06,"square",0.06), 50); }
    function king(){ beep(740, 0.07, "triangle", 0.06); setTimeout(()=>beep(980,0.08,"triangle",0.06), 70); }
    function win(){ beep(523.25,0.08,"triangle",0.06); setTimeout(()=>beep(659.25,0.08,"triangle",0.06), 90); setTimeout(()=>beep(783.99,0.12,"triangle",0.06), 180); }
    function lose(){ beep(330,0.10,"sawtooth",0.05); setTimeout(()=>beep(220,0.12,"sawtooth",0.05), 120); }

    function setEnabled(v){
      enabled = !!v;
      if (btnSound) btnSound.textContent = `Audio: ${enabled ? "On" : "Off"}`;
    }

    return { startFromUserGesture, setEnabled, get enabled(){return enabled;},
             select, invalid, move, capture, king, win, lose };
  })();

  // allow parent to set level via ?level=1..10 (and legacy ?bot=easy|med|hard)
  const qs = new URLSearchParams(location.search);
  const qLevel = qs.get("level");
  const qBot = qs.get("bot"); // legacy
  if (levelSel) {
    if (qLevel && /^\d+$/.test(qLevel)) {
      const v = Math.min(10, Math.max(1, Number(qLevel)));
      levelSel.value = String(v);
    } else if (qBot) {
      // map legacy to 1/5/10
      if (qBot === "easy") levelSel.value = "1";
      else if (qBot === "hard") levelSel.value = "10";
      else levelSel.value = "5";
    }
  }

  // --- AI tuning by level ---
  // depth increases with level; randomness decreases with level.
  function aiSettings(level){
    const L = Math.min(10, Math.max(1, Number(level)||5));
    // depths tuned so mobile doesn't melt:
    // 1-2: very shallow + random
    // 3-5: shallow minimax
    // 6-10: deeper
    const depth = (L <= 2) ? 1
                : (L <= 4) ? 2
                : (L <= 6) ? 3
                : (L <= 8) ? 4
                : (L === 9) ? 5
                : 6;

    // chance to choose a non-best move sometimes (makes it "easier")
    const randomness = (11 - L) / 10; // L1=1.0, L10=0.1
    return { depth, randomness };
  }

  let board = null;
  let turn = R;
  let selected = null;
  let legalMoves = [];
  let mustContinueCapture = null;
  let busy = false;
  let gameOver = false;

  function setStatus(t){ if(statusEl) statusEl.textContent = t; }
  function setHint(t){ if(hintEl) hintEl.textContent = t; }
  function logLine(t){
    if(!logEl) return;
    const div = document.createElement("div");
    div.textContent = t;
    logEl.prepend(div);
  }

  function showOverlay(title, msg){
    gameOver = true;
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayMsg) overlayMsg.textContent = msg;
    if (overlay) overlay.classList.remove("hidden");
  }
  function hideOverlay(){
    if (overlay) overlay.classList.add("hidden");
  }

  function goBack(){
    // if inside iframe, this still navigates within iframe; fine for KidEdu
    location.href = "../../approved_player.html";
  }

  function buildBoardDOM(){
    boardEl.innerHTML = "";
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const sq = document.createElement("button");
        sq.type = "button";
        sq.className = "sq " + (((r+c)%2===1) ? "dark":"light");
        sq.dataset.r = String(r);
        sq.dataset.c = String(c);
        boardEl.appendChild(sq);
      }
    }
    boardEl.addEventListener("pointerdown", onBoardPointerDown, { passive:false });
    boardEl.addEventListener("touchmove", (e)=>e.preventDefault(), { passive:false });
  }

  function newGame(){
    board = Array.from({length:8}, ()=>Array(8).fill(EMPTY));
    for(let r=0;r<=2;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2===1) board[r][c]=B;
      }
    }
    for(let r=5;r<=7;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2===1) board[r][c]=R;
      }
    }
    turn = R;
    selected = null;
    legalMoves = [];
    mustContinueCapture = null;
    busy = false;
    gameOver = false;
    hideOverlay();
    if(logEl) logEl.textContent = "";
    setStatus("Your turn (Red)");
    setHint("Tap a red piece, then tap a highlighted square.");
    render();
  }

  function getSq(r,c){
    const idx = r*8+c;
    return boardEl.children[idx] || null;
  }

  function render(){
    if(!board) return;
    for(const sq of boardEl.children){
      sq.classList.remove("sel","move","cap");
      sq.innerHTML = "";
    }

    if(selected){
      const s = getSq(selected.r, selected.c);
      if(s) s.classList.add("sel");
      for(const m of legalMoves){
        const d = getSq(m.tr, m.tc);
        if(!d) continue;
        d.classList.add("move");
        if(m.captures.length) d.classList.add("cap");
      }
    }

    let redCount=0, blueCount=0;
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const v = board[r][c];
      if(v===EMPTY) continue;
      const sq = getSq(r,c);
      const p = document.createElement("div");
      p.className = "piece " + (v>0 ? "red":"blue");
      if(Math.abs(v)===2) p.classList.add("king");

      if(v>0) redCount++; else blueCount++;

      if(Math.abs(v)===2){
        const k = document.createElement("div");
        k.className = "kingMark";
        k.textContent = "★";
        p.appendChild(k);
      }
      sq.appendChild(p);
    }
    if(scoreEl) scoreEl.textContent = `Red: ${redCount}  Blue: ${blueCount}`;
  }

  function onBoardPointerDown(e){
    if(busy || gameOver) return;
    const target = e.target.closest(".sq");
    if(!target) return;
    e.preventDefault();

    const r = Number(target.dataset.r);
    const c = Number(target.dataset.c);

    if(turn !== R) return;
    handleHumanTap(r,c);
  }

  function handleHumanTap(r,c){
    const v = board[r][c];

    if(mustContinueCapture){
      if(!(selected && selected.r===mustContinueCapture.r && selected.c===mustContinueCapture.c)){
        selected = {...mustContinueCapture};
        legalMoves = movesForPiece(board, R, mustContinueCapture.r, mustContinueCapture.c, true);
      }
    }

    if(v>0){
      if(mustContinueCapture && (r!==mustContinueCapture.r || c!==mustContinueCapture.c)){
        setHint("You must continue capturing with the same piece.");
        SFX.invalid();
        return;
      }
      selected = {r,c};
      const anyCaps = allMoves(board, R, true).length>0;
      legalMoves = movesForPiece(board, R, r, c, anyCaps);
      setHint(anyCaps ? "Capture is mandatory: choose a highlighted capture square." : "Choose a highlighted square.");
      SFX.select();
      render();
      return;
    }

    if(selected){
      const m = legalMoves.find(x => x.tr===r && x.tc===c);
      if(!m){ SFX.invalid(); return; }

      const from = {...selected};
      applyMove(board, m);

      if (m.captures.length) SFX.capture(); else SFX.move();
      if (m.promote) SFX.king();

      logLine(`Red: ${pos(from.r,from.c)} → ${pos(m.tr,m.tc)}${m.captures.length?" (capture)":""}`);

      if(m.captures.length){
        const more = movesForPiece(board, R, m.tr, m.tc, true);
        if(more.length){
          mustContinueCapture = {r:m.tr,c:m.tc};
          selected = {r:m.tr,c:m.tc};
          legalMoves = more;
          setHint("Multi-capture! Continue capturing.");
          render();
          return;
        }
      }

      mustContinueCapture = null;
      selected = null;
      legalMoves = [];
      render();

      if(isGameOver(board)) return endGame();

      turn = B;
      setStatus("Bot thinking (Blue)...");
      setHint("—");
      busy = true;
      setTimeout(() => { botMove(); busy=false; }, 120);
    }
  }

  function pos(r,c){ return String.fromCharCode(65+c) + (8-r); }
  function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
  function cloneBoard(bd){ return bd.map(row => row.slice()); }
  function willPromote(side, v, tr){
    if(Math.abs(v)===2) return false;
    return (side===R && tr===0) || (side===B && tr===7);
  }

  function movesForPiece(bd, side, r, c, capturesOnly){
    const v = bd[r][c];
    if(v===EMPTY) return [];
    const isKing = Math.abs(v)===2;

    const dirs = [];
    if(side===R || isKing) dirs.push([-1,-1],[-1,+1]);
    if(side===B || isKing) dirs.push([+1,-1],[+1,+1]);

    // capture DFS
    const captures = [];
    function dfs(brd, cr, cc, pathCaps, pieceVal){
      let found=false;
      const k = Math.abs(pieceVal)===2;

      const dlist = [];
      if(side===R || k) dlist.push([-1,-1],[-1,+1]);
      if(side===B || k) dlist.push([+1,-1],[+1,+1]);

      for(const [dr,dc] of dlist){
        const mr = cr+dr, mc = cc+dc;
        const tr = cr+dr*2, tc = cc+dc*2;
        if(!inBounds(tr,tc) || !inBounds(mr,mc)) continue;
        const mid = brd[mr][mc];
        const dst = brd[tr][tc];
        if(dst!==EMPTY) continue;
        if(side===R && mid>=0) continue;
        if(side===B && mid<=0) continue;
        if(mid===EMPTY) continue;

        found=true;
        const nb = cloneBoard(brd);
        nb[cr][cc]=EMPTY;
        nb[mr][mc]=EMPTY;
        nb[tr][tc]=pieceVal;

        dfs(nb, tr, tc, pathCaps.concat([{r:mr,c:mc}]), pieceVal);
      }

      if(!found && pathCaps.length){
        captures.push({
          fr:r, fc:c, tr:cr, tc:cc,
          captures: pathCaps.slice(),
          promote: willPromote(side, v, cr)
        });
      }
    }
    dfs(bd, r, c, [], v);
    if(captures.length) return captures;
    if(capturesOnly) return [];

    const moves=[];
    for(const [dr,dc] of dirs){
      const tr=r+dr, tc=c+dc;
      if(!inBounds(tr,tc)) continue;
      if(bd[tr][tc]!==EMPTY) continue;
      moves.push({ fr:r, fc:c, tr, tc, captures:[], promote: willPromote(side, v, tr) });
    }
    return moves;
  }

  function allMoves(bd, side, capturesOnly){
    let moves=[];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const v = bd[r][c];
      if(side===R && v<=0) continue;
      if(side===B && v>=0) continue;
      moves = moves.concat(movesForPiece(bd, side, r, c, capturesOnly));
    }
    if(capturesOnly) return moves.filter(m=>m.captures.length);
    const caps = moves.filter(m=>m.captures.length);
    return caps.length ? caps : moves;
  }

  function applyMove(bd, m){
    const v = bd[m.fr][m.fc];
    bd[m.fr][m.fc] = EMPTY;
    for(const cap of m.captures) bd[cap.r][cap.c]=EMPTY;
    let nv=v;
    if(m.promote) nv = (v>0) ? RK : BK;
    bd[m.tr][m.tc]=nv;
  }

  function evalBoard(bd){
    let score=0;
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const v=bd[r][c];
      if(v===EMPTY) continue;
      const val = (Math.abs(v)===2) ? 3.0 : 1.0;
      // blue wants higher score
      if(v<0) score += val + (r*0.02);
      else score -= val + ((7-r)*0.02);
    }
    return score;
  }
  function evalTerminal(side){ return (side===R) ? 9999 : -9999; }

  function minimax(bd, depth, side, alpha, beta){
    if(depth<=0) return evalBoard(bd);
    const moves = allMoves(bd, side, false);
    if(!moves.length) return evalTerminal(side);

    if(side===B){
      let best=-Infinity;
      for(const m of moves){
        const nb=cloneBoard(bd);
        applyMove(nb,m);
        const v=minimax(nb, depth-1, R, alpha, beta);
        best=Math.max(best,v);
        alpha=Math.max(alpha,best);
        if(beta<=alpha) break;
      }
      return best;
    }else{
      let best=Infinity;
      for(const m of moves){
        const nb=cloneBoard(bd);
        applyMove(nb,m);
        const v=minimax(nb, depth-1, B, alpha, beta);
        best=Math.min(best,v);
        beta=Math.min(beta,best);
        if(beta<=alpha) break;
      }
      return best;
    }
  }

  function pickMove(bd, moves, depth, randomness){
    // score all
    const scored = moves.map(m => {
      const nb=cloneBoard(bd);
      applyMove(nb,m);
      const val=minimax(nb, depth-1, R, -Infinity, Infinity);
      return { m, val };
    });
    scored.sort((a,b)=>b.val-a.val);

    // randomness: sometimes pick from top N instead of best
    const topN = Math.min(scored.length, Math.max(1, Math.round(1 + randomness * 5)));
    const pickIndex = (Math.random() < randomness && topN > 1)
      ? Math.floor(Math.random() * topN)
      : 0;

    return scored[pickIndex].m;
  }

  function botMove(){
    if(gameOver) return;
    const level = levelSel ? Number(levelSel.value) : 5;
    const { depth, randomness } = aiSettings(level);

    const moves = allMoves(board, B, false);
    if(!moves.length) return endGame();

    const best = pickMove(board, moves, depth, randomness);
    applyMove(board, best);

    if (best.captures.length) SFX.capture(); else SFX.move();
    if (best.promote) SFX.king();

    logLine(`Blue: ${pos(best.fr,best.fc)} → ${pos(best.tr,best.tc)}${best.captures.length?" (capture)":""}`);

    // chain captures
    if(best.captures.length){
      let cr=best.tr, cc=best.tc;
      while(true){
        const more = movesForPiece(board, B, cr, cc, true);
        if(!more.length) break;
        const next = pickMove(board, more, Math.max(1, depth-1), randomness * 0.6);
        applyMove(board,next);

        SFX.capture();
        if (next.promote) SFX.king();

        logLine(`Blue: ${pos(next.fr,next.fc)} → ${pos(next.tr,next.tc)} (capture)`);
        cr=next.tr; cc=next.tc;
      }
    }

    render();
    if(isGameOver(board)) return endGame();

    turn=R;
    setStatus("Your turn (Red)");
    setHint("Tap a red piece, then tap a highlighted square.");
  }

  function isGameOver(bd){
    return allMoves(bd, R, false).length===0 || allMoves(bd, B, false).length===0;
  }

  function endGame(){
    const r = allMoves(board, R, false).length;
    const b = allMoves(board, B, false).length;

    let title = "Game Over";
    let msg = "Tap New game to play again.";

    if(r===0 && b===0){
      title = "Draw";
      msg = "No moves for either side.";
    } else if(r===0){
      title = "Blue wins";
      msg = "You have no legal moves.";
      SFX.lose();
    } else if(b===0){
      title = "You won!";
      msg = "Blue has no legal moves.";
      SFX.win();
    } else {
      title = "Game Over";
      msg = "No legal moves remain.";
    }

    setStatus(title);
    setHint("Tap New game to play again.");
    turn=R; busy=false;

    showOverlay(title, msg);
  }

  // wiring
  if (btnSound) {
    btnSound.textContent = "Audio: Off";
    btnSound.addEventListener("click", async () => {
      await SFX.startFromUserGesture();
      SFX.setEnabled(!SFX.enabled);
      if (SFX.enabled) SFX.select();
    });
  }

  if (btnBack) btnBack.addEventListener("click", goBack);
  if (btnNew) btnNew.addEventListener("click", () => { hideOverlay(); newGame(); });

  if (btnOverlayNew) btnOverlayNew.addEventListener("click", () => { hideOverlay(); newGame(); });
  if (btnOverlayBack) btnOverlayBack.addEventListener("click", goBack);
  if (btnOverlayClose) btnOverlayClose.addEventListener("click", () => hideOverlay());

  if (levelSel) {
    levelSel.addEventListener("change", () => {
      logLine(`AI Level: ${levelSel.value}`);
    });
  }

  // boot
  if(!boardEl) return;
  buildBoardDOM();
  newGame();
})();
