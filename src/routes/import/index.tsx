// src/routes/import/index.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { parseBankCSV } from '../../lib/gemini'
import type { BankTransaction } from '../../lib/gemini'
import { getAccounts } from '../../lib/accounts'
import type { Account } from '../../lib/accounts'
import { getCategories } from '../../lib/categories'
import type { Category } from '../../lib/categories'
import { addTransaction } from '../../lib/transactions'
import ProtectedRoute from '../../components/ProtectedRoute'

export const Route = createFileRoute('/import/')({
  component: () => (
    <ProtectedRoute>
      <ImportPage />
    </ProtectedRoute>
  ),
})

function ImportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accountId, setAccountId] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Parsed transactions from Gemini — user can review before saving
  const [parsed, setParsed] = useState<BankTransaction[]>([])
  // Track which rows user has unchecked (don't import)
  const [checkedRows, setCheckedRows] = useState<boolean[]>([])
  // Per-row category assignment
  const [rowCategories, setRowCategories] = useState<string[]>([])

  const [importDone, setImportDone] = useState(false)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      try {
        const [accs, cats] = await Promise.all([
          getAccounts(user!.uid),
          getCategories(user!.uid),
        ])
        setAccounts(accs)
        setCategories(cats)
        if (accs.length > 0) setAccountId(accs[0].id)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [user])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParsing(true)
    setError('')
    setParsed([])
    setImportDone(false)

    try {
      const categoryNames = categories.map((c) => c.name)
      const transactions = await parseBankCSV(file, categoryNames) // ← pass names

      if (transactions.length === 0) {
        setError('No transactions found in this file. Try a different file.')
        return
      }

      setParsed(transactions)
      setCheckedRows(transactions.map(() => true))

      // Match Gemini's category name → category ID, fallback to 'Other' or first
      const otherCat =
        categories.find((c) => c.name === 'Other') ?? categories[0]
      setRowCategories(
        transactions.map((tx) => {
          if (!tx.category) return otherCat.id
          const matched = categories.find(
            (c) => c.name.toLowerCase() === tx.category!.toLowerCase(),
          )
          return matched ? matched.id : otherCat.id
        }),
      )
    } catch (err: any) {
      setError(err.message ?? 'Failed to parse file.')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleImport() {
    if (!user || !accountId) return

    setSaving(true)
    setError('')

    try {
      const toImport = parsed.filter((_, i) => checkedRows[i])

      await Promise.all(
        toImport.map((tx, i) =>
          addTransaction(
            user.uid,
            accountId,
            rowCategories[i] || (categories[0]?.id ?? ''),
            tx.type,
            tx.amount,
            tx.description,
            tx.date,
          ),
        ),
      )

      setImportDone(true)
      setParsed([])
    } catch {
      setError('Failed to save some transactions. Try again.')
    } finally {
      setSaving(false)
    }
  }

  function toggleRow(i: number) {
    setCheckedRows((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  function setRowCategory(i: number, catId: string) {
    setRowCategories((prev) => prev.map((v, idx) => (idx === i ? catId : v)))
  }

  const checkedCount = checkedRows.filter(Boolean).length

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <p className="text-4xl mb-3">🏦</p>
        <p className="text-gray-600 font-medium">No accounts yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Add an account first before importing.
        </p>
        <button
          onClick={() => navigate({ to: '/accounts/new' })}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          Add Account
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Import Bank Mutation
          </h1>
        </div>

        {/* Success state */}
        {importDone && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-green-700">Import successful!</p>
            <p className="text-green-600 text-sm mt-1">
              Transactions have been added to your account.
            </p>
            <button
              onClick={() => navigate({ to: '/transactions' })}
              className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
            >
              View Transactions
            </button>
          </div>
        )}

        {/* Upload card */}
        {!importDone && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            {/* Account selector */}
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Import to Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {/* Parsing status */}
            {parsing && (
              <div className="flex items-center gap-2 text-blue-500 text-sm mb-3">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Reading bank statement with AI...
              </div>
            )}

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              {parsing ? 'Reading file...' : '📂 Upload bank mutation file'}
            </button>

            <p className="text-xs text-gray-400 mt-2 text-center">
              Supports BCA, Mandiri, BNI, BRI and other Indonesian banks
            </p>
          </div>
        )}

        {/* Review table */}
        {parsed.length > 0 && !importDone && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Review Transactions</p>
              <p className="text-xs text-gray-400">
                {checkedCount} of {parsed.length} selected
              </p>
            </div>

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
              {parsed.map((tx, i) => (
                <div
                  key={i}
                  className={`border rounded-xl p-3 transition-opacity ${
                    checkedRows[i] ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={checkedRows[i]}
                      onChange={() => toggleRow(i)}
                      className="mt-1 accent-blue-500"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {tx.description}
                        </p>
                        <p
                          className={`text-sm font-bold shrink-0 ${
                            tx.type === 'income'
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} Rp{' '}
                          {tx.amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>

                      {/* Category selector per row */}
                      <select
                        value={rowCategories[i]}
                        onChange={(e) => setRowCategory(i, e.target.value)}
                        disabled={!checkedRows[i]}
                        className="mt-2 w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={saving || checkedCount === 0}
              className="w-full mt-4 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {saving
                ? 'Importing...'
                : `Import ${checkedCount} Transaction${checkedCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
