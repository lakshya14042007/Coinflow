import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyBe_Mx1CRtqUcwlbASejCLqHs27XofHCpQ",
  authDomain: "coinflow-12485.firebaseapp.com",
  projectId: "coinflow-12485",
  storageBucket: "coinflow-12485.firebasestorage.app",
  messagingSenderId: "572858402811",
  appId: "1:572858402811:web:24a29e5a126fa070216d5e",
  measurementId: "G-99EY235FGC"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

