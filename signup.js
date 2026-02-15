import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.querySelector("form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = form.querySelector('input[type="email"]').value;
  const password = form.querySelector('input[type="password"]').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});
