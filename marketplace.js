import { db, auth } from "./firebase.js";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  addDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const productsGrid = document.getElementById("productsGrid");
const balanceElement = document.getElementById("userBalance");

let currentUser;
let userBalance = 0;


// 🔐 Check Auth
document.body.style.display = "none"; // page hide until auth confirmed

onAuthStateChanged(auth, async (user) => {

  if (user) {
    currentUser = user;

    document.body.style.display = "block"; // show page

    await loadUserBalance();
    await loadProducts();

  } else {
    window.location.replace("login.html");
  }

});



// 💰 Load User Balance
async function loadUserBalance() {
  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    userBalance = userSnap.data().totalCoins || 0;
    balanceElement.textContent = userBalance;
  }
}


// 🛒 Load Products
async function loadProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));

  productsGrid.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const product = docSnap.data();
    const productId = docSnap.id;

    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="product-image" 
           style="display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;background:linear-gradient(135deg,#e0e7ff,#c7d2fe);">
           ${product.title}
      </div>

      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>

        <div class="product-footer">
          <div class="product-price">
            <span>${product.price}</span>
          </div>

          <button class="btn-redeem">
            Redeem
          </button>
        </div>
      </div>
    `;

    const button = card.querySelector(".btn-redeem");

    button.addEventListener("click", () => {
      redeemProduct(productId, product.price, product.title);
    });

    productsGrid.appendChild(card);
  });
}


// 🎯 Redeem Logic
async function redeemProduct(productId, price, title) {

  if (userBalance < price) {
    alert("Not enough balance!");
    return;
  }

  const userRef = doc(db, "users", currentUser.uid);

  // 1️⃣ Deduct coins
  userBalance -= price;

  await updateDoc(userRef, {
    totalCoins: userBalance
  });

  // 2️⃣ Add transaction for history
  await addDoc(
    collection(db, "users", currentUser.uid, "transactions"),
    {
      type: "spend",
      title: title,
      amount: price,
      timeInfo: "Marketplace Purchase",
      createdAt: new Date()
    }
  );

  balanceElement.textContent = userBalance;

  showPopup(`${title} Purchased Successfully!`);
}


// 🎉 Simple Popup
function showPopup(message) {

  const popup = document.createElement("div");
  popup.textContent = message;

  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.right = "20px";
  popup.style.background = "#10b981";
  popup.style.color = "white";
  popup.style.padding = "12px 20px";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
  popup.style.zIndex = "9999";

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3000);
}
