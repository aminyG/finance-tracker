// src/lib/accounts.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export type AccountType = 'bank' | 'ewallet' | 'cash'

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  balance: number
  createdAt: Date
}

// Fetch all accounts belonging to a user
export async function getAccounts(userId: string): Promise<Account[]> {
  const q = query(collection(db, 'accounts'), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Account[]
}

// Add a new account for a user
export async function addAccount(
  userId: string,
  name: string,
  type: AccountType,
  balance: number,
): Promise<void> {
  await addDoc(collection(db, 'accounts'), {
    userId,
    name,
    type,
    balance,
    createdAt: serverTimestamp(),
  })
}
