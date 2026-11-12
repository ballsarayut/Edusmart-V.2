import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Sanitize data before writing to Firestore: strips undefined fields so setDoc never fails
export function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData).filter(item => item !== undefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeData(val);
      }
    }
    return clean;
  }
  return obj;
}

export const fetchTodayAttendance = async (): Promise<any[]> => {
  try {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const thaiToday = `${year + 543}-${month}-${day}`;
    const utcToday = d.toISOString().split('T')[0];

    const dateList = Array.from(new Set([today, thaiToday, utcToday]));
    const q = query(collection(db, 'attendance'), where('date', 'in', dateList));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (err) {
    console.error('Failed to fetch today attendance quick query:', err);
    return [];
  }
};

export const syncCollection = <T extends { id: string | number }>(
  collectionName: string, 
  callback: (data: T[]) => void
) => {
  return onSnapshot(collection(db, collectionName), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as T));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, collectionName);
  });
};

export const saveToFirestore = async (collectionName: string, data: any) => {
  const path = `${collectionName}/${data.id}`;
  const cleanData = sanitizeData(data);
  try {
    await setDoc(doc(db, collectionName, String(data.id)), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveMultipleToFirestore = async (collectionName: string, dataArray: any[]) => {
  const batch = writeBatch(db);
  dataArray.forEach(item => {
    const docRef = doc(db, collectionName, String(item.id));
    const cleanItem = sanitizeData(item);
    batch.set(docRef, cleanItem);
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
};

export const deleteFromFirestore = async (collectionName: string, id: string | number) => {
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, String(id)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const deleteMultipleFromFirestore = async (collectionName: string, ids: (string | number)[]) => {
  const batch = writeBatch(db);
  ids.forEach(id => {
    const docRef = doc(db, collectionName, String(id));
    batch.delete(docRef);
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionName);
  }
};
