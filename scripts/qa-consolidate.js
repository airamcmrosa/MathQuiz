#!/usr/bin/env node
/**
 * qa-consolidate.js
 * Stop hook for the QA agent.
 * Reads the latest test-run-NNN.md and consolidates it into
 * .kiro/context/task-history/task-NNN.md
 * 
 * Triggered automatically by the qa-agent's stop hook after each turn.
 */

const fs = require('fs')
const path = require('path')

// Detect task number from active-context.md
const activeContextPath = path.join(process.cwd(), '.kiro', 'context', 'active-context.md')

let taskNum = '000'
if (fs.existsSync(activeContextPath)) {
  const content = fs.readFileSync(activeContextPath, 'utf-8')
  const match = content.match(/task-(\d+)/i)
  if (match) taskNum = match[1].padStart(3, '0')
}

const logsDir = path.join(process.cwd(), 'logs')
const testRunPath = path.join(logsDir, `test-run-${taskNum}.md`)
const reviewPath = path.join(logsDir, 'reviews', `review-${taskNum}.md`)
const historyDir = path.join(process.cwd(), '.kiro', 'context', 'task-history')
const historyPath = path.join(historyDir, `task-${taskNum}.md`)

if (!fs.existsSync(logsDir)) process.exit(0)

// Read available artifacts
const testRunContent = fs.existsSync(testRunPath)
  ? fs.readFileSync(testRunPath, 'utf-8')
  : '_Test run not found_'

const reviewContent = fs.existsSync(reviewPath)
  ? fs.readFileSync(reviewPath, 'utf-8')
  : '_Review not found_'

// Extract summary line from test run
const summaryMatch = testRunContent.match(/✓ \d+ passed \| ✗ \d+ failed/)
const summary = summaryMatch ? summaryMatch[0] : 'Summary not available'

const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

const consolidatedContent = `# Task ${taskNum} — Consolidated Artifact

**Completed:** ${now}
**Test Summary:** ${summary}

---

## Test Results

${testRunContent}

---

## Security & Quality Review

${reviewContent}
`

// Write consolidated artifact
if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true })
fs.writeFileSync(historyPath, consolidatedContent, 'utf-8')
