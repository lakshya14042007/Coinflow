import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loanAmountInput = document.getElementById("loanAmount");
const loanDaysInput = document.getElementById("loanDays");
const interestRateEl = document.getElementById("interestRate");
const totalPayableEl = document.getElementById("totalPayable");
const dueDateEl = document.getElementById("dueDate");
const takeLoanBtn = document.getElementById("takeLoanBtn");

let currentUser = null;
let calculatedInterest = 0;
let calculatedTotal = 0;
let calculatedDueDate = null;

document.body.style.display = "none";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = user;
  document.body.style.display = "block";

  await checkLoanExpiry(); // 🔥 auto check on login
});


// ============================
// INTEREST CALCULATION
// ============================

function calculateInterest(amount, days) {

  let base = 2;

  if (days <= 3) base += 1;
  else if (days <= 7) base += 2;
  else if (days <= 15) base += 3;
  else base += 5;

  if (amount <= 300) base += 1;
  else if (amount <= 700) base += 2;
  else if (amount <= 1500) base += 4;
  else base += 6;

  return base;
}

function updatePreview() {

  const amount = Number(loanAmountInput.value);
  const days = Number(loanDaysInput.value);

  if (!amount || !days) return;

  calculatedInterest = calculateInterest(amount, days);

  const interestValue = amount * (calculatedInterest / 100) * days;
  calculatedTotal = Math.round(amount + interestValue);

  const now = new Date();
  const msToAdd = days * 24 * 60 * 60 * 1000; // ✅ correct method
  calculatedDueDate = new Date(now.getTime() + msToAdd);

  interestRateEl.textContent = calculatedInterest + "% per day";
  totalPayableEl.textContent = calculatedTotal + " coins";
  dueDateEl.textContent = calculatedDueDate.toLocaleString();
}

loanAmountInput.addEventListener("input", updatePreview);
loanDaysInput.addEventListener("input", updatePreview);


// ============================
// TAKE LOAN
// ============================

takeLoanBtn.addEventListener("click", async () => {

  const amount = Number(loanAmountInput.value);
  const days = Number(loanDaysInput.value);

  if (!amount || !days) {
    alert("Enter valid amount & days");
    return;
  }

  try {

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();

    if (userData.loan && userData.loan.status === "active") {
      alert("You already have an active loan");
      return;
    }

    const currentBalance = Number(userData.totalCoins) || 0;

    await updateDoc(userRef, {
      totalCoins: currentBalance + amount,
      loan: {
        amount,
        days,
        interestRate: calculatedInterest,
        totalPayable: calculatedTotal,
        startDate: new Date(),
        dueDate: calculatedDueDate,
        status: "active"
      }
    });

    await addDoc(
      collection(db, "users", currentUser.uid, "transactions"),
      {
        type: "earn",
        amount,
        description: "Loan Taken",
        title: `${amount} loan taken`,
        createdAt: serverTimestamp()
      }
    );

    alert("Loan Approved 💰");
    window.location.reload();

  } catch (err) {
    console.error("Loan error:", err);
    alert("Something went wrong");
  }

});


// ============================
// 🔥 AUTO EXPIRY CHECK
// ============================

async function checkLoanExpiry() {

  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const loan = userData.loan;

  if (!loan || loan.status !== "active") return;

  const now = new Date();
  const due = loan.dueDate.toDate(); // Firestore timestamp

  if (now >= due) {

    const newBalance = (Number(userData.totalCoins) || 0) - loan.totalPayable;

    await updateDoc(userRef, {
      totalCoins: newBalance,
      "loan.status": "expired"
    });

    await addDoc(
      collection(db, "users", currentUser.uid, "transactions"),
      {
        type: "expense",
        amount: loan.totalPayable,
        description: "Loan Auto Deducted",
        title: "Loan Expired",
        createdAt: serverTimestamp()
      }
    );

    alert("Loan expired! Amount deducted automatically.");
  }
}
