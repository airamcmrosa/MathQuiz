#!/usr/bin/env node
/**
 * qa-reporter.js
 * Converts raw JSON test outputs from Vitest and Jest into a clean .md report.
 * Usage: node scripts/qa-reporter.js <task-number>
 * Example: node scripts/qa-reporter.js 008
 */

const fs = require('fs')
const path = require('path')

const taskNum = process.argv[2]
if (!taskNum) {
  console.error('Usage: node scripts/qa-reporter.js <task-number>')
  process.exit(1)
}

const logsDir = path.join(process.cwd(), 'logs')
const feRawPath = path.join(logsDir, `fe-raw-${taskNum}.json`)
const beRawPath = path.join(logsDir, `be-raw-${taskNum}.json`)
const e2eRawPath = path.join(logsDir, `e2e-raw-${taskNum}.json`)
const outputPath = path.join(logsDir, `test-run-${taskNum}.md`)

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function formatVitestResults(data) {
  if (!data) return { passed: [], failed: [], total: 0, passCount: 0, failCount: 0 }

  const passed = []
  const failed = []

  const testResults = data.testResults ?? data.files ?? []
  for (const file of testResults) {
    const tests = file.assertionResults ?? file.tests ?? []
    for (const t of tests) {
      const name = `${file.testFilePath ? path.basename(file.testFilePath) : 'test'}: ${t.fullName ?? t.name}`
      if (t.status === 'passed') {
        passed.push(name)
      } else {
        failed.push({ name, error: t.failureMessages?.[0] ?? t.errors?.[0]?.message ?? 'Unknown error' })
      }
    }
  }

  return { passed, failed, total: passed.length + failed.length, passCount: passed.length, failCount: failed.length }
}

function formatJestResults(data) {
  if (!data) return { passed: [], failed: [], total: 0, passCount: 0, failCount: 0 }

  const passed = []
  const failed = []

  for (const suite of (data.testResults ?? [])) {
    for (const t of (suite.assertionResults ?? [])) {
      const name = `${path.basename(suite.testFilePath)}: ${t.fullName}`
      if (t.status === 'passed') {
        passed.push(name)
      } else {
        failed.push({ name, error: t.failureMessages?.[0] ?? 'Unknown error' })
      }
    }
  }

  return { passed, failed, total: passed.length + failed.length, passCount: passed.length, failCount: failed.length }
}

function buildSection(title, results) {
  if (!results) return `## ${title}\n_Não executado_\n`

  const lines = [`## ${title}`, '']

  if (results.passCount > 0) {
    lines.push(`### Passed (${results.passCount})`)
    results.passed.forEach((t) => lines.push(`- ✓ ${t}`))
    lines.push('')
  }

  if (results.failCount > 0) {
    lines.push(`### Failed (${results.failCount})`)
    results.failed.forEach(({ name }) => lines.push(`- ✗ ${name}`))
    lines.push('')
  }

  if (results.total === 0) {
    lines.push('_Nenhum teste encontrado_')
    lines.push('')
  }

  return lines.join('\n')
}

function buildErrorSection(fe, be, e2e) {
  const allFailed = [
    ...(fe?.failed ?? []),
    ...(be?.failed ?? []),
    ...(e2e?.failed ?? []),
  ]

  if (allFailed.length === 0) return ''

  const lines = ['## Errors', '']
  for (const { name, error } of allFailed) {
    lines.push(`### ✗ ${name}`)
    lines.push('```')
    lines.push(error.split('\n').slice(0, 15).join('\n'))
    lines.push('```')
    lines.push('')
  }
  return lines.join('\n')
}

// Read raw results
const feData = readJson(feRawPath)
const beData = readJson(beRawPath)
const e2eData = readJson(e2eRawPath)

// Parse
const feResults = formatVitestResults(feData)
const beResults = formatJestResults(beData)
const e2eResults = formatJestResults(e2eData) // Playwright JSON is similar

// Totals
const totalPass = feResults.passCount + beResults.passCount + (e2eData ? e2eResults.passCount : 0)
const totalFail = feResults.failCount + beResults.failCount + (e2eData ? e2eResults.failCount : 0)
const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

// Build markdown
const lines = [
  `# Test Run — Task ${taskNum} — ${now}`,
  '',
  '## Summary',
  `✓ ${totalPass} passed | ✗ ${totalFail} failed`,
  '',
  '---',
  '',
  buildSection('Frontend (Vitest)', feResults),
  '---',
  '',
  buildSection('Backend (Jest)', beResults),
  '---',
  '',
  e2eData ? buildSection('E2E (Playwright)', e2eResults) + '\n---\n' : '## E2E (Playwright)\n_Não executado_\n\n---\n',
  buildErrorSection(feResults, beResults, e2eData ? e2eResults : null),
]

const content = lines.join('\n')

// Write report
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
fs.writeFileSync(outputPath, content, 'utf-8')

// Print ONLY the summary line to stdout (terminal stays clean)
console.log(`✓ ${totalPass} passed | ✗ ${totalFail} failed | Task ${taskNum}`)

// Exit with error code if tests failed (so CI catches it)
process.exit(totalFail > 0 ? 1 : 0)
