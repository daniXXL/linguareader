// js/db.js
import {auth, db} from './config.js';
import {S} from './state.js';

export function userDoc(p){return db.collection('users').doc(auth.currentUser.uid).collection('data').doc(p)}
export function textsCol(){return db.collection('users').doc(auth.currentUser.uid).collection('texts')}
let saveT={};
export function dbSave(k,d,merge){clearTimeout(saveT[k]);saveT[k]=setTimeout(()=>{userDoc(k).set(d,merge?{merge:true}:{}).catch(e=>console.error('DB:',e))},500)}
export function saveLib(){dbSave('library',{items:S.library})}
export function saveVoc(){dbSave('vocabulary',{entries:S.vocabulary},false)}
export function saveFc(){dbSave('flashcards',{entries:S.flashcards},false)}
export function saveCa(){dbSave('cache',{entries:S.cache},true)}
export function savePrefs(){dbSave('prefs',{darkMode:S.darkMode,fontSize:S.fontSize},true)}
export function saveStreak(){dbSave('streak',{history:S.streakHistory},true)}
export function savePositions(){dbSave('positions',{entries:S.readingPositions},true)}
export async function saveTxt(id,text){await textsCol().doc(id).set({content:text})}
export async function delTxt(id){await textsCol().doc(id).delete().catch(()=>{})}

export async function loadAll(){try{const[lib,voc,fc,ca,prefs,strk,pos]=await Promise.all([userDoc('library').get(),userDoc('vocabulary').get(),userDoc('flashcards').get(),userDoc('cache').get(),userDoc('prefs').get(),userDoc('streak').get(),userDoc('positions').get()]);
S.library=lib.exists?lib.data().items||[]:[];S.vocabulary=voc.exists?voc.data().entries||{}:{};S.flashcards=fc.exists?fc.data().entries||{}:{};S.cache=ca.exists?ca.data().entries||{}:{};
if(prefs.exists){S.darkMode=prefs.data().darkMode||false;S.fontSize=prefs.data().fontSize||17}
if(strk.exists)S.streakHistory=strk.data().history||[];
if(pos.exists)S.readingPositions=pos.data().entries||{};
S.texts={};const ts=await textsCol().get();ts.forEach(d=>{S.texts[d.id]=d.data().content});
const b=S.library.length;S.library=S.library.filter(i=>S.texts[i.id]);if(S.library.length<b)saveLib()}catch(e){console.error('Load:',e)}}
