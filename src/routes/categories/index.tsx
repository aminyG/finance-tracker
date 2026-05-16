// src/routes/categories/index.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getCategories,
  addCategory,
  deleteCategory,
  renameCategory,
  type Category,
} from '../../lib/categories'
import ProtectedRoute from '../../components/ProtectedRoute'

export const Route = createFileRoute('/categories/')({
  component: () => (
    <ProtectedRoute>
      <CategoriesPage />
    </ProtectedRoute>
  ),
})

function CategoriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    async function fetchCategories() {
      try {
        const cats = await getCategories(user!.uid)
        setCategories(cats)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [user])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newCatName.trim()) return

    if (
      categories.some(
        (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase(),
      )
    ) {
      setError('Category already exists.')
      return
    }

    setAddingCat(true)
    setError('')
    try {
      await addCategory(user.uid, newCatName.trim())
      const updated = await getCategories(user.uid)
      setCategories(updated)
      setNewCatName('')
    } catch {
      setError('Failed to add category.')
    } finally {
      setAddingCat(false)
    }
  }

  async function handleDelete(categoryId: string) {
    try {
      await deleteCategory(categoryId)
      setCategories((prev) => prev.filter((c) => c.id !== categoryId))
    } catch {
      setError('Failed to delete category.')
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditingName(cat.name)
    setError('')
  }

  async function handleRename(categoryId: string) {
    if (!editingName.trim()) return
    if (
      categories.some(
        (c) =>
          c.id !== categoryId &&
          c.name.toLowerCase() === editingName.trim().toLowerCase(),
      )
    ) {
      setError('Category name already exists.')
      return
    }

    try {
      await renameCategory(categoryId, editingName.trim())
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, name: editingName.trim() } : c,
        ),
      )
      setEditingId(null)
      setEditingName('')
    } catch {
      setError('Failed to rename category.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

          {/* Add new category */}
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="New category name"
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value)
                setError('')
              }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={addingCat || !newCatName.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {addingCat ? '...' : 'Add'}
            </button>
          </form>

          {/* Category list */}
          {loading && (
            <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
          )}

          {!loading && categories.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              No categories yet.
            </p>
          )}

          {!loading && categories.length > 0 && (
            <div className="flex flex-col">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 py-3 border-b last:border-0"
                >
                  {editingId === cat.id ? (
                    <div className="flex flex-1 gap-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(cat.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        onClick={() => handleRename(cat.id)}
                        className="text-blue-500 text-xs font-medium hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 text-xs hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800 flex-1">{cat.name}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(cat)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
