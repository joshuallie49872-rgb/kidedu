/* KidEdu Checkers — self-contained, no external libs.
   Pieces:  1 = Red man,  2 = Red king
           -1 = Blue man, -2 = Blue king
   Red (player) starts at bottom, moves up (row-1). Blue moves down (row+1).
*/
const $ = (sel) => document.querySelector(sel);

const SIZE = 8;

let board = null;
let turn = 1;               // 1 = Red (player), -1 = Blue (bot)
let selected = null;        // {r,c}
let legal = [];             // moves for current turn
let pendingChain = null;    // when multi-jump is forced: {r,c, continuations: [...]}
let level = 4; // 1..10
let thinking = false;
let gameOver = false;

function showEndOverlay(title, sub){
  gameOver = true;
  const ov = $("#endOverlay");
  if(!ov) return;
  $("#endTitle").textContent = title;
  $("#endSub").textContent = sub || "";
  ov.classList.add("show");
  ov.setAttribute("aria-hidden","false");
}

function hideEndOverlay(){
  const ov = $("#endOverlay");
  if(!ov) return;
  ov.classList.remove("show");
  ov.setAttribute("aria-hidden","true");
}

// --- Sound Engine (no audio assets) ---
const SFX = (() => {
  let enabled = false;
  let ctx = null;

  function ensure(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  async function startFromUserGesture(){
    const c = ensure();
    if(c.state !== "running"){
      try { await c.resume(); } catch {}
    }
  }

  function beep(freq=440, dur=0.08, type="sine", gain=0.06){
    if(!enabled) return;
    const c = ensure();
    if(c.state !== "running") return; // iOS: must be unlocked by user gesture
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
    const btn = document.querySelector("#btnSound");
    if(btn) btn.textContent = `Audio: ${enabled ? "On" : "Off"}`;
  }

  return { startFromUserGesture, setEnabled, get enabled(){return enabled;}, select, invalid, move, capture, king, win, lose };
})();


function cloneBoard(b){ return b.map(row => row.slice()); }

function inBounds(r,c){ return r>=0 && r<SIZE && c>=0 && c<SIZE; }

function pieceAt(b,r,c){ return b[r][c]; }
function sideOf(p){ return p===0 ? 0 : (p>0 ? 1 : -1); }
function isKing(p){ return Math.abs(p)===2; }

function initBoard(){
  const b = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
  // Blue on top rows 0..2 on dark squares
  for(let r=0;r<3;r++){
    for(let c=0;c<SIZE;c++){
      if((r+c)%2===1) b[r][c] = -1;
    }
  }
  // Red on bottom rows 5..7
  for(let r=5;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      if((r+c)%2===1) b[r][c] = 1;
    }
  }
  return b;
}

function promoteIfNeeded(b, r, c){
  const p = b[r][c];
  if(p===1 && r===0) b[r][c]=2;
  if(p===-1 && r===SIZE-1) b[r][c]=-2;
}

function dirsForPiece(p){
  const s = sideOf(p);
  if(isKing(p)) return [[-1,-1],[-1,1],[1,-1],[1,1]];
  return s===1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
}

function genMovesForPiece(b, r, c){
  const p = b[r][c];
  if(p===0) return {steps:[], jumps:[]};
  const s = sideOf(p);
  const dirs = dirsForPiece(p);

  const steps=[];
  const jumps=[];

  for(const [dr,dc] of dirs){
    const r1=r+dr, c1=c+dc;
    if(!inBounds(r1,c1)) continue;
    if(b[r1][c1]===0){
      steps.push({from:[r,c], to:[r1,c1], captures:[]});
    } else {
      const mid = b[r1][c1];
      if(sideOf(mid)===-s){
        const r2=r+2*dr, c2=c+2*dc;
        if(inBounds(r2,c2) && b[r2][c2]===0){
          jumps.push({from:[r,c], to:[r2,c2], captures:[[r1,c1]]});
        }
      }
    }
  }
  return {steps, jumps};
}

// For multi-jump, after one jump we must continue jumping if possible.
function genJumpChains(b, startR, startC){
  const p0 = b[startR][startC];
  const s = sideOf(p0);

  function dfs(b2, r, c, capturesSoFar){
    const {jumps} = genMovesForPiece(b2, r, c);
    const nextJumps = jumps.filter(m => m.captures.length===1); // always 1 mid capture each hop
    if(nextJumps.length===0){
      return [{from:[startR,startC], to:[r,c], captures: capturesSoFar.slice()}];
    }
    const out=[];
    for(const j of nextJumps){
      // apply hop on a copy
      const b3 = cloneBoard(b2);
      const [fr,fc]=[r,c];
      const [tr,tc]=j.to;
      const [cr,cc]=j.captures[0];
      const moving = b3[fr][fc];
      b3[fr][fc]=0;
      b3[cr][cc]=0;
      b3[tr][tc]=moving;
      promoteIfNeeded(b3,tr,tc); // promotion can happen mid-chain in some rules; we allow it.
      out.push(...dfs(b3, tr, tc, capturesSoFar.concat([[cr,cc]])));
    }
    return out;
  }

  return dfs(b, startR, startC, []);
}

function genAllLegalMoves(b, side){
  const allSteps=[];
  let allJumps=[];
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      if(sideOf(b[r][c])!==side) continue;
      const chains = genJumpChains(b, r, c);
      // chains will include "no jump" case only if no jumps exist, but our dfs uses jumps only
      // We detect if piece has any jump:
      const {jumps} = genMovesForPiece(b, r, c);
      if(jumps.length>0){
        // Real jump chains
        allJumps = allJumps.concat(chains.filter(m => m.captures.length>0));
      } else {
        const {steps} = genMovesForPiece(b, r, c);
        allSteps.push(...steps);
      }
    }
  }
  // If any capture exists, captures are mandatory
  if(allJumps.length>0) return allJumps;
  return allSteps;
}

function applyMove(b, move){
  const b2 = cloneBoard(b);
  const [fr,fc]=move.from;
  const [tr,tc]=move.to;
  const moving = b2[fr][fc];
  b2[fr][fc]=0;
  for(const [cr,cc] of move.captures){
    b2[cr][cc]=0;
  }
  b2[tr][tc]=moving;
  promoteIfNeeded(b2,tr,tc);
  return b2;
}

function countPieces(b){
  let red=0, blue=0;
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const p=b[r][c];
      if(p>0) red++;
      if(p<0) blue++;
    }
  }
  return {red, blue};
}

function evalBoard(b){
  // Simple heuristic: material + king bonus + advancement + mobility
  let score=0;
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const p=b[r][c];
      if(p===0) continue;
      const s=sideOf(p);
      const king=isKing(p);
      const base = king ? 3.0 : 1.0;
      const adv = king ? 0 : (s===1 ? (7-r)/7 : r/7); // encourage moving forward
      score += s * (base + 0.15*adv);
    }
  }
  // mobility
  const mRed = genAllLegalMoves(b, 1).length;
  const mBlue = genAllLegalMoves(b, -1).length;
  score += 0.03*(mRed - mBlue);
  return score; // positive favors Red, negative favors Blue
}

function minimax(b, side, depth, alpha, beta){
  const moves = genAllLegalMoves(b, side);
  if(depth===0 || moves.length===0){
    // if no moves, side loses
    if(moves.length===0){
      return {score: side===1 ? -999 : 999, move: null};
    }
    return {score: evalBoard(b), move: null};
  }

  let bestMove=null;

  if(side===1){
    let best=-Infinity;
    for(const mv of moves){
      const b2 = applyMove(b, mv);
      const res = minimax(b2, -1, depth-1, alpha, beta);
      if(res.score>best){ best=res.score; bestMove=mv; }
      alpha = Math.max(alpha, best);
      if(beta<=alpha) break;
    }
    return {score: best, move: bestMove};
  } else {
    let best=Infinity;
    for(const mv of moves){
      const b2 = applyMove(b, mv);
      const res = minimax(b2, 1, depth-1, alpha, beta);
      if(res.score<best){ best=res.score; bestMove=mv; }
      beta = Math.min(beta, best);
      if(beta<=alpha) break;
    }
    return {score: best, move: bestMove};
  }
}

function chooseBotMove(){
  const moves = genAllLegalMoves(board, -1);
  if(moves.length===0) return null;

  // Level 1..10:
  // - lower levels: more random + shallow lookahead
  // - higher levels: deeper minimax + less randomness
  const L = Math.max(1, Math.min(10, level|0));

  // randomness: 50% at L1 -> 5% at L10
  const randProb = Math.max(0.05, (11 - L) / 20);

  // L1: purely random
  if(L === 1){
    return moves[Math.floor(Math.random()*moves.length)];
  }

  // quick greedy (1-ply eval): used for L2-L4
  const greedyBest = () => {
    let best=null, bestScore=Infinity;
    for(const mv of moves){
      const b2 = applyMove(board, mv);
      const sc = evalBoard(b2); // bot wants low score
      if(sc<bestScore){ bestScore=sc; best=mv; }
    }
    return best || moves[0];
  };

  if(L <= 4){
    if(Math.random() < randProb) return moves[Math.floor(Math.random()*moves.length)];
    return greedyBest();
  }

  // minimax depth by level (kept sane for mobile)
  const depthByLevel = {
    5: 2,
    6: 3,
    7: 4,
    8: 5,
    9: 5,
    10: 6
  };
  const depth = depthByLevel[L] ?? 4;

  // small randomness still, to make it feel less "perfect"
  if(Math.random() < randProb) return moves[Math.floor(Math.random()*moves.length)];

  const res = minimax(board, -1, depth, -Infinity, Infinity);
  return res.move || greedyBest();
}

function render(){
  const boardEl = $("#board");
  boardEl.innerHTML = "";

  const isPlayersTurn = (turn===1);
  $("#status").textContent = thinking ? "Bot thinking…" : (isPlayersTurn ? "Your turn (Red)" : "Bot turn (Blue)");
  $("#hint").textContent = isPlayersTurn ? "Tap a red piece, then tap a highlighted square." : "Wait for the bot.";

  legal = genAllLegalMoves(board, turn);

  const moveTargets = new Map(); // key "r,c" => {moves:[], capture:boolean}
  if(selected){
    for(const mv of legal){
      if(mv.from[0]===selected.r && mv.from[1]===selected.c){
        const key = `${mv.to[0]},${mv.to[1]}`;
        const prev = moveTargets.get(key) || {moves:[], capture:false};
        prev.moves.push(mv);
        if(mv.captures.length>0) prev.capture=true;
        moveTargets.set(key, prev);
      }
    }
  }

  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const sq = document.createElement("div");
      const dark = (r+c)%2===1;
      sq.className = "sq " + (dark ? "dark":"light");
      sq.dataset.r = r;
      sq.dataset.c = c;

      if(selected && selected.r===r && selected.c===c) sq.classList.add("sel");

      const tgt = moveTargets.get(`${r},${c}`);
      if(tgt){
        sq.classList.add("move");
        if(tgt.capture) sq.classList.add("capture");
      }

      const p = board[r][c];
      if(p!==0){
        const pc = document.createElement("div");
        pc.className = "piece " + (p>0 ? "p1":"p2") + (isKing(p) ? " king":"");
        sq.appendChild(pc);
      }

      sq.addEventListener("click", () => onSquareClick(r,c));
      boardEl.appendChild(sq);
    }
  }

  const counts = countPieces(board);
  $("#scoreline").textContent = `Red: ${counts.red}    Blue: ${counts.blue}`;
}

function logLine(s){
  const el = $("#log");
  el.textContent += (el.textContent ? "\n":"") + s;
  el.scrollTop = el.scrollHeight;
}

function clearLog(){ $("#log").textContent = ""; }

function endCheck(){
  const moves = genAllLegalMoves(board, turn);
  const counts = countPieces(board);
  if(counts.red===0){
    logLine("Blue wins.");
    $("#status").textContent = "Blue wins";
    $("#hint").textContent = "Tap New game to play again.";
    SFX.lose();
    showEndOverlay("Blue wins", "Want a rematch?");
    return true;
  }
  if(counts.blue===0){
    logLine("Red wins.");
    $("#status").textContent = "You won! (Red)";
    $("#hint").textContent = "Tap New game to play again.";
    SFX.win();
    showEndOverlay("You won! (Red)", "Nice! Play again or go back.");
    return true;
  }
  if(moves.length===0){
    logLine((turn===1 ? "Red" : "Blue") + " has no legal moves.");
    const winner = (turn===1 ? -1 : 1);
    logLine((winner===1 ? "Red" : "Blue") + " wins.");
    $("#status").textContent = (winner===1 ? "You won! (Red)" : "Blue wins");
    $("#hint").textContent = "Tap New game to play again.";
    if(winner===1) { SFX.win(); showEndOverlay("You won! (Red)", "Opponent has no moves."); }
    else { SFX.lose(); showEndOverlay("Blue wins", "You have no legal moves."); }
    return true;
  }
  return false;
}

function onSquareClick(r,c){
  if(thinking) return;
  if(gameOver) return;
  if(turn!==1) return; // only player clicks on their turn

  const p = board[r][c];
  const s = sideOf(p);

  if(selected){
    // Try move to clicked square
    const candidates = legal.filter(mv => mv.from[0]===selected.r && mv.from[1]===selected.c && mv.to[0]===r && mv.to[1]===c);
    if(candidates.length){
      // If multiple (rare), pick the one with most captures.
      candidates.sort((a,b)=>b.captures.length-a.captures.length);
      doMove(candidates[0]);
      return;
    } else {
      // selected but tapped a non-move square
      SFX.invalid();
    }
  }

  // Select a piece
  if(s===1){
    selected = {r,c};
    SFX.select();
    render();
  } else {
    // clicking empty or enemy clears selection
    if(selected) SFX.invalid();
    selected = null;
    render();
  }
}

function doMove(move){
  const movingBefore = board[move.from[0]][move.from[1]];
  board = applyMove(board, move);
  const movedAfter = board[move.to[0]][move.to[1]];
  if(move.captures.length) SFX.capture(); else SFX.move();
  if(!isKing(movingBefore) && isKing(movedAfter)) SFX.king();
  logLine(`Red: ${move.from.join(",")} → ${move.to.join(",")}` + (move.captures.length?` (x${move.captures.length})`:""));
  selected = null;

  // switch turn
  turn *= -1;

  render();
  if(endCheck()) return;

  // bot turn
  botTurn();
}

function botTurn(){
  if(gameOver) return;
  thinking = true;
  render();

  setTimeout(() => {
    const mv = chooseBotMove();
    if(!mv){
      thinking=false;
      render();
      endCheck();
      return;
    }
    const movingBefore = board[mv.from[0]][mv.from[1]];
    board = applyMove(board, mv);
    const movedAfter = board[mv.to[0]][mv.to[1]];
    if(mv.captures.length) SFX.capture(); else SFX.move();
    if(!isKing(movingBefore) && isKing(movedAfter)) SFX.king();
    logLine(`Blue: ${mv.from.join(",")} → ${mv.to.join(",")}` + (mv.captures.length?` (x${mv.captures.length})`:""));
    turn *= -1;
    thinking = false;
    render();
    endCheck();
  }, 250);
}

function newGame(){
  gameOver = false;
  hideEndOverlay();
  board = initBoard();
  turn = 1;
  selected = null;
  thinking = false;
  clearLog();
  logLine("New game.");
  render();
}

function setDifficultyFromURL(){
  const q = new URLSearchParams(location.search);

  // preferred: ?level=1..10
  const raw = q.get("level") || q.get("bot");
  const n = Number(raw);
  if(Number.isFinite(n) && n>=1 && n<=10) level = Math.floor(n);

  // backward-compat: ?bot=easy|med|hard
  const b = q.get("bot");
  if(b==="easy") level = 2;
  if(b==="med") level = 4;
  if(b==="hard") level = 8;

  const sel = $("#difficulty");
  if(sel) sel.value = String(level);
}

function wireUI(){
  $("#btnNew").addEventListener("click", () => newGame());

  // Back buttons
  const goBack = () => { window.location.href = "../../approved_player.html"; };
  const bb = $("#btnBack"); if(bb) bb.addEventListener("click", goBack);
  const eb = $("#btnEndBack"); if(eb) eb.addEventListener("click", goBack);

  const en = $("#btnEndNew"); if(en) en.addEventListener("click", () => newGame());
  const ec = $("#btnEndClose"); if(ec) ec.addEventListener("click", () => hideEndOverlay());

  const snd = $("#btnSound");
  if(snd){
    snd.textContent = "Audio: Off";
    snd.addEventListener("click", async () => {
      await SFX.startFromUserGesture();
      SFX.setEnabled(!SFX.enabled);
      if(SFX.enabled) SFX.select();
    });
  }
  const ov = $("#endOverlay");
  if(ov){
    ov.addEventListener("click", (e)=>{ if(e.target===ov) hideEndOverlay(); });
  }

  $("#difficulty").addEventListener("change", (e) => {
    level = Math.max(1, Math.min(10, Number(e.target.value)||4));
    logLine(`Level: ${level}`);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setDifficultyFromURL();
  wireUI();
  newGame();
});