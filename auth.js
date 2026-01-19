// --- CONFIG (As provided by you) ---
const firebaseConfig = {
  apiKey: "AIzaSyA86k-osavaNRKxd8HP1J45E_QsC7YUW74",
  authDomain: "nyx-platform.firebaseapp.com",
  databaseURL: "https://nyx-platform-default-rtdb.firebaseio.com", 
  projectId: "nyx-platform",
  storageBucket: "nyx-platform.firebasestorage.app",
  messagingSenderId: "800094078742",
  appId: "1:800094078742:web:21220d722b0254a525b237"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

// --- AUTH LISTENER ---
auth.onAuthStateChanged((user) => {
    const path = window.location.pathname;
    if (user) {
        database.ref('users/' + user.uid).on('value', (snap) => {
            const data = snap.val();
            if (data) {
                if(document.getElementById('nav-username')) document.getElementById('nav-username').innerText = data.username;
                if(document.getElementById('drop-username')) document.getElementById('drop-username').innerText = data.username;
                if(document.getElementById('nav-plan')) document.getElementById('nav-plan').innerText = data.plan;
                if(document.getElementById('nav-pfp')) document.getElementById('nav-pfp').src = data.pfp || "default-pfp.png";
            }
        });
    } else {
        if (!path.endsWith("login.html")) window.location.href = "login.html";
    }
});

// --- GOOGLE SSO ---
async function handleGoogleLogin() {
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        const snap = await database.ref('users/' + user.uid).once('value');
        if (!snap.exists()) {
            await database.ref('users/' + user.uid).set({
                username: user.displayName,
                email: user.email,
                plan: "Free",
                pfp: user.photoURL
            });
            await database.ref('usernames/' + user.displayName.toLowerCase().replace(/\s/g, '')).set(user.email);
        }
        window.location.href = "index.html";
    } catch (e) { alert(e.message); }
}

// ... include handleLogin and handleSignup as before ...

function handleLogout() { auth.signOut().then(() => { window.location.href = "login.html"; }); }
