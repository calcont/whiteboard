// Minimal, dependency-free IndexedDB store for the whiteboard scene.
// IndexedDB (not localStorage) because a serialized canvas embeds images as
// base64 data URLs and easily exceeds localStorage's ~5MB quota.

const DB_NAME = "whiteboard";
const STORE = "state";
const SCENE_KEY = "scene";

const openDB = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// Load the saved scene object, or null if none / on any failure.
export const loadScene = async () => {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(SCENE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
};

// Persist the scene object (a fabric canvas.toJSON()). Failures are swallowed —
// persistence is best-effort and must never break drawing.
export const saveScene = async (scene) => {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(scene, SCENE_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    /* best-effort */
  }
};
