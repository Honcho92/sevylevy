import { useState, useEffect, useRef, useCallback } from "react";

// ── Product Image URLs (public CDN/brand images) ────────────────────
const PRODUCT_IMAGES = {
  1: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=120&h=120&fit=crop", // fountain drink
  2: "https://images.unsplash.com/photo-1572490362544-ac4cd1b06681?w=120&h=120&fit=crop", // slurpee-like
  3: "https://images.unsplash.com/photo-1612392062126-2bca4c3251da?w=120&h=120&fit=crop", // hot dog
  4: "https://images.unsplash.com/photo-1599974579688-8dbdd335c6f7?w=120&h=120&fit=crop", // taquitos
  5: "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=120&h=120&fit=crop", // chips
  6: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=120&h=120&fit=crop", // energy drink
  7: "https://images.unsplash.com/photo-1622541520067-49b4688ce1d0?w=120&h=120&fit=crop", // energy can
  8: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=120&h=120&fit=crop", // spicy chips
  9: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", // pizza
  10: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=120&h=120&fit=crop", // cookies
};

// ── Data & Constants ────────────────────────────────────────────────
const CATEGORIES = ["Drinks","Snacks","Hot Food","Tobacco","Candy","Ice Cream","Personal Care","Grocery","Alcohol","Other"];
const SAMPLE_ITEMS = [
  { id:1, name:"Big Gulp 32oz", category:"Drinks", price:1.89, inStock:true, ordersToday:12 },
  { id:2, name:"Slurpee Medium", category:"Drinks", price:2.19, inStock:true, ordersToday:18 },
  { id:3, name:"Hot Dog Roller", category:"Hot Food", price:2.49, inStock:true, ordersToday:8 },
  { id:4, name:"Taquito 3-Pack", category:"Hot Food", price:3.99, inStock:false, ordersToday:5 },
  { id:5, name:"Doritos Nacho", category:"Snacks", price:2.29, inStock:true, ordersToday:14 },
  { id:6, name:"Red Bull 12oz", category:"Drinks", price:3.49, inStock:true, ordersToday:22 },
  { id:7, name:"Monster Energy", category:"Drinks", price:3.29, inStock:true, ordersToday:16 },
  { id:8, name:"Takis Fuego", category:"Snacks", price:2.49, inStock:true, ordersToday:11 },
  { id:9, name:"Pizza Slice", category:"Hot Food", price:3.49, inStock:true, ordersToday:7 },
  { id:10, name:"Cookie 2-Pack", category:"Snacks", price:1.99, inStock:true, ordersToday:4 },
];

const STATUS_FLOW = ["new","preparing","ready","picked_up","completed"];
const STATUS_LABELS = { new:"New", preparing:"Preparing", ready:"Ready", picked_up:"Picked Up", completed:"Completed" };
const STATUS_COLORS = { new:"#FF6B35", preparing:"#FFBA08", ready:"#06D6A0", picked_up:"#118AB2", completed:"#6c757d" };

function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }); }
function minsAgo(d) { return Math.floor((Date.now() - new Date(d).getTime()) / 60000); }

// ── Persistent State ────────────────────────────────────────────────
function usePersist(key, init) {
  const [s, setS] = useState(() => {
    try { const v = window._dc?.[key]; return v !== undefined ? v : init; } catch { return init; }
  });
  useEffect(() => { if (!window._dc) window._dc = {}; window._dc[key] = s; }, [key, s]);
  return [s, setS];
}

// ── Icons ───────────────────────────────────────────────────────────
const I = {
  orders: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>,
  inventory: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  analytics: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  msg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  swap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  cam: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  addItem: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
};

// ── Styles ──────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  :root {
    --bg-primary: #0A0E17; --bg-secondary: #111827; --bg-card: #151C2C;
    --bg-card-hover: #1A2236; --bg-elevated: #1E2740;
    --border: #1F2B3E; --border-light: #2A3A52;
    --text-primary: #F1F5F9; --text-secondary: #8B9AB5; --text-muted: #5A6A82;
    --accent: #FF6B35; --accent-glow: rgba(255,107,53,0.15);
    --accent-green: #06D6A0; --accent-green-glow: rgba(6,214,160,0.15);
    --accent-yellow: #FFBA08; --accent-blue: #118AB2;
    --accent-red: #EF4444; --accent-red-glow: rgba(239,68,68,0.12);
    --radius: 14px; --radius-sm: 8px;
    --transition: 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body, #root {
    font-family: 'Outfit', -apple-system, sans-serif;
    background: var(--bg-primary); color: var(--text-primary);
    min-height:100vh; overflow-x:hidden; -webkit-font-smoothing:antialiased;
  }
  .app { max-width:480px; margin:0 auto; min-height:100vh; display:flex; flex-direction:column; position:relative; }

  /* Header */
  .header {
    padding:16px 20px 12px; display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:100;
    background:linear-gradient(180deg,var(--bg-primary) 70%,transparent);
    backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  }
  .header-brand { display:flex; align-items:center; gap:10px; }
  .header-logo {
    width:36px; height:36px; background:linear-gradient(135deg,var(--accent),#FF8F65);
    border-radius:10px; display:flex; align-items:center; justify-content:center;
    font-family:'JetBrains Mono',monospace; font-weight:800; font-size:14px; color:white;
    box-shadow:0 2px 12px rgba(255,107,53,0.3);
  }
  .header-title { font-weight:700; font-size:18px; letter-spacing:-0.3px; }
  .header-sub { font-size:11px; color:var(--text-muted); font-weight:500; letter-spacing:0.5px; text-transform:uppercase; }
  .header-actions { display:flex; gap:8px; }
  .icon-btn {
    width:40px; height:40px; border-radius:12px; background:var(--bg-card); border:1px solid var(--border);
    color:var(--text-secondary); display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all var(--transition); position:relative;
  }
  .icon-btn:active { transform:scale(0.92); }
  .notif-dot { position:absolute; top:6px; right:6px; width:8px; height:8px; background:var(--accent); border-radius:50%; border:2px solid var(--bg-primary); animation:pd 2s infinite; }
  @keyframes pd { 0%,100%{opacity:1} 50%{opacity:.5} }

  .main { flex:1; padding:0 16px 100px; overflow-y:auto; }
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:20px; }
  .stat { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:14px 12px; text-align:center; }
  .stat-val { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:700; letter-spacing:-1px; line-height:1; margin-bottom:4px; }
  .stat-lbl { font-size:11px; color:var(--text-muted); font-weight:500; text-transform:uppercase; letter-spacing:0.5px; }
  .c-a { color:var(--accent); } .c-g { color:var(--accent-green); } .c-y { color:var(--accent-yellow); }

  .sec-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; margin-top:8px; }
  .sec-title { font-size:15px; font-weight:600; color:var(--text-secondary); }
  .sec-badge { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600; background:var(--accent-glow); color:var(--accent); padding:3px 8px; border-radius:6px; }

  .filters { display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:4px; scrollbar-width:none; }
  .filters::-webkit-scrollbar { display:none; }
  .chip { flex-shrink:0; padding:7px 14px; border-radius:20px; font-size:13px; font-weight:500; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); cursor:pointer; transition:all var(--transition); white-space:nowrap; font-family:'Outfit',sans-serif; }
  .chip:active { transform:scale(0.95); }
  .chip.on { background:var(--accent); border-color:var(--accent); color:white; box-shadow:0 2px 12px rgba(255,107,53,0.3); }

  /* Order Card */
  .ocard { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin-bottom:10px; transition:all var(--transition); animation:su .3s ease-out; }
  @keyframes su { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .ocard:active { transform:scale(0.985); }
  .ocard-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .oid { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600; }
  .otime { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text-muted); }
  .otime.urg { color:var(--accent-red); }
  .badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; }
  .badge-dot { width:7px; height:7px; border-radius:50%; }

  /* Order Item Row with image */
  .oitem-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); }
  .oitem-row:last-child { border-bottom:none; }
  .oitem-img { width:44px; height:44px; border-radius:8px; object-fit:cover; background:var(--bg-elevated); flex-shrink:0; }
  .oitem-img-placeholder { width:44px; height:44px; border-radius:8px; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:11px; flex-shrink:0; }
  .oitem-info { flex:1; min-width:0; }
  .oitem-name { font-size:13px; font-weight:500; }
  .oitem-qty { font-size:11px; color:var(--text-muted); }
  .oitem-actions { display:flex; gap:4px; flex-shrink:0; }
  .oitem-btn { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:var(--bg-elevated); color:var(--text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--transition); }
  .oitem-btn:active { transform:scale(0.9); }
  .oitem-btn.sub { border-color:var(--accent-yellow); color:var(--accent-yellow); }
  .oitem-btn.unavail { border-color:var(--accent-red); color:var(--accent-red); }
  .oitem-btn.restore { border-color:var(--accent-green); color:var(--accent-green); }
  .oitem-sub { font-size:11px; color:var(--accent-yellow); font-weight:500; margin-top:2px; display:flex; align-items:center; gap:3px; }
  .oitem-unavail { font-size:11px; color:var(--accent-red); font-weight:500; margin-top:2px; display:flex; align-items:center; gap:3px; }

  .add-item-bar { display:flex; align-items:center; justify-content:center; padding:8px 0 4px; }
  .add-item-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:20px; font-size:12px; font-weight:600; border:1px dashed var(--border-light); background:transparent; color:var(--text-muted); cursor:pointer; transition:all var(--transition); font-family:'Outfit',sans-serif; }
  .add-item-btn:hover { border-color:var(--accent); color:var(--accent); }
  .add-item-btn:active { transform:scale(0.95); }

  .ofoot { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
  .ototal { font-family:'JetBrains Mono',monospace; font-size:16px; font-weight:700; color:var(--accent-green); }
  .btn { padding:8px 14px; border-radius:var(--radius-sm); font-size:12px; font-weight:600; border:none; cursor:pointer; transition:all var(--transition); display:flex; align-items:center; gap:5px; font-family:'Outfit',sans-serif; }
  .btn:active { transform:scale(0.93); }
  .btn-p { background:var(--accent); color:white; box-shadow:0 2px 8px rgba(255,107,53,0.25); }
  .btn-s { background:var(--bg-elevated); color:var(--text-secondary); border:1px solid var(--border); }
  .btn-g { background:var(--accent-green); color:white; }
  .btn-y { background:var(--accent-yellow); color:#1a1a2e; }

  /* Dasher Bar */
  .dasher-bar { display:flex; gap:6px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); }
  .dasher-btn { flex:1; padding:8px; border-radius:var(--radius-sm); font-size:11px; font-weight:600; border:1px solid var(--border); background:var(--bg-elevated); color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all var(--transition); font-family:'Outfit',sans-serif; }
  .dasher-btn:active { transform:scale(0.95); }
  .dasher-btn.call { border-color:var(--accent-green); color:var(--accent-green); }
  .dasher-btn.text { border-color:var(--accent-blue); color:var(--accent-blue); }
  .dasher-btn.log { border-color:var(--accent); color:var(--accent); }

  /* Search */
  .searchbar { display:flex; align-items:center; gap:10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:10px 14px; margin-bottom:14px; transition:border-color var(--transition); }
  .searchbar:focus-within { border-color:var(--accent); }
  .searchbar input { flex:1; background:none; border:none; color:var(--text-primary); font-size:14px; font-family:'Outfit',sans-serif; outline:none; }
  .searchbar input::placeholder { color:var(--text-muted); }

  /* Inventory Item with photo */
  .inv { display:flex; align-items:center; gap:10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; margin-bottom:8px; transition:all var(--transition); }
  .inv-img { width:48px; height:48px; border-radius:8px; object-fit:cover; background:var(--bg-elevated); flex-shrink:0; }
  .inv-body { flex:1; min-width:0; }
  .inv-name { font-size:14px; font-weight:500; margin-bottom:2px; }
  .inv-meta { font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:8px; }
  .inv-right { display:flex; align-items:center; gap:8px; }
  .inv-price { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--accent-green); }
  .inv-edit-btn { width:28px; height:28px; border-radius:6px; border:1px solid var(--border); background:var(--bg-elevated); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .inv-edit-btn:active { transform:scale(0.9); }
  .cat-chip { font-size:10px; padding:2px 6px; border-radius:4px; font-weight:600; background:rgba(255,186,8,0.12); color:var(--accent-yellow); }
  .toggle { width:44px; height:24px; border-radius:12px; background:var(--accent-red); position:relative; cursor:pointer; transition:background var(--transition); flex-shrink:0; border:none; }
  .toggle.on { background:var(--accent-green); }
  .toggle::after { content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:white; transition:transform var(--transition); box-shadow:0 1px 4px rgba(0,0,0,0.3); }
  .toggle.on::after { transform:translateX(20px); }

  /* Charts */
  .chart-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:18px; margin-bottom:14px; }
  .chart-title { font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
  .bar-chart { display:flex; align-items:flex-end; gap:6px; height:120px; padding-top:8px; }
  .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; }
  .bar { width:100%; border-radius:4px 4px 0 0; transition:height .6s cubic-bezier(.34,1.56,.64,1); min-height:4px; }
  .bar-lbl { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:500; }
  .top-list { display:flex; flex-direction:column; gap:10px; }
  .top-item { display:flex; align-items:center; gap:12px; }
  .top-rank { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:var(--text-muted); width:20px; text-align:center; }
  .top-rank.gold { color:var(--accent-yellow); } .top-rank.silver { color:#A0AEC0; } .top-rank.bronze { color:#CD7F32; }
  .top-bar-bg { flex:1; height:32px; background:var(--bg-elevated); border-radius:6px; overflow:hidden; }
  .top-bar-fill { height:100%; border-radius:6px; transition:width .8s cubic-bezier(.34,1.56,.64,1); display:flex; align-items:center; padding-left:10px; }
  .top-bar-name { font-size:12px; font-weight:500; color:white; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,.3); }
  .top-bar-count { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; color:var(--text-secondary); width:32px; text-align:right; }

  /* Bottom Nav */
  .nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:480px; background:rgba(17,24,39,0.92); border-top:1px solid var(--border); display:flex; padding:8px 16px; padding-bottom:max(8px,env(safe-area-inset-bottom)); z-index:200; backdrop-filter:blur(20px); }
  .nav-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:12px; cursor:pointer; color:var(--text-muted); transition:all var(--transition); background:transparent; border:none; font-family:'Outfit',sans-serif; }
  .nav-btn:active { transform:scale(0.9); }
  .nav-btn.on { color:var(--accent); }
  .nav-lbl { font-size:11px; font-weight:600; }
  .nav-dot { width:20px; height:3px; background:var(--accent); border-radius:2px; opacity:0; transform:scaleX(0); transition:all var(--transition); }
  .nav-btn.on .nav-dot { opacity:1; transform:scaleX(1); }

  /* Modal / Sheet */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); z-index:300; display:flex; align-items:flex-end; justify-content:center; animation:fi .2s ease; }
  @keyframes fi { from{opacity:0} to{opacity:1} }
  .sheet { width:100%; max-width:480px; background:var(--bg-secondary); border-radius:20px 20px 0 0; padding:20px; padding-bottom:max(20px,env(safe-area-inset-bottom)); max-height:85vh; overflow-y:auto; animation:sm .3s cubic-bezier(.32,.72,0,1); }
  @keyframes sm { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .sheet-handle { width:36px; height:4px; background:var(--border-light); border-radius:2px; margin:0 auto 16px; }
  .sheet-title { font-size:18px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .fg { margin-bottom:14px; }
  .fl { font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block; }
  .fi { width:100%; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:14px; font-family:'Outfit',sans-serif; outline:none; }
  .fi:focus { border-color:var(--accent); }
  .fi-area { resize:vertical; min-height:60px; }
  .item-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
  .item-chip { display:flex; align-items:center; gap:4px; padding:5px 10px; background:var(--bg-elevated); border-radius:6px; font-size:12px; color:var(--text-secondary); }
  .item-chip-x { cursor:pointer; color:var(--text-muted); display:flex; align-items:center; }
  .submit-btn { width:100%; padding:14px; border-radius:var(--radius); background:linear-gradient(135deg,var(--accent),#FF8F65); color:white; font-size:15px; font-weight:700; border:none; cursor:pointer; font-family:'Outfit',sans-serif; box-shadow:0 4px 16px rgba(255,107,53,0.3); transition:all var(--transition); margin-top:8px; }
  .submit-btn:active { transform:scale(0.97); }
  .submit-btn:disabled { opacity:0.4; }

  /* Alert Banner */
  .alert-banner { background:var(--accent-red-glow); border:1px solid var(--accent-red); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:10px; display:flex; align-items:flex-start; gap:8px; animation:su .3s ease-out; }
  .alert-text { font-size:12px; color:var(--text-primary); flex:1; line-height:1.4; }
  .alert-actions { display:flex; gap:6px; flex-shrink:0; }
  .alert-btn { padding:5px 10px; border-radius:6px; font-size:11px; font-weight:600; border:none; cursor:pointer; display:flex; align-items:center; gap:3px; font-family:'Outfit',sans-serif; transition:all var(--transition); }
  .alert-btn:active { transform:scale(0.93); }
  .alert-copy { background:var(--bg-elevated); color:var(--text-secondary); border:1px solid var(--border); }
  .alert-dismiss { background:var(--accent-red); color:white; }

  /* Dasher Notes Log */
  .log-entry { background:var(--bg-elevated); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:8px; }
  .log-time { font-size:10px; color:var(--text-muted); font-family:'JetBrains Mono',monospace; margin-bottom:4px; }
  .log-text { font-size:13px; color:var(--text-secondary); line-height:1.4; }

  .empty { text-align:center; padding:48px 20px; color:var(--text-muted); }
  .empty-icon { font-size:48px; margin-bottom:12px; opacity:0.5; }
  .empty-text { font-size:14px; line-height:1.5; }

  .copied-toast { position:fixed; top:80px; left:50%; transform:translateX(-50%); background:var(--accent-green); color:white; padding:8px 20px; border-radius:20px; font-size:13px; font-weight:600; z-index:999; animation:su .2s ease-out; pointer-events:none; }

  .main::-webkit-scrollbar { width:4px; }
  .main::-webkit-scrollbar-track { background:transparent; }
  .main::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
`;

// ── Product Image Component ─────────────────────────────────────────
function ProductImg({ id, size = 44 }) {
  const src = PRODUCT_IMAGES[id];
  if (!src) return <div className="oitem-img-placeholder" style={{ width: size, height: size }}>📦</div>;
  return <img className="oitem-img" src={src} alt="" style={{ width: size, height: size }} onError={e => { e.target.style.display = 'none'; }} />;
}

// ── Toast ───────────────────────────────────────────────────────────
function Toast({ message }) {
  if (!message) return null;
  return <div className="copied-toast">{message}</div>;
}

// ── Substitution Modal ──────────────────────────────────────────────
function SubstituteModal({ item, inventory, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const sameCategory = inventory.filter(i => i.inStock && i.id !== item.id && i.category === item.category);
  const filtered = search
    ? inventory.filter(i => i.inStock && i.id !== item.id && i.name.toLowerCase().includes(search.toLowerCase()))
    : sameCategory;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{I.swap} Substitute Item</div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProductImg id={item.id} size={40} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Original item</div>
          </div>
        </div>
        <div className="fg">
          <label className="fl">Replace with</label>
          <div className="searchbar">
            {I.search}
            <input placeholder="Search substitute..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(i => (
              <div key={i.id} className="inv" style={{ cursor: 'pointer', borderColor: selected?.id === i.id ? 'var(--accent-green)' : undefined }} onClick={() => setSelected(i)}>
                <ProductImg id={i.id} size={40} />
                <div className="inv-body">
                  <div className="inv-name">{i.name}</div>
                  <div className="inv-meta"><span className="cat-chip">{i.category}</span></div>
                </div>
                <div className="inv-price">${i.price.toFixed(2)}</div>
                {selected?.id === i.id && <span style={{ color: 'var(--accent-green)' }}>{I.check}</span>}
              </div>
            ))}
          </div>
        </div>
        <button className="submit-btn" disabled={!selected} onClick={() => onConfirm(selected)} style={{ background: selected ? 'linear-gradient(135deg, var(--accent-green), #34D399)' : undefined }}>
          Confirm Substitution
        </button>
      </div>
    </div>
  );
}

// ── Dasher Log Modal ────────────────────────────────────────────────
function DasherLogModal({ order, onClose, onAddNote }) {
  const [note, setNote] = useState("");
  const logs = order.dasherLog || [];
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{I.msg} Dasher Notes — #{order.id.toUpperCase().slice(0, 6)}</div>

        <div className="dasher-bar" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0, marginBottom: 14 }}>
          <a className="dasher-btn call" href={`tel:${order.dasherPhone || '5551234567'}`}>
            {I.phone} Call Dasher
          </a>
          <a className="dasher-btn text" href={`sms:${order.dasherPhone || '5551234567'}`}>
            {I.msg} Text Dasher
          </a>
        </div>

        {logs.length === 0 && <div className="empty" style={{ padding: '20px 0' }}><div className="empty-text">No notes yet. Add a note below.</div></div>}
        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <div className="log-time">{fmtTime(log.time)}</div>
            <div className="log-text">{log.text}</div>
          </div>
        ))}

        <div className="fg" style={{ marginTop: 14 }}>
          <label className="fl">Add Note</label>
          <textarea className="fi fi-area" placeholder="e.g. Dasher arrived early, item handed off..." value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <button className="submit-btn" disabled={!note.trim()} onClick={() => { onAddNote(note); setNote(""); }}>
          Save Note
        </button>
      </div>
    </div>
  );
}

// ── Edit Inventory Item Modal ───────────────────────────────────────
function EditItemModal({ item, onClose, onSave }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [category, setCategory] = useState(item.category);
  const [imageUrl, setImageUrl] = useState(PRODUCT_IMAGES[item.id] || "");

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{I.edit} Edit Item</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 24 }}>📦</div>
          )}
        </div>
        <div className="fg">
          <label className="fl">Name</label>
          <input className="fi" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="fg">
            <label className="fl">Price</label>
            <input className="fi" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Category</label>
            <select className="fi" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="fl">Image URL</label>
          <input className="fi" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        </div>
        <button className="submit-btn" onClick={() => onSave({ name, price: parseFloat(price) || item.price, category, imageUrl })}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ── Order Card V2 ───────────────────────────────────────────────────
function OrderCard({ order, onAdvance, onSubstitute, onMarkUnavail, onRestoreItem, onOpenDasherLog, onAddItemToOrder }) {
  const mins = minsAgo(order.createdAt);
  const isUrg = order.status === "new" && mins > 10;
  const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  return (
    <div className="ocard">
      <div className="ocard-hdr">
        <div>
          <div className="oid">#{order.id.toUpperCase().slice(0, 8)}</div>
          <div className={`otime ${isUrg ? 'urg' : ''}`}>{I.clock} {mins}m ago — {fmtTime(order.createdAt)}</div>
        </div>
        <div className="badge" style={{ background: STATUS_COLORS[order.status] + '18', color: STATUS_COLORS[order.status] }}>
          <span className="badge-dot" style={{ background: STATUS_COLORS[order.status] }} />
          {STATUS_LABELS[order.status]}
        </div>
      </div>

      <div>
        {order.items.map((item, i) => (
          <div key={i} className="oitem-row">
            <ProductImg id={item.substitutedWith ? item.substitutedWith.id : item.id} />
            <div className="oitem-info">
              <div className="oitem-name" style={item.unavailable ? { textDecoration: 'line-through', opacity: 0.5 } : {}}>
                {item.qty}x {item.name}
              </div>
              {item.substitutedWith && (
                <div className="oitem-sub">{I.swap} → {item.substitutedWith.name}</div>
              )}
              {item.unavailable && !item.substitutedWith && (
                <div className="oitem-unavail">{I.alert} Unavailable — customer notified</div>
              )}
            </div>
            {/* Available item: show substitute + unavailable buttons */}
            {!item.unavailable && !item.substitutedWith && order.status !== 'completed' && (
              <div className="oitem-actions">
                <button className="oitem-btn sub" title="Substitute" onClick={() => onSubstitute(order.id, i)}>
                  {I.swap}
                </button>
                <button className="oitem-btn unavail" title="Mark Unavailable" onClick={() => onMarkUnavail(order.id, i)}>
                  {I.x}
                </button>
              </div>
            )}
            {/* Unavailable item: show restore button */}
            {item.unavailable && !item.substitutedWith && order.status !== 'completed' && (
              <div className="oitem-actions">
                <button className="oitem-btn restore" title="Restore — Found it!" onClick={() => onRestoreItem(order.id, i)}>
                  {I.undo}
                </button>
                <button className="oitem-btn sub" title="Substitute Instead" onClick={() => onSubstitute(order.id, i)}>
                  {I.swap}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Item to Order */}
      {order.status !== 'completed' && (
        <div className="add-item-bar">
          <button className="add-item-btn" onClick={() => onAddItemToOrder(order.id)}>
            {I.addItem} Add Item to Order
          </button>
        </div>
      )}

      <div className="ofoot">
        <div className="ototal">${order.total.toFixed(2)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {next && (
            <button className="btn btn-p" onClick={() => onAdvance(order.id)}>
              {next === 'completed' ? I.check : I.arrow} {STATUS_LABELS[next]}
            </button>
          )}
        </div>
      </div>

      {/* Dasher Communication Bar */}
      <div className="dasher-bar">
        <a className="dasher-btn call" href={`tel:${order.dasherPhone || '5551234567'}`}>{I.phone} Call</a>
        <a className="dasher-btn text" href={`sms:${order.dasherPhone || '5551234567'}`}>{I.msg} Text</a>
        <button className="dasher-btn log" onClick={() => onOpenDasherLog(order.id)}>
          {I.msg} Notes {order.dasherLog?.length ? `(${order.dasherLog.length})` : ''}
        </button>
      </div>
    </div>
  );
}

// ── New Order Modal ─────────────────────────────────────────────────
function NewOrderModal({ onClose, onSubmit, inventory }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [custName, setCustName] = useState("");
  const [dasherPhone, setDasherPhone] = useState("");
  const filtered = inventory.filter(i => i.inStock && i.name.toLowerCase().includes(search.toLowerCase()));
  const addItem = (item) => {
    const ex = items.find(i => i.id === item.id);
    if (ex) setItems(items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    else setItems([...items, { id: item.id, name: item.name, price: item.price, qty: 1 }]);
    setSearch("");
  };
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">New Order</div>
        <div className="fg">
          <label className="fl">Customer Name</label>
          <input className="fi" placeholder="DoorDash Customer" value={custName} onChange={e => setCustName(e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Dasher Phone (optional)</label>
          <input className="fi" type="tel" placeholder="555-123-4567" value={dasherPhone} onChange={e => setDasherPhone(e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Add Items</label>
          <div className="searchbar">{I.search}<input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {search && <div style={{ maxHeight: 150, overflowY: 'auto' }}>{filtered.map(i => (
            <div key={i.id} className="inv" style={{ cursor: 'pointer' }} onClick={() => addItem(i)}>
              <ProductImg id={i.id} size={36} />
              <div className="inv-body"><div className="inv-name">{i.name}</div></div>
              <div className="inv-price">${i.price.toFixed(2)}</div>
            </div>
          ))}</div>}
          {items.length > 0 && <div className="item-chips">{items.map(i => (
            <div key={i.id} className="item-chip">{i.qty}x {i.name}<span className="item-chip-x" onClick={() => setItems(items.filter(x => x.id !== i.id))}>{I.x}</span></div>
          ))}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="fl" style={{ margin: 0 }}>Total</span>
          <span className="ototal">${total.toFixed(2)}</span>
        </div>
        <button className="submit-btn" disabled={items.length === 0} onClick={() => onSubmit({ customerName: custName || 'DoorDash Customer', items, total, dasherPhone })}>
          Create Order
        </button>
      </div>
    </div>
  );
}

// ── Add Item to Existing Order Modal ─────────────────────────────────
function AddItemToOrderModal({ orderId, inventory, onClose, onAdd }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const filtered = search ? inventory.filter(i => i.inStock && i.name.toLowerCase().includes(search.toLowerCase())) : [];
  const addItem = (item) => {
    const ex = items.find(i => i.id === item.id);
    if (ex) setItems(items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    else setItems([...items, { id: item.id, name: item.name, price: item.price, qty: 1 }]);
    setSearch("");
  };
  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{I.addItem} Add Items to Order</div>
        <div className="fg">
          <label className="fl">Search Items</label>
          <div className="searchbar">
            {I.search}
            <input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          {search && (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No matching items in stock</div>}
              {filtered.map(i => (
                <div key={i.id} className="inv" style={{ cursor: 'pointer' }} onClick={() => addItem(i)}>
                  <ProductImg id={i.id} size={36} />
                  <div className="inv-body"><div className="inv-name">{i.name}</div><div className="inv-meta"><span className="cat-chip">{i.category}</span></div></div>
                  <div className="inv-price">${i.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <>
              <label className="fl" style={{ marginTop: 12 }}>Items to Add</label>
              <div className="item-chips">
                {items.map(i => (
                  <div key={i.id} className="item-chip">
                    {i.qty}x {i.name} (${(i.price * i.qty).toFixed(2)})
                    <span className="item-chip-x" onClick={() => removeItem(i.id)}>{I.x}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="fl" style={{ margin: 0 }}>Adding</span>
          <span className="ototal">+${total.toFixed(2)}</span>
        </div>
        <button className="submit-btn" disabled={items.length === 0} onClick={() => onAdd(items)} style={{ background: items.length > 0 ? 'linear-gradient(135deg, var(--accent-green), #34D399)' : undefined }}>
          Add {items.length} Item{items.length !== 1 ? 's' : ''} to Order
        </button>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = usePersist("orders2", []);
  const [inventory, setInventory] = usePersist("inventory2", SAMPLE_ITEMS);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [invCat, setInvCat] = useState("All");
  const [notifs, setNotifs] = useState(0);
  const [subModal, setSubModal] = useState(null); // { orderId, itemIdx }
  const [dasherLogModal, setDasherLogModal] = useState(null); // orderId
  const [editItem, setEditItem] = useState(null); // item
  const [addItemOrderId, setAddItemOrderId] = useState(null); // orderId for add-item modal
  const [alerts, setAlerts] = useState([]);
  const [toast, setToast] = useState("");

  // Seed demo
  useEffect(() => {
    if (orders.length === 0) {
      setOrders([
        { id: genId(), customerName: "DoorDash #4821", dasherPhone: "5551234567", items: [{ id: 6, name: "Red Bull 12oz", price: 3.49, qty: 2 }, { id: 5, name: "Doritos Nacho", price: 2.29, qty: 1 }], total: 9.27, status: "new", createdAt: new Date(Date.now() - 3 * 60000).toISOString(), dasherLog: [] },
        { id: genId(), customerName: "DoorDash #4819", dasherPhone: "5559876543", items: [{ id: 2, name: "Slurpee Medium", price: 2.19, qty: 2 }, { id: 3, name: "Hot Dog Roller", price: 2.49, qty: 1 }, { id: 10, name: "Cookie 2-Pack", price: 1.99, qty: 1 }], total: 8.86, status: "preparing", createdAt: new Date(Date.now() - 12 * 60000).toISOString(), dasherLog: [{ time: new Date(Date.now() - 5 * 60000).toISOString(), text: "Dasher en route, ETA 8 min" }] },
        { id: genId(), customerName: "DoorDash #4815", dasherPhone: "5555551234", items: [{ id: 7, name: "Monster Energy", price: 3.29, qty: 3 }], total: 9.87, status: "ready", createdAt: new Date(Date.now() - 22 * 60000).toISOString(), dasherLog: [] },
        { id: genId(), customerName: "DoorDash #4810", dasherPhone: "5550001111", items: [{ id: 9, name: "Pizza Slice", price: 3.49, qty: 2 }, { id: 1, name: "Big Gulp 32oz", price: 1.89, qty: 1 }], total: 8.87, status: "completed", createdAt: new Date(Date.now() - 45 * 60000).toISOString(), dasherLog: [] },
      ]);
      setNotifs(1);
    }
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const advanceOrder = (id) => setOrders(prev => prev.map(o => {
    if (o.id !== id) return o;
    const idx = STATUS_FLOW.indexOf(o.status);
    return idx < STATUS_FLOW.length - 1 ? { ...o, status: STATUS_FLOW[idx + 1] } : o;
  }));

  const createOrder = ({ customerName, items, total, dasherPhone }) => {
    setOrders(prev => [{ id: genId(), customerName, items, total, status: "new", createdAt: new Date().toISOString(), dasherPhone, dasherLog: [] }, ...prev]);
    setShowNewOrder(false);
    setNotifs(n => n + 1);
  };

  const toggleStock = (id) => setInventory(prev => prev.map(i => i.id === id ? { ...i, inStock: !i.inStock } : i));

  // Substitution
  const handleSubstitute = (orderId, itemIdx) => setSubModal({ orderId, itemIdx });

  const confirmSubstitute = (substitute) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== subModal.orderId) return o;
      const newItems = [...o.items];
      newItems[subModal.itemIdx] = { ...newItems[subModal.itemIdx], substitutedWith: { id: substitute.id, name: substitute.name, price: substitute.price } };
      const newTotal = newItems.reduce((s, i) => s + (i.substitutedWith?.price || i.price) * i.qty, 0);
      return { ...o, items: newItems, total: newTotal };
    }));
    setSubModal(null);
    showToast("Substitution saved!");
  };

  // Mark unavailable + generate alert
  const markUnavailable = (orderId, itemIdx) => {
    let itemName = "", custName = "";
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = [...o.items];
      newItems[itemIdx] = { ...newItems[itemIdx], unavailable: true };
      itemName = newItems[itemIdx].name;
      custName = o.customerName;
      return { ...o, items: newItems };
    }));
    const alertMsg = `Hi! This is 7-Eleven. Unfortunately, ${itemName} is currently out of stock for your order. We apologize for the inconvenience. Would you like us to substitute it with a similar item, or remove it from your order?`;
    setAlerts(prev => [...prev, { id: genId(), orderId, itemName, customerName: custName, message: alertMsg, time: new Date().toISOString() }]);
    showToast("Item marked unavailable");
  };

  // Restore unavailable item
  const restoreItem = (orderId, itemIdx) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = [...o.items];
      newItems[itemIdx] = { ...newItems[itemIdx], unavailable: false };
      const newTotal = newItems.reduce((s, i) => {
        if (i.unavailable) return s;
        return s + (i.substitutedWith?.price || i.price) * i.qty;
      }, 0);
      return { ...o, items: newItems, total: newTotal };
    }));
    // Remove related alert if it exists
    setAlerts(prev => prev.filter(a => a.orderId !== orderId));
    showToast("Item restored!");
  };

  // Add items to existing order
  const addItemsToOrder = (newItems) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== addItemOrderId) return o;
      const updatedItems = [...o.items];
      newItems.forEach(ni => {
        const existing = updatedItems.find(ei => ei.id === ni.id && !ei.unavailable && !ei.substitutedWith);
        if (existing) {
          existing.qty += ni.qty;
        } else {
          updatedItems.push({ id: ni.id, name: ni.name, price: ni.price, qty: ni.qty });
        }
      });
      const newTotal = updatedItems.reduce((s, i) => {
        if (i.unavailable) return s;
        return s + (i.substitutedWith?.price || i.price) * i.qty;
      }, 0);
      return { ...o, items: updatedItems, total: newTotal };
    }));
    setAddItemOrderId(null);
    showToast(`${newItems.length} item${newItems.length !== 1 ? 's' : ''} added!`);
  };

  // Dasher log
  const addDasherNote = (note) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== dasherLogModal) return o;
      return { ...o, dasherLog: [...(o.dasherLog || []), { time: new Date().toISOString(), text: note }] };
    }));
    showToast("Note saved!");
  };

  // Edit inventory item
  const saveItemEdit = (updates) => {
    setInventory(prev => prev.map(i => {
      if (i.id !== editItem.id) return i;
      const updated = { ...i, name: updates.name, price: updates.price, category: updates.category };
      if (updates.imageUrl) PRODUCT_IMAGES[i.id] = updates.imageUrl;
      return updated;
    }));
    setEditItem(null);
    showToast("Item updated!");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).then(() => showToast("Copied to clipboard!")).catch(() => showToast("Copy failed"));
  };

  // Derived data
  const active = orders.filter(o => o.status !== 'completed');
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const oos = inventory.filter(i => !i.inStock).length;
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const filtInv = inventory.filter(i => {
    const ms = i.name.toLowerCase().includes(invSearch.toLowerCase());
    const mc = invCat === 'All' || i.category === invCat;
    return ms && mc;
  });

  const subItem = subModal ? orders.find(o => o.id === subModal.orderId)?.items[subModal.itemIdx] : null;
  const dasherLogOrder = dasherLogModal ? orders.find(o => o.id === dasherLogModal) : null;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <Toast message={toast} />

        <header className="header">
          <div className="header-brand">
            <div className="header-logo">7E</div>
            <div>
              <div className="header-title">Dash Companion</div>
              <div className="header-sub">DoorDash Manager</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setNotifs(0)}>
              {I.bell}{notifs > 0 && <span className="notif-dot" />}
            </button>
            <button className="icon-btn" onClick={() => setShowNewOrder(true)}>{I.plus}</button>
          </div>
        </header>

        <main className="main">
          {/* ── Alerts ── */}
          {tab === 'orders' && alerts.map(a => (
            <div key={a.id} className="alert-banner">
              <span style={{ color: 'var(--accent-red)', flexShrink: 0 }}>{I.alert}</span>
              <div className="alert-text">
                <strong>{a.itemName}</strong> unavailable for {a.customerName}
              </div>
              <div className="alert-actions">
                <button className="alert-btn alert-copy" onClick={() => copyToClipboard(a.message)}>
                  {I.copy} Copy
                </button>
                <button className="alert-btn alert-dismiss" onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}>
                  {I.x}
                </button>
              </div>
            </div>
          ))}

          {/* ── Orders Tab ── */}
          {tab === 'orders' && <>
            <div className="stats">
              <div className="stat"><div className="stat-val c-a">{active.length}</div><div className="stat-lbl">Active</div></div>
              <div className="stat"><div className="stat-val c-g">${revenue.toFixed(0)}</div><div className="stat-lbl">Revenue</div></div>
              <div className="stat"><div className="stat-val c-y">{oos}</div><div className="stat-lbl">Out of Stock</div></div>
            </div>
            <div className="sec-hdr">
              <span className="sec-title">Orders</span>
              {active.length > 0 && <span className="sec-badge">{active.length} active</span>}
            </div>
            <div className="filters">
              {['all', ...STATUS_FLOW].map(s => (
                <button key={s} className={`chip ${statusFilter === s ? 'on' : ''}`} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No orders matching this filter.<br />Tap + to add a new order.</div></div>
            ) : filtered.map(o => (
              <OrderCard key={o.id} order={o} onAdvance={advanceOrder} onSubstitute={handleSubstitute} onMarkUnavail={markUnavailable} onRestoreItem={restoreItem} onOpenDasherLog={setDasherLogModal} onAddItemToOrder={setAddItemOrderId} />
            ))}
          </>}

          {/* ── Inventory Tab ── */}
          {tab === 'inventory' && <>
            <div className="sec-hdr">
              <span className="sec-title">Inventory</span>
              <span className="sec-badge">{oos} unavailable</span>
            </div>
            <div className="searchbar">{I.search}<input placeholder="Search items..." value={invSearch} onChange={e => setInvSearch(e.target.value)} /></div>
            <div className="filters">
              {['All', ...CATEGORIES].map(c => (
                <button key={c} className={`chip ${invCat === c ? 'on' : ''}`} onClick={() => setInvCat(c)}>{c}</button>
              ))}
            </div>
            {filtInv.map(item => (
              <div key={item.id} className="inv">
                <ProductImg id={item.id} size={48} />
                <div className="inv-body">
                  <div className="inv-name">{item.name}</div>
                  <div className="inv-meta"><span className="cat-chip">{item.category}</span><span>{item.ordersToday} orders today</span></div>
                </div>
                <div className="inv-right">
                  <div className="inv-price">${item.price.toFixed(2)}</div>
                  <button className="inv-edit-btn" onClick={() => setEditItem(item)}>{I.edit}</button>
                  <button className={`toggle ${item.inStock ? 'on' : ''}`} onClick={() => toggleStock(item.id)} />
                </div>
              </div>
            ))}
          </>}

          {/* ── Analytics Tab ── */}
          {tab === 'analytics' && <>
            <div className="stats">
              <div className="stat"><div className="stat-val c-a">{orders.length}</div><div className="stat-lbl">Total</div></div>
              <div className="stat"><div className="stat-val c-g">${revenue.toFixed(2)}</div><div className="stat-lbl">Revenue</div></div>
              <div className="stat"><div className="stat-val c-y">${orders.length > 0 ? (revenue / orders.length).toFixed(2) : '0'}</div><div className="stat-lbl">Avg Order</div></div>
            </div>
            <div className="chart-card">
              <div className="chart-title">{I.trending} Orders by Hour</div>
              <div className="bar-chart">
                {Array.from({ length: 12 }, (_, i) => i + 8).map(h => {
                  const count = orders.filter(o => new Date(o.createdAt).getHours() === h).length;
                  const max = Math.max(...Array.from({ length: 12 }, (_, i) => orders.filter(o => new Date(o.createdAt).getHours() === i + 8).length), 1);
                  return (
                    <div key={h} className="bar-col">
                      <div className="bar" style={{ height: `${(count / max) * 100}%`, background: count === max ? 'linear-gradient(180deg,var(--accent),#FF8F65)' : 'var(--bg-elevated)' }} />
                      <span className="bar-lbl">{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">{I.trending} Top Items Today</div>
              <div className="top-list">
                {[...inventory].sort((a, b) => b.ordersToday - a.ordersToday).slice(0, 5).map((item, i) => {
                  const max = [...inventory].sort((a, b) => b.ordersToday - a.ordersToday)[0]?.ordersToday || 1;
                  const colors = ['var(--accent)', 'var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-blue)', '#8B5CF6'];
                  const rc = ['gold', 'silver', 'bronze', '', ''];
                  return (
                    <div key={item.id} className="top-item">
                      <span className={`top-rank ${rc[i]}`}>{i + 1}</span>
                      <div className="top-bar-bg">
                        <div className="top-bar-fill" style={{ width: `${(item.ordersToday / max) * 100}%`, background: colors[i] }}>
                          <span className="top-bar-name">{item.name}</span>
                        </div>
                      </div>
                      <span className="top-bar-count">{item.ordersToday}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">{I.dollar} Revenue Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div className="stat-lbl">Completed</div><div className="stat-val c-g" style={{ fontSize: 20, marginTop: 4 }}>{orders.filter(o => o.status === 'completed').length}</div></div>
                <div><div className="stat-lbl">In Progress</div><div className="stat-val c-a" style={{ fontSize: 20, marginTop: 4 }}>{active.length}</div></div>
              </div>
            </div>
          </>}
        </main>

        {/* Nav */}
        <nav className="nav">
          {[{ k: 'orders', icon: I.orders, l: 'Orders' }, { k: 'inventory', icon: I.inventory, l: 'Inventory' }, { k: 'analytics', icon: I.analytics, l: 'Analytics' }].map(n => (
            <button key={n.k} className={`nav-btn ${tab === n.k ? 'on' : ''}`} onClick={() => setTab(n.k)}>
              {n.icon}<span className="nav-lbl">{n.l}</span><span className="nav-dot" />
            </button>
          ))}
        </nav>

        {/* Modals */}
        {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} onSubmit={createOrder} inventory={inventory} />}
        {subModal && subItem && <SubstituteModal item={subItem} inventory={inventory} onClose={() => setSubModal(null)} onConfirm={confirmSubstitute} />}
        {dasherLogModal && dasherLogOrder && <DasherLogModal order={dasherLogOrder} onClose={() => setDasherLogModal(null)} onAddNote={addDasherNote} />}
        {editItem && <EditItemModal item={editItem} onClose={() => setEditItem(null)} onSave={saveItemEdit} />}
        {addItemOrderId && <AddItemToOrderModal orderId={addItemOrderId} inventory={inventory} onClose={() => setAddItemOrderId(null)} onAdd={addItemsToOrder} />}
      </div>
    </>
  );
}
