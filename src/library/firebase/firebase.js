import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReduxSagaFirebase from "redux-saga-firebase";
import isoConfig from "@iso/config/firebase.config";
// Example if anyone want to use different config for production and development using .env

// const prodConfig = {
//   apiKey: process.env.REACT_APP_PROD_API_KEY,
//   authDomain: process.env.REACT_APP_PROD_AUTH_DOMAIN,
//   databaseURL: process.env.REACT_APP_PROD_DATABASE_URL,
//   projectId: process.env.REACT_APP_PROD_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_PROD_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_PROD_MESSAGING_SENDER_ID,
// };
// const devConfig = {
//   apiKey: process.env.REACT_APP_DEV_API_KEY,
//   authDomain: process.env.REACT_APP_DEV_AUTH_DOMAIN,
//   databaseURL: process.env.REACT_APP_DEV_DATABASE_URL,
//   projectId: process.env.REACT_APP_DEV_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_DEV_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_DEV_MESSAGING_SENDER_ID,
// };
// const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
// !firebase.apps.length ? firebase.initializeApp(isoConfig) : firebase.app();

export const firebaseApp = !getApps().length
  ? initializeApp(isoConfig)
  : getApp();
export const auth = getAuth();
export const db = getFirestore();
export const rsf = new ReduxSagaFirebase(firebaseApp);
