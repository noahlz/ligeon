/**
 * Fetch chess openings from lichess-org/chess-openings repo
 * Extracts ECO codes and names from TSV files, outputs lightweight JSON
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Opening {
  eco: string
  name: string
}

const TSV_FILES = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv']
const BASE_URL = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master'

async function fetchTSV(filename: string): Promise<Opening[]> {
  const url = `${BASE_URL}/${filename}`
  console.log(`Fetching ${url}...`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`)
  }

  const text = await response.text()
  const lines = text.trim().split('\n')

  // Skip header line
  const dataLines = lines.slice(1)

  const openings: Opening[] = []
  for (const line of dataLines) {
    const [eco, name] = line.split('\t')
    if (eco && name) {
      openings.push({ eco: eco.trim(), name: name.trim() })
    }
  }

  return openings
}

async function main() {
  console.log('Fetching chess openings from lichess-org/chess-openings...')

  const allOpenings: Opening[] = []

  for (const file of TSV_FILES) {
    const openings = await fetchTSV(file)
    allOpenings.push(...openings)
    console.log(`  ✓ ${file}: ${openings.length} openings`)
  }

  console.log(`\nTotal openings: ${allOpenings.length}`)

  // Sort by ECO code
  allOpenings.sort((a, b) => a.eco.localeCompare(b.eco))

  // Write to src/data/openings.json
  const outputPath = path.join(__dirname, '../src/data/openings.json')
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(allOpenings, null, 2))

  const stats = fs.statSync(outputPath)
  const sizeKB = (stats.size / 1024).toFixed(1)

  console.log(`\n✓ Written to ${outputPath} (${sizeKB} KB)`)
}

main().catch(console.error)
