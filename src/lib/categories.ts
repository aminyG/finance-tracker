import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface Category {
  id: string
  userId: string
  name: string
}

const DEFAULT_CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Health',
  'Entertainment',
  'Education',
  'Salary',
  'Freelance',
  'Other',
]

// Fetch all categories for a user
export async function getCategories(userId: string): Promise<Category[]> {
  const q = query(collection(db, 'categories'), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[]
}

// Seed default categories if user has none yet
export async function seedDefaultCategories(userId: string): Promise<void> {
  const existing = await getCategories(userId)
  if (existing.length > 0) return // already has categories, skip

  const promises = DEFAULT_CATEGORIES.map((name) =>
    addDoc(collection(db, 'categories'), { userId, name }),
  )
  await Promise.all(promises)
}

export async function addCategory(userId: string, name: string): Promise<void> {
  await addDoc(collection(db, 'categories'), { userId, name })
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', categoryId))
}

export async function renameCategory(
  categoryId: string,
  newName: string,
): Promise<void> {
  await updateDoc(doc(db, 'categories', categoryId), { name: newName })
}
