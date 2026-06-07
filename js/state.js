// js/state.js
import {render} from './views.js';
import {savePrefs} from './db.js';

export let S={authView:'login',user:null,authError:'',authLoading:false,view:'library',library:[],texts:{},vocabulary:{},flashcards:{},cache:{},currentTextId:null,popup:null,translating:false,flashcardDeck:[],fcIndex:0,fcFlipped:false,searchTerm:'',vocabFilter:'all',vocabLangFilter:'all',editingNote:null,noteText:'',editingWord:null,wordText:'',editingTranslation:null,translationText:'',fcMode:'due',fcLangFilter:'all',confirmAction:null,toast:null,loading:true,darkMode:false,fontSize:17,showPasteModal:false,pasteText:'',pasteLang:'en',pasteTitle:'',streakHistory:[],showTagModal:null,tagInput:'',vocabGroupBy:'none',readingPositions:{},selectMode:false,addingDefFor:null,addingIrrFor:null};

export function setState(u){Object.assign(S,u);if(u.darkMode!==undefined){document.body.classList.toggle('dark',S.darkMode);savePrefs()}render()}
export function showToast(m,t='success'){S.toast={message:m,type:t};render();setTimeout(()=>{S.toast=null;render()},3000)}
