// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYaBOhYIt4PaKVIEz4rzRP8tKsnr2orYM",
  authDomain: "j2pgamingtech.firebaseapp.com",
  projectId: "j2pgamingtech",
  storageBucket: "j2pgamingtech.firebasestorage.app",
  messagingSenderId: "160400784245",
  appId: "1:160400784245:web:bcb8028bedcb28c587713c",
  measurementId: "G-1PJKYPG21P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);