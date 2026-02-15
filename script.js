import { auth, db } from "./firebase.js";
import { 
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; // ✅ Add this

const totalBalanceEl = document.getElementById("totalBalance");
const totalEarnedEl = document.getElementById("totalEarned");
const totalSpentEl = document.getElementById("totalSpent");
const pendingTasksEl = document.getElementById("pendingTasks");
const completedTasksEl = document.getElementById("completedTasks");

let currentUser = null;

// Hide UI until auth verified
document.body.style.display = "none";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = user;
  document.body.style.display = "block";

  // Load wallet balance
  await loadWalletBalance();

  // Load stats
  listenTransactions();
  listenTasks();
});

// Load wallet balance
async function loadWalletBalance() {
  try {
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const totalCoins = Number(userSnap.data().totalCoins) || 0;
      totalBalanceEl.textContent = totalCoins;
    } else {
      totalBalanceEl.textContent = 0;
    }
  } catch (err) {
    console.error("Error loading balance:", err);
    totalBalanceEl.textContent = 0;
  }
}

// Listen to transactions for Total Earned & Total Spent
function listenTransactions() {
  const q = query(
    collection(db, "users", currentUser.uid, "transactions"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    let earned = 0;
    let spent = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const type = data.type || "spend";
      const amount = Number(data.amount) || 0;

      if (type === "earn") earned += amount;
      else spent += amount;
    });

    totalEarnedEl.textContent = earned;
    totalSpentEl.textContent = spent;
  }, (err) => console.error("Transactions snapshot error:", err));
}

// Listen to tasks for Pending & Completed
function listenTasks() {
  const q = collection(db, "tasks", currentUser.uid, "userTasks");

  onSnapshot(q, (snapshot) => {
    let pending = 0;
    let completed = 0;

    snapshot.forEach(docSnap => {
      const task = docSnap.data();
      if (task.complete) completed++;
      else pending++;
    });

    pendingTasksEl.textContent = pending;
    completedTasksEl.textContent = completed;
  }, (err) => console.error("Tasks snapshot error:", err));
}
