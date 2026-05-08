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
  try {
    await setDoc(doc(db, collectionName, String(data.id)), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveMultipleToFirestore = async (collectionName: string, dataArray: any[]) => {
  const batch = writeBatch(db);
  dataArray.forEach(item => {
    const docRef = doc(db, collectionName, String(item.id));
    batch.set(docRef, item);
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
