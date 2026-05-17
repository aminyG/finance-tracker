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
// Group transactions by month for income vs expense bar chart
export function groupByMonth(transactions: Transaction[]): {
  month: string
  income: number
  expense: number
}[] {
  const map: Record<string, { income: number; expense: number }> = {}

  transactions.forEach((tx) => {
    const month = tx.date.slice(0, 7) // "YYYY-MM"
    map[month] ??= { income: 0, expense: 0 }
    if (tx.type === 'income') map[month].income += tx.amount
    else map[month].expense += tx.amount
  })

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('id-ID', {
        month: 'short',
        year: '2-digit',
      }),
      ...data,
    }))
}

// Group transactions by category for pie chart
export function groupByCategory(
  transactions: Transaction[],
  categoryMap: Record<string, string>,
): { name: string; value: number }[] {
  const map: Record<string, number> = {}

  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const name = categoryMap[tx.categoryId] ?? 'Unknown'
      map[name] = (map[name] ?? 0) + tx.amount
    })

  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))
}

// Balance over time for line chart
export function balanceOverTime(transactions: Transaction[]): {
  date: string
  balance: number
}[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  let running = 0
  return sorted.map((tx) => {
    running += tx.type === 'income' ? tx.amount : -tx.amount
    return {
      date: new Date(tx.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      }),
      balance: running,
    }
  })
}
