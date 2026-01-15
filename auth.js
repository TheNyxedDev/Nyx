// 1. YOUR PROJECT CONFIGURATION (Realtime Database Version)
const firebaseConfig = {
  apiKey: "AIzaSyA86k-osavaNRKxd8HP1J45E_QsC7YUW74",
  authDomain: "nyx-platform.firebaseapp.com",
  databaseURL: "https://nyx-platform-default-rtdb.firebaseio.com", 
  projectId: "nyx-platform",
  storageBucket: "nyx-platform.firebasestorage.app",
  messagingSenderId: "800094078742",
  appId: "1:800094078742:web:21220d722b0254a525b237",
  measurementId: "G-3P4YNM8RBS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

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

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        const user = userCredential.user;

        // Save User Profile to Realtime Database
        await database.ref('users/' + user.uid).set({
            username: username,
            email: email,
            plan: "Free", // Everyone starts as Free
            joinedAt: Date.now()
        });

        alert("Account created! Welcome to Nyx.");
        window.location.href = "launcher.html"; 
    } catch (error) {
        alert("Signup Error: " + error.message);
    }
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
// This makes sure if they are logged in on the launcher, they stay logged in on games.
auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;
    
    if (user) {
        // Fetch user rank/plan from the Database
        database.ref('users/' + user.uid).on('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                // Update text on the page if these IDs exist
                if(document.getElementById('user-name-display')) {
                    document.getElementById('user-name-display').innerText = userData.username;
                }
                if(document.getElementById('user-plan-display')) {
                    document.getElementById('user-plan-display').innerText = userData.plan;
                }
            }
        });
    } else {
        // If logged out and not on the home page, send them back to login
        if (!currentPath.endsWith("index.html") && currentPath !== "/Nyx/") {
            window.location.href = "https://thenyxeddev.github.io/Nyx/index.html";
        }
    }
});

// 6. CLOAKED IFRAME OPENER (about:blank)
// Use this for your Minecraft mods and games
function launchCloaked(url) {
    const win = window.open('about:blank', '_blank');
    if (!win) {
        alert("Pop-up blocked! Please allow pop-ups for this site.");
        return;
    }
    
    win.document.body.style.margin = '0';
    win.document.body.style.height = '100vh';
    win.document.body.style.overflow = 'hidden';
    
    const iframe = win.document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.src = url;
    
    win.document.body.appendChild(iframe);
}
