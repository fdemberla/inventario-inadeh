// lib/localdb.ts
import { openDB } from "idb";

export const getDB = () =>
  openDB("OfflineInventoryDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "username" });
      }
    },
  });
