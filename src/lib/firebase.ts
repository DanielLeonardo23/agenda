import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  "projectId": "fintrack-daily-tmx7p",
  "appId": "1:179227475263:web:af2a3d86e3860e500fe78a",
  "storageBucket": "fintrack-daily-tmx7p.firebasestorage.app",
  "apiKey": "AIzaSyChwb3OUIaD6LbsZcLIIGiD0OQEyWE1AW4",
  "authDomain": "fintrack-daily-tmx7p.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "179227475263",
  "databaseURL": "https://fintrack-daily-tmx7p-default-rtdb.firebaseio.com"
};

export const firebaseApp = initializeApp(firebaseConfig);
