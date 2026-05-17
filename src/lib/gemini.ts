// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing VITE_GEMINI_API_KEY in .env file')
}

const genAI = new GoogleGenerativeAI(apiKey)

export interface ScannedReceipt {
  amount: number | null
  date: string | null
  note: string | null
  category: string | null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ← add categories parameter here
export async function scanReceipt(
  file: File,
  categories: string[],
): Promise<ScannedReceipt> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const base64 = await fileToBase64(file)

  const prompt = `
    You are a receipt scanner. Analyze this receipt image and extract:
    1. Total amount paid (the final total, not subtotal)
    2. Date of purchase
    3. Merchant name or brief description of what was bought
    4. Best matching category from this list: ${categories.join(', ')}

    Respond ONLY with a valid JSON object, no markdown, no explanation:
    {
      "amount": <number or null>,
      "date": "<YYYY-MM-DD format or null>",
      "note": "<merchant name or description or null>",
      "category": "<one of the category names from the list above, or null>"
    }

    Rules:
    - amount must be a plain number (e.g. 45000, not "Rp 45.000")
    - date must be YYYY-MM-DD format
    - category must exactly match one of the provided category names
    - If you cannot find a field, use null
    - Do not include any text outside the JSON
  `

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        data: base64,
      },
    },
  ])

  const text = result.response.text().trim()

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      date: typeof parsed.date === 'string' ? parsed.date : null,
      note: typeof parsed.note === 'string' ? parsed.note : null,
      category: typeof parsed.category === 'string' ? parsed.category : null, // ← fixed
    }
  } catch {
    throw new Error('Failed to parse receipt data. Try a clearer photo.')
  }
}

export interface BankTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string | null // ← add this
}

export async function parseBankCSV(
  file: File,
  categories: string[], // ← add this parameter
): Promise<BankTransaction[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
    You are a bank statement parser. Analyze this bank mutation document and extract all transactions.
    
    The file may be from any Indonesian bank (BCA, Mandiri, BNI, BRI, etc.) in any format.
    Figure out which columns represent: date, description/note, debit (expense), credit (income).

    Also assign the best matching category for each transaction from this list: ${categories.join(', ')}

    Respond ONLY with a valid JSON array, no markdown, no explanation:
    [
      {
        "date": "<YYYY-MM-DD>",
        "description": "<transaction description>",
        "amount": <positive number>,
        "type": "<income or expense>",
        "category": "<one of the category names from the list above, or null>"
      }
    ]

    Rules:
    - date must be YYYY-MM-DD format
    - amount must be a positive number (no negative values)
    - type is "income" for credit/masuk, "expense" for debit/keluar
    - category must exactly match one of the provided category names
    - Skip rows that are headers, summaries, or opening/closing balance
    - description should be a clean readable label
    - Do not include any text outside the JSON array
  `

  const base64 = await fileToBase64(file)

  let mimeType: string = file.type
  if (!mimeType || mimeType === '') {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') mimeType = 'application/pdf'
    else if (ext === 'csv') mimeType = 'text/plain'
    else mimeType = 'text/plain'
  }

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ])

  const text = result.response.text().trim()

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) throw new Error('Not an array')
    return parsed.filter(
      (tx: any) =>
        typeof tx.date === 'string' &&
        typeof tx.amount === 'number' &&
        typeof tx.description === 'string' &&
        (tx.type === 'income' || tx.type === 'expense'),
    )
  } catch {
    throw new Error('Failed to parse bank statement. Try a different file.')
  }
}
