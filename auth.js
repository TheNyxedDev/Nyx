// 1. YOUR PROJECT CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyA86k-osavaNRKxd8HP1J45E_QsC7YUW74",
  authDomain: "nyx-platform.firebaseapp.com",
  projectId: "nyx-platform",
  storageBucket: "nyx-platform.firebasestorage.app",
  messagingSenderId: "800094078742",
  appId: "1:800094078742:web:21220d722b0254a525b237",
  measurementId: "G-3P4YNM8RBS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. SIGNUP LOGIC
async function handleSignup() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (pass !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    // Replace 'YOUR_RECAPTCHA_SITE_KEY' with your actual key from Google reCAPTCHA
    grecaptcha.ready(function() {
        grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', {action: 'signup'}).then(async (token) => {
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
                const user = userCredential.user;

                // Save initial user data with "Free" plan
                await db.collection("users").doc(user.uid).set({
                    username: username,
                    email: email,
                    plan: "Free", 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Account created successfully!");
                window.location.href = "launcher.html"; 
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    });
}

// 3. LOGIN LOGIC
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = "launcher.html";
    } catch (error) {
        alert("Login Error: " + error.message);
    }
}

// 4. LOGOUT LOGIC
function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

// 5. SHARED SESSION & AUTO-LOGIN
// This runs automatically on every page to check if the user is already logged in
auth.onAuthStateChanged(async (user) => {
    const currentPath = window.location.pathname;
    
    if (user) {
        // Fetch user data from Firestore
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Auto-fill UI elements if they exist on the page
            if(document.getElementById('user-name-display')) {
                document.getElementById('user-name-display').innerText = userData.username;
            }
            if(document.getElementById('user-plan-display')) {
                document.getElementById('user-plan-display').innerText = userData.plan;
            }
        }
    } else {
        // If logged out and not on the login page, redirect back to home
        if (!currentPath.endsWith("index.html") && currentPath !== "/Nyx/") {
            window.location.href = "https://thenyxeddev.github.io/Nyx/index.html";
        }
    }
});

// 6. CLOAKED IFRAME OPENER (about:blank)
// Use this to launch your games/apps
function launchCloaked(url) {
    const win = window.open('about:blank', '_blank');
    if (!win) {
        alert("Please disable popup blockers!");
        return;
    }
    
    win.document.body.style.margin = '0';
    win.document.body.style.height = '100vh';
    
    const iframe = win.document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.src = url;
    
    win.document.body.appendChild(iframe);
}
