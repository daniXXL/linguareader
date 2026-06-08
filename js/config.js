// js/config.js
const firebaseConfig = {
  apiKey: "AIzaSyCZvqnmqwXspXvPVTqXPyAq-d0EXNORYz0",
  authDomain: "linguareader-7d9a3.firebaseapp.com",
  projectId: "linguareader-7d9a3",
  storageBucket: "linguareader-7d9a3.firebasestorage.app",
  messagingSenderId: "629931589943",
  appId: "1:629931589943:web:1836dc4eff63a8ab5c1ab2"
};
firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();
db.enablePersistence({synchronizeTabs:true}).catch(()=>{});

export const LANGS={en:"Inglés",pt:"Portugués",fr:"Francés",de:"Alemán"};
export const LANG_VOICE={en:"en-US",pt:"pt-BR",fr:"fr-FR",de:"de-DE"};
export const LEVELS={unknown:{label:"Desconocida",color:"#E8847C",bg:"#FDE8E5"},recognized:{label:"Reconozco",color:"#D4960A",bg:"#FEF3D1"},learned:{label:"Aprendida",color:"#4D8B52",bg:"#E2F0E3"}};
export const SM2Q={again:0,hard:2,good:3,easy:5},SM2L={again:"No la sé",hard:"Difícil",good:"Regular",easy:"Fácil"},SM2C={again:"#E8847C",hard:"#D4960A",good:"#5B9BD5",easy:"#4D8B52"};
// Umbral de "madurez" estilo Anki: una tarjeta con intervalo >= MATURE_DAYS días se marca "Aprendida".
export const MATURE_DAYS=21;

export const FP={en:["the","and","is","in","to","of","a","that","it","for","was","on","are","with"],pt:["de","que","e","o","a","do","da","em","um","para","é","com","não","uma"],fr:["de","la","le","et","les","des","en","un","une","du","est","que","qui","dans"],de:["der","die","und","in","den","von","zu","das","mit","sich","des","auf","für","ist"]};

// Icons
export const I={
bookMarked:`<svg style="width:24px;height:24px;stroke:var(--accent);fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/><polyline points="10 2 10 10 13 7 16 10 16 2"/></svg>`,
lib:`<svg style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
brain:`<svg style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M9.5 2A5.5 5.5 0 004 7.5c0 1.5.5 2.8 1.5 3.8L4 14l1.5 2L4 19l3 3 2-2.5L12 21l2.5-1.5L16 22l3-3-1.5-3L19 14l-1.5-2.7c1-.9 1.5-2.3 1.5-3.8A5.5 5.5 0 0014.5 2h-5z"/></svg>`,
chart:`<svg style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
up:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
x:`<svg style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
back:`<svg style="width:20px;height:20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
search:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
globe:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
trash:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
edit:`<svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
check:`<svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
file:`<svg style="width:48px;height:48px" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
redo:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>`,
load:`<svg style="width:16px;height:16px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>`,
grad:`<svg style="width:48px;height:48px" viewBox="0 0 24 24" fill="none" stroke="#4D8B52" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>`,
out:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
moon:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
sun:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
vol:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`,
dl:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
paste:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
cursor:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 8-6 2-4 6z"/></svg>`,
hand:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10V5a2 2 0 00-4 0v9l-1.8-1.8a2 2 0 00-2.8 2.8L7 21h10l3-8v-2a2 2 0 00-4 0v1"/></svg>`,
tag:`<svg style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
play:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
pause:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>`,
stop:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>`,
};

export const MAX_TEXT_BYTES=1000000; // ~1 MB; bajo el tope de 1.048.576 B por documento de Firestore
