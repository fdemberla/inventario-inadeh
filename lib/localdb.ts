// lib/localdb.ts
import { openDB, deleteDB } from "idb";

const DB_NAME = "OfflineInventoryDB";
const DB_VERSION = 1;

export const getDB = async () => {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "username" });
        }
      },
    });
  } catch (error) {
    // Handle version mismatch or corruption
    if (error.name === "VersionError" || error.name === "InvalidStateError") {
      console.warn("Database version mismatch detected. Recreating database...");
      
      try {
        // Delete the old database
        await deleteDB(DB_NAME);
        
        // Show user notification if available
        if (typeof window !== "undefined") {
          const { toast } = await import("react-hot-toast");
          toast.error("Se detectó una actualización. La base de datos local se ha reiniciado.", {
            duration: 5000,
          });
        }
        
        // Recreate the database
        return await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("users")) {
              db.createObjectStore("users", { keyPath: "username" });
            }
          },
        });
      } catch (deleteError) {
        console.error("Failed to recreate database:", deleteError);
        throw deleteError;
      }
    }
    
    // Re-throw other errors
    throw error;
  }
};
