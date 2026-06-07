// js/auth.js
import {auth} from './config.js';
import {S, setState, showToast} from './state.js';
import {userDoc} from './db.js';

export async function doRegister(e,p,n){setState({authLoading:true,authError:''});try{const c=await auth.createUserWithEmailAndPassword(e,p);await c.user.updateProfile({displayName:n});await userDoc('profile').set({name:n,email:e})}catch(e){const m={'auth/email-already-in-use':'Email ya registrado','auth/weak-password':'Mínimo 6 caracteres','auth/invalid-email':'Email inválido'};setState({authError:m[e.code]||e.message,authLoading:false})}}
export async function doLogin(e,p){setState({authLoading:true,authError:''});try{await auth.signInWithEmailAndPassword(e,p)}catch(e){const m={'auth/user-not-found':'No existe cuenta','auth/wrong-password':'Contraseña incorrecta','auth/invalid-email':'Email inválido','auth/invalid-credential':'Email o contraseña incorrectos'};setState({authError:m[e.code]||e.message,authLoading:false})}}
export async function doResetPassword(email){if(!email||!email.trim()){setState({authError:'Escribe tu email primero'});return}setState({authLoading:true,authError:''});try{await auth.sendPasswordResetEmail(email.trim());setState({authLoading:false,authError:''});showToast('Se envió un enlace de recuperación a '+email.trim())}catch(e){const m={'auth/user-not-found':'No existe cuenta con ese email','auth/invalid-email':'Email inválido'};setState({authError:m[e.code]||e.message,authLoading:false})}}
export function doLogout(){auth.signOut();Object.assign(S,{view:'library',library:[],texts:{},vocabulary:{},flashcards:{},cache:{},currentTextId:null,popup:null})}
