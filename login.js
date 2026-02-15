import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById("loginForm");

// Already logged in → redirect
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});

// Form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});
