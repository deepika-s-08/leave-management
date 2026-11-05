let userId = null;

// Show a message
function showMessage(elementId, message) {
    document.getElementById(elementId).innerText = message;
}

// Show registration form
function showRegistrationForm() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("registration-section").style.display = "block";
}

// Show login form
function showLoginForm() {
    document.getElementById("registration-section").style.display = "none";
    document.getElementById("login-section").style.display = "block";
}

// User registration
async function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("reg-email").value.trim();

    // Correct registration password ID
    const password = document.getElementById("reg-password").value;

    const rollNumber = document.getElementById("roll-number").value.trim();
    const casualLeave = Number(document.getElementById("casual-leave").value);
    const medicalLeave = Number(document.getElementById("medical-leave").value);

    if (!username || !email || !password.trim() || !rollNumber) {
        showMessage(
            "registration-response",
            "Please fill in all required fields."
        );
        return;
    }

    if (password.length < 6) {
        showMessage(
            "registration-response",
            "Password must be at least 6 characters long."
        );
        return;
    }

    const registerButton = document.querySelector(
        '#registration-form button[type="submit"]'
    );

    registerButton.disabled = true;
    registerButton.innerText = "Registering...";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password,
                rollNumber,
                casualLeave,
                medicalLeave
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(
                "registration-response",
                data.message || "Registration failed."
            );
            return;
        }

        showMessage(
            "registration-response",
            "Registration successful! Please log in."
        );

        document.getElementById("registration-form").reset();
        document.getElementById("email").value = email;

        showLoginForm();

    } catch (error) {
        console.error("Registration error:", error);

        showMessage(
            "registration-response",
            "Cannot connect to server. Check the server and try again."
        );

    } finally {
        registerButton.disabled = false;
        registerButton.innerText = "Register";
    }
}

// User login
async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    // Correct login password ID
    const password = document.getElementById("password").value;

    if (!email || !password.trim()) {
        showMessage(
            "response-message",
            "Please enter both email and password."
        );
        return;
    }

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(
                "response-message",
                data.message || "Login failed."
            );
            return;
        }

        userId = data.userId;

        document.getElementById("username-display").innerText =
            data.username || "";

        document.getElementById("roll-number-display").innerText =
            data.rollNumber || "";

        document.getElementById("casual-leave-display").innerText =
            data.casualLeave ?? 0;

        document.getElementById("medical-leave-display").innerText =
            data.medicalLeave ?? 0;

        document.getElementById("login-section").style.display = "none";
        document.getElementById("registration-section").style.display = "none";
        document.getElementById("balance-section").style.display = "block";
        document.getElementById("apply-leave-section").style.display = "block";
        document.getElementById("logout-button").style.display = "inline-block";

        showMessage(
            "response-message",
            data.message || "Login successful."
        );

    } catch (error) {
        console.error("Login error:", error);

        showMessage(
            "response-message",
            "Cannot connect to server. Check the server and try again."
        );
    }
}

// User logout
function logoutUser() {
    userId = null;

    document.getElementById("balance-section").style.display = "none";
    document.getElementById("apply-leave-section").style.display = "none";
    document.getElementById("logout-button").style.display = "none";
    document.getElementById("login-section").style.display = "block";
    document.getElementById("registration-section").style.display = "none";

    document.getElementById("login-form").reset();
    document.getElementById("leave-form").reset();

    document.getElementById("username-display").innerText = "";
    document.getElementById("roll-number-display").innerText = "";
    document.getElementById("casual-leave-display").innerText = "0";
    document.getElementById("medical-leave-display").innerText = "0";

    showMessage("response-message", "");
}

// Refresh leave balance
async function refreshLeaveBalance() {
    if (!userId) {
        showMessage("response-message", "Please log in first.");
        return;
    }

    try {
        const response = await fetch(`/api/leave-balance/${userId}`);
        const data = await response.json();

        if (!response.ok) {
            showMessage(
                "response-message",
                data.message || "Could not get balance."
            );
            return;
        }

        document.getElementById("casual-leave-display").innerText =
            data.casualLeave;

        document.getElementById("medical-leave-display").innerText =
            data.medicalLeave;

        showMessage("response-message", "Leave balance refreshed.");

    } catch (error) {
        console.error("Balance error:", error);

        showMessage(
            "response-message",
            "Cannot connect to server."
        );
    }
}

// Apply for leave
async function applyLeave(event) {
    event.preventDefault();

    if (!userId) {
        showMessage("response-message", "Please log in first.");
        return;
    }

    const type = document.getElementById("leave-type").value;
    const days = Number(document.getElementById("leave-days").value);

    if (!Number.isInteger(days) || days <= 0) {
        showMessage(
            "response-message",
            "Enter a valid positive number of days."
        );
        return;
    }

    try {
        const response = await fetch(`/api/apply-leave/${userId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type,
                days
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(
                "response-message",
                data.message || "Leave application failed."
            );
            return;
        }

        document.getElementById("casual-leave-display").innerText =
            data.casualLeave;

        document.getElementById("medical-leave-display").innerText =
            data.medicalLeave;

        showMessage(
            "response-message",
            data.message || "Leave application successful."
        );

        document.getElementById("leave-form").reset();

    } catch (error) {
        console.error("Leave application error:", error);

        showMessage(
            "response-message",
            "Cannot connect to server."
        );
    }
}

// Set up event listeners
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("registration-form")
        .addEventListener("submit", registerUser);

    document.getElementById("login-form")
        .addEventListener("submit", loginUser);

    document.getElementById("show-registration")
        .addEventListener("click", showRegistrationForm);

    document.getElementById("show-login")
        .addEventListener("click", showLoginForm);

    document.getElementById("refresh-balance")
        .addEventListener("click", refreshLeaveBalance);

    document.getElementById("logout-button")
        .addEventListener("click", logoutUser);

    document.getElementById("leave-form")
        .addEventListener("submit", applyLeave);
});
