// Firebase configuration — BT Capacity App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, onSnapshot, writeBatch, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ STAGING CONFIGURATION - For testing only
// Switch back to production before merging to main
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

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
         doc, setDoc, getDoc, collection, getDocs, onSnapshot, writeBatch, query, where };
