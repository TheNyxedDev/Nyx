// 1. CONFIG
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

// 2. GOOGLE SSO LOGIN
async function handleGoogleLogin() {
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        const snapshot = await database.ref('users/' + user.uid).once('value');
        
        if (!snapshot.exists()) {
            await database.ref('users/' + user.uid).set({
                username: user.displayName || "User" + Math.floor(Math.random() * 1000),
                email: user.email,
                plan: "Free",
                pfp: user.photoURL,
                role: "User"
            });
            await database.ref('usernames/' + (user.displayName || user.uid).toLowerCase()).set(user.email);
        }
        window.location.href = "launcher.html";
    } catch (e) { alert(e.message); }
}

// 3. SIGNUP & LOGIN (Email/User)
async function handleSignup() {
    const userVal = document.getElementById('reg-username').value.toLowerCase();
    const emailVal = document.getElementById('reg-email').value;
    const passVal = document.getElementById('reg-password').value;
    try {
        const snap = await database.ref('usernames/' + userVal).once('value');
        if (snap.exists()) return alert("Username taken!");
        const cred = await auth.createUserWithEmailAndPassword(emailVal, passVal);
        await database.ref('users/' + cred.user.uid).set({ username: userVal, email: emailVal, plan: "Free", role: "User" });
        await database.ref('usernames/' + userVal).set(emailVal);
        window.location.href = "launcher.html";
    } catch (e) { alert(e.message); }
}

async function handleLogin() {
    const id = document.getElementById('login-identifier').value.toLowerCase();
    const pass = document.getElementById('login-password').value;
    let email = id;
    try {
        if (!id.includes('@')) {
            const snap = await database.ref('usernames/' + id).once('value');
            if (!snap.exists()) throw new Error("User not found");
            email = snap.val();
        }
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = "launcher.html";
    } catch (e) { alert(e.message); }
}

// 4. LOGOUT
function handleLogout() {
    auth.signOut().then(() => { window.location.href = "login.html"; });
}

// 5. THE BRAIN: AUTH LISTENER & REDIRECTS
auth.onAuthStateChanged((user) => {
    const path = window.location.pathname;
    if (user) {
        database.ref('users/' + user.uid).on('value', (snap) => {
            const data = snap.val();
            if (data) {
                window.currentUserData = data; // Set global data for page logic
                if(document.getElementById('nav-username')) document.getElementById('nav-username').innerText = data.username;
                if(document.getElementById('nav-plan')) document.getElementById('nav-plan').innerText = data.plan;
                if(document.getElementById('nav-pfp')) document.getElementById('nav-pfp').src = data.pfp || "https://via.placeholder.com/32";
                
                const roleEl = document.getElementById('nav-staff-role');
                if(data.role && data.role !== "User" && roleEl) {
                    roleEl.innerText = data.role;
                    roleEl.classList.remove('hidden');
                }
            }
        });
    } else {
        if (!path.endsWith("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// 6. GAME LAUNCHER (With Rank Check)
function launchGame(url, requiredTier = "Free") {
    if (!window.currentUserData) return;
    const { plan, role } = window.currentUserData;
    
    // Admin/Owner Bypass
    if (role === "Owner" || role === "Admin") return launchCloaked(url);

    if (requiredTier === "Gold" && plan === "Free") return alert("Gold Plan Required!");
    if (requiredTier === "Diamond" && plan !== "Diamond") return alert("Diamond Plan Required!");
    
    launchCloaked(url);
}

function launchCloaked(url) {
    const win = window.open('about:blank', '_blank');
    win.document.body.style.margin = '0';
    win.document.body.style.height = '100vh';
    const iframe = win.document.createElement('iframe');
    iframe.style = "border:none; width:100%; height:100%;";
    iframe.src = url;
    win.document.body.appendChild(iframe);
}
