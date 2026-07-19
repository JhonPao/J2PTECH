// Configuración de Firebase (Compat SDK)
const firebaseConfig = {
  apiKey: "AIzaSyDYaBOhYIt4PaKVIEz4rzRP8tKsnr2orYM",
  authDomain: "j2pgamingtech.firebaseapp.com",
  projectId: "j2pgamingtech",
  storageBucket: "j2pgamingtech.firebasestorage.app",
  messagingSenderId: "160400784245",
  appId: "1:160400784245:web:bcb8028bedcb28c587713c",
  measurementId: "G-1PJKYPG21P"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
