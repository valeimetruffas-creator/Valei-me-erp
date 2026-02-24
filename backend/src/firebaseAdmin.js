import admin from "firebase-admin";

function getServiceAccountFromEnv() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) return null;

  try {
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = getServiceAccountFromEnv();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminDb() {
  return getAdminApp().firestore();
}
