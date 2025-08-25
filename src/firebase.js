// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvHNVYiPDtm1K4hKjzFAEenjjPGj6836w",
  authDomain: "photoshare-566d9.firebaseapp.com",
  projectId: "photoshare-566d9",
  storageBucket: "photoshare-566d9.firebasestorage.app",
  messagingSenderId: "40141009873",
  appId: "1:40141009873:web:37d9638196fd3be9ff26f0",
  measurementId: "G-1XVX08BJ0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const firebaseApp=initializeApp(firebaseConfig);