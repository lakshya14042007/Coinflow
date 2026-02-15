import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    increment,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    let currentUser = null;

    const popup = document.getElementById("newtask");
    const openPopupBtn = document.getElementById("mainaddTaskBtn");
    const closePopupBtn = document.getElementById("closeBtn");
    const addBtn = document.getElementById("addTaskBtn");

    // =========================
    // 🔐 AUTH CHECK
    // =========================
    onAuthStateChanged(auth, async (user) => {

        if (user) {
            currentUser = user;

            // Ensure user document exists
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, { totalCoins: 0 });
            }

            listenForTasks(user.uid);

        } else {
            window.location.href = "login.html";
        }

    });

    // =========================
    // 🪟 POPUP OPEN
    // =========================
    if (openPopupBtn && popup) {
        openPopupBtn.addEventListener("click", () => {
            popup.style.display = "flex";
        });
    }

    // =========================
    // ❌ POPUP CLOSE
    // =========================
    if (closePopupBtn && popup) {
        closePopupBtn.addEventListener("click", () => {
            popup.style.display = "none";
        });
    }

    // =========================
    // 🔥 ADD TASK
    // =========================
    if (addBtn) {
        addBtn.addEventListener("click", async () => {

            if (!currentUser) {
                alert("User not ready yet");
                return;
            }

            const title = document.getElementById("taskTitle").value.trim();
            const details = document.getElementById("taskDetails").value.trim();
            const coins = document.getElementById("coinAmount").value;

            if (!title || !details || !coins) {
                alert("Please fill all fields");
                return;
            }

            try {

                await addDoc(
                    collection(db, "tasks", currentUser.uid, "userTasks"),
                    {
                        title,
                        details,
                        coins: Number(coins),
                        complete: false,
                        createdAt: new Date()
                    }
                );

                // Clear inputs
                document.getElementById("taskTitle").value = "";
                document.getElementById("taskDetails").value = "";
                document.getElementById("coinAmount").value = "";

                // Close popup
                popup.style.display = "none";

            } catch (error) {
                console.error("Add Task Error:", error);
                alert(error.message);
            }

        });
    }

    // =========================
    // 🚀 LIVE LISTENER
    // =========================
    function listenForTasks(userId) {

        const pendingContainer = document.getElementById("pendingTasks");
        const completedContainer = document.getElementById("completedTasks");

        onSnapshot(
            collection(db, "tasks", userId, "userTasks"),
            (snapshot) => {

                pendingContainer.innerHTML = "";
                completedContainer.innerHTML = "";

                snapshot.forEach((docSnap) => {

                    const task = docSnap.data();
                    const taskId = docSnap.id;

                    const card = createTaskCard(task, taskId);

                    if (task.complete) {
                        completedContainer.appendChild(card);
                    } else {
                        pendingContainer.appendChild(card);
                    }

                });

            } , (error) => {
      console.error("Snapshot error:", error);
  }
        );
    }

    // =========================
    // 🎨 CREATE TASK CARD
    // =========================
    function createTaskCard(task, taskId) {

        const div = document.createElement("div");

        div.className = task.complete
            ? "task-card completed-task"
            : "task-card";

        div.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
            </div>

            <p class="task-description">${task.details}</p>

            <div class="task-reward">
                <span>${task.coins} Coins</span>
            </div>

            <div class="task-footer">
                <span class="task-status ${task.complete ? "completed-status" : "pending-status"}">
                    ${task.complete ? "Completed" : "Pending"}
                </span>

                ${
                    !task.complete
                    ? `<button class="btn-complete">Complete Task</button>`
                    : ""
                }
            </div>
        `;

        const completeBtn = div.querySelector(".btn-complete");

       if (completeBtn) {
    completeBtn.addEventListener("click", async () => {
        const taskRef = doc(db, "tasks", currentUser.uid, "userTasks", taskId);
        const userRef = doc(db, "users", currentUser.uid);

        try {
            // Mark complete
            await updateDoc(taskRef, { complete: true });

            // Add coins safely
            await updateDoc(userRef, {
                totalCoins: increment(task.coins)
            });

            // ✅ Add transaction for history
            await addDoc(
                collection(db, "users", currentUser.uid, "transactions"),
                {
                    type: "earn",
                    title: task.title,
                    amount: task.coins,
                    timeInfo: "",
                    createdAt: new Date()
                }
            );

        } catch (error) {
            console.error("Complete Error:", error);
        }
    });
}


        return div;
    }

    // =========================
    // 🔄 TAB SWITCHING
    // =========================
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");

            const target = document.getElementById(tab.dataset.tab);

            if (target) {
                target.classList.add("active");
            }

        });

    });

});

