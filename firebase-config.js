// Firebase configuration — BT Capacity App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, onSnapshot, writeBatch, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ STAGING CONFIGURATION - Testing multi-year app
// Will switch to production (bt-capacity) after validation
const firebaseConfig = {
  apiKey: "AIzaSyD412iPDdJ9DfSyfJtiVXK_ndQg2CpOVW0",
  authDomain: "bt-capacity-staging.firebaseapp.com",
  projectId: "bt-capacity-staging",
  storageBucket: "bt-capacity-staging.firebasestorage.app",
  messagingSenderId: "981104614191",
  appId: "1:981104614191:web:074a4f845d714d77989fda"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Función para verificar modo de validación
export async function getValidationMode() {
  try {
    const validationDoc = await getDoc(doc(db, 'settings', 'validation'));
    return validationDoc.exists() ? validationDoc.data().isValidating : false;
  } catch(e) {
    console.warn('Error leyendo modo validación:', e);
    return false;
  }
}

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
         doc, setDoc, getDoc, collection, getDocs, onSnapshot, writeBatch, query, where };
