import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// admin.js
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Check user authentication
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // User not logged in → redirect to login page
    window.location.href = "login.html";
  } else {
    // User is logged in → continue loading admin page
    console.log("Admin page loaded for:", user.email);
  }
});



const productForm = document.getElementById("productForm");
const titleInput = document.getElementById("titleInput");
const episodeTimeInput = document.getElementById("episodeTimeInput");
const priceInput = document.getElementById("priceInput");
const addProductBtn = document.getElementById("addProductBtn");
const successMessage = document.getElementById("successMessage");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const episodeTime = episodeTimeInput.value.trim();
  const price = priceInput.value.trim();

  if (!title || !episodeTime || !price) {
    showError("Please fill all fields.");
    return;
  }

  try {
    setLoading(true);

    await addDoc(collection(db, "products"), {
      title: title,
      episodeTime: episodeTime,
      price: Number(price),
      createdAt: serverTimestamp()
    });

    showSuccess();
    productForm.reset();

  } catch (error) {
    console.error(error);
    showError("Failed to add product.");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  if (isLoading) {
    addProductBtn.classList.add("loading");
    addProductBtn.disabled = true;
  } else {
    addProductBtn.classList.remove("loading");
    addProductBtn.disabled = false;
  }
}

function showSuccess() {
  successMessage.classList.add("show");
  errorMessage.classList.remove("show");

  setTimeout(() => {
    successMessage.classList.remove("show");
  }, 3000);
}

function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.add("show");
  successMessage.classList.remove("show");
}
