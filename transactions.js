import { auth, db } from "./firebase.js";

import {
    collection,
    onSnapshot,
    query,
    orderBy,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const transactionList = document.getElementById("transactionList");
const totalBalanceEl = document.getElementById("totalBalance");
const emptyState = document.getElementById("emptyState");

let unsubscribe = null;
let currentUser = null;

// hide page until auth check
document.body.style.display = "none";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    currentUser = user;
    document.body.style.display = "block";

    // ✅ Load user total balance from user document
    await loadUserBalance();

    // 🔁 Remove old listener if exists
    if (unsubscribe) unsubscribe();

    const q = query(
        collection(db, "users", user.uid, "transactions"),
        orderBy("createdAt", "desc")
    );

    // ✅ Real-time listener for transaction history
    unsubscribe = onSnapshot(q, (snapshot) => {

        transactionList.innerHTML = "";
        if (snapshot.empty) {
            emptyState.classList.remove("d-none");
            return;
        }

        emptyState.classList.add("d-none");

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const type = data.type || "spend"; // earn or spend
            const title = data.title || "Untitled";
            const amount = Number(data.amount) || 0;
            const timeInfo = data.timeInfo || "";
            const date = data.createdAt
                ? data.createdAt.toDate().toLocaleString()
                : "N/A";

            // Create row
            const row = document.createElement("div");
            row.classList.add("transaction-row");

            row.innerHTML = `
                <div class="td-type">
                    <span class="type-badge ${type}">
                        ${type === "earn" ? "Earn" : "Spend"}
                    </span>
                </div>

                <div class="td-details">
                    ${
                        type === "spend"
                            ? `${title}${timeInfo ? " - " + timeInfo : ""}`
                            : `Completed: ${title}`
                    }
                </div>

                <div class="td-amount ${type === "earn" ? "earn-amount" : "spend-amount"}">
                    ${type === "earn" ? "+" : "-"}${amount}
                </div>

                <div class="td-date">
                    ${date}
                </div>
            `;

            transactionList.appendChild(row);
        });

    }, (error) => {
        console.error("Transaction listener error:", error);
    });

});

// 🔥 Load total balance from user document
async function loadUserBalance() {
    try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const totalCoins = Number(userSnap.data().totalCoins) || 0;
            totalBalanceEl.textContent = totalCoins;
        } else {
            totalBalanceEl.textContent = "0";
        }
    } catch (err) {
        console.error("Failed to load user balance:", err);
        totalBalanceEl.textContent = "0";
    }
}
