// Firebase configuration — BT Capacity App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, onSnapshot, writeBatch, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ PRODUCTION CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyBltWXJaPOnbQXd2FdqHvGtqiS_RHrXQLY",
  authDomain: "bt-capacity.firebaseapp.com",
  projectId: "bt-capacity",
  storageBucket: "bt-capacity.firebasestorage.app",
  messagingSenderId: "940597797288",
  appId: "1:940597797288:web:0280d731491aaa6b273d9d"
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
