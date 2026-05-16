// src/lib/transactions.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore'
import { db } from '../firebase'

export type TransactionType = 'income' | 'expense'
export type TransactionSource = 'manual' | 'bank_scan' | 'receipt_scan'

export interface Transaction {
  id: string
  userId: string
  accountId: string
  categoryId: string
  type: TransactionType
  amount: number
  note: string
  date: string // ISO date string e.g. "2024-01-15"
  source: TransactionSource
  createdAt: Date
}

// Fetch all transactions for a user
export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[]
}

// Fetch only recent N transactions (for dashboard)
export async function getRecentTransactions(
  userId: string,
  count: number = 5,
): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(count),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[]
}

// Add a transaction AND update account balance in one go
export async function addTransaction(
  userId: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  note: string,
  date: string,
): Promise<void> {
  // 1. Write the transaction document
  await addDoc(collection(db, 'transactions'), {
    userId,
    accountId,
    categoryId,
    type,
    amount,
    note,
    date,
    source: 'manual',
    createdAt: serverTimestamp(),
  })

  // 2. Update account balance automatically
  // income → add to balance, expense → subtract from balance
  const accountRef = doc(db, 'accounts', accountId)
  await updateDoc(accountRef, {
    balance: increment(type === 'income' ? amount : -amount),
  })
}
