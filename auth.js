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

// 2. SIGNUP (with duplicate username check)
async function handleSignup() {
    const userVal = document.getElementById('reg-username').value.toLowerCase();
    const emailVal = document.getElementById('reg-email').value;
    const passVal = document.getElementById('reg-password').value;
    const confirmVal = document.getElementById('reg-confirm').value;

    if (passVal !== confirmVal) return alert("Passwords do not match!");

    try {
        // Check if username is taken
        const snapshot = await database.ref('usernames/' + userVal).once('value');
        if (snapshot.exists()) return alert("Username already taken!");

        const userCredential = await auth.createUserWithEmailAndPassword(emailVal, passVal);
        const user = userCredential.user;

        // Save to Database
        await database.ref('users/' + user.uid).set({
            username: userVal,
            email: emailVal,
            plan: "Free"
        });
        
        // Save to username index for quick login lookup
        await database.ref('usernames/' + userVal).set(emailVal);

        window.location.href = "launcher.html";
    } catch (e) { alert(e.message); }
}

// 3. LOGIN (Username or Email)
async function handleLogin() {
    const identifier = document.getElementById('login-identifier').value.toLowerCase();
    const passVal = document.getElementById('login-password').value;
    let email = identifier;

    try {
        // If it's not an email, look up the email via username
        if (!identifier.includes('@')) {
            const snapshot = await database.ref('usernames/' + identifier).once('value');
            if (!snapshot.exists()) throw new Error("Username not found.");
            email = snapshot.val();
        }

        await auth.signInWithEmailAndPassword(email, passVal);
        window.location.href = "launcher.html";
    } catch (e) { alert(e.message); }
}

// 4. AUTO-REDIRECT LOGIC
auth.onAuthStateChanged((user) => {
    const path = window.location.pathname;
    if (user) {
        database.ref('users/' + user.uid).on('value', (snap) => {
            const data = snap.val();
            if (data && document.getElementById('user-name-display')) {
                document.getElementById('user-name-display').innerText = data.username;
                document.getElementById('user-plan-display').innerText = data.plan;
            }
        });
    } else {
        // If they aren't logged in, send them to login.html
        if (!path.endsWith("login.html")) {
            window.location.href = "login.html";
        }
    }
});
