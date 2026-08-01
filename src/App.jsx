import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function apiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path
}

const actionButtonRows = [
  ['2nd Left', '2nd Middle', '2nd Right', '3rd Floor+', '3rd Floor-'],
  ['Box entry (Open play)', 'Box entry (SP)', 'Shot on target', 'Shot off target'],
  ['3rd <8s Box', '3rd <8s Control', '3rd <8s Loss'],
  ['3rd >8s Box', '3rd >8s Control', '3rd >8s Loss'],
  ['Opp side regain', '5s transition (Success)', '5s transition (Fail)']
]
const xgActions = new Set(['xG FK','xG IFK','xG PEN','xG Corner'])
const shotActions = new Set(['Shot on target','Shot off target'])
const seasonTableColumns = [
  'Match',
  'Points',
  'Goal Difference',
  'Goals',
  'Goals Conceded',
  'xG Difference',
  'xG',
  'xG Conceded',
  'Shots on Target Difference',
  'Shots on Target',
  'Shots on Target conceded',
  'xG / Shot Difference',
  'xG / Shot',
  'xG / Shot Conceded',
  'Box Entries Difference',
  'Box Entries',
  'Box Entries conceded',
  '3rd Floor Difference',
  '3rd Floor',
  '3rd Floor Opponent',
  '2nd Floor Difference',
  '2nd Floor',
  '2nd Floor Opponent',
  'Possession',
  '8 Seconds Acceleration',
  '5 Seconds',
  '4 sec Transition+',
  'Opp. Side Regains',
]
const seasonTableRows = Array.from({ length: 20 }, (_, rowIndex) => {
  const rowNumber = rowIndex + 1
  return {
    label: `Round ${rowNumber}`,
  }
})

const seasonSectionConfigs = [
  { sectionKey: 'points', label: 'Points' },
  { sectionKey: 'goalDiff', label: 'Goal diff' },
  { sectionKey: 'goals', label: 'Goals' },
  { sectionKey: 'goalsConc', label: 'Goals conc.' },
  { sectionKey: 'xgDiff', label: 'xG diff' },
  { sectionKey: 'xg', label: 'xG' },
  { sectionKey: 'xgConc', label: 'xG conc.' },
  { sectionKey: 'shotsOnTargetDiff', label: 'Shots on Target Difference' },
  { sectionKey: 'shotsOnTarget', label: 'Shots on Target' },
  { sectionKey: 'shotsOnTargetConc', label: 'Shots on Target conceded' },
  { sectionKey: 'xgPerShotDiff', label: 'xG / Shot Difference' },
  { sectionKey: 'xgPerShot', label: 'xG / Shot' },
  { sectionKey: 'xgPerShotConc', label: 'xG / Shot Conceded' },
  { sectionKey: 'boxEntriesDiff', label: 'Box Entries Difference' },
  { sectionKey: 'boxEntries', label: 'Box Entries' },
  { sectionKey: 'boxEntriesConc', label: 'Box Entries conceded' },
  { sectionKey: 'thirdFloorDiff', label: '3rd Floor Difference' },
  { sectionKey: 'thirdFloor', label: '3rd Floor' },
  { sectionKey: 'thirdFloorOpponent', label: '3rd Floor Opponent' },
  { sectionKey: 'secondFloorDiff', label: '2nd Floor Difference' },
  { sectionKey: 'secondFloor', label: '2nd Floor' },
  { sectionKey: 'secondFloorOpponent', label: '2nd Floor Opponent' },
  { sectionKey: 'possession', label: 'Possession' },
  { sectionKey: 'acceleration8', label: '8 Seconds Acceleration' },
  { sectionKey: 'fiveSeconds', label: '5 Seconds' },
  { sectionKey: 'transition4', label: '4 sec Transition+' },
  { sectionKey: 'oppSideRegains', label: 'Opp. Side Regains' },
]

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

function randomInt(min, max, seed) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min
}

function randomFloat(min, max, seed) {
  return min + seededRandom(seed) * (max - min)
}

function createRoundProfile(roundIndex) {
  const baseSeed = (roundIndex + 1) * 97
  const resultRoll = seededRandom(baseSeed + 1)
  const result = resultRoll < 0.44 ? 'W' : (resultRoll < 0.69 ? 'D' : 'L')

  let goals = 0
  let goalsConceded = 0
  let points = 0

  if (result === 'W') {
    goals = randomInt(1, 4, baseSeed + 2)
    goalsConceded = randomInt(0, Math.max(0, goals - 1), baseSeed + 3)
    points = 3
  } else if (result === 'D') {
    goals = randomInt(0, 3, baseSeed + 4)
    goalsConceded = goals
    points = 1
  } else {
    goalsConceded = randomInt(1, 4, baseSeed + 5)
    goals = randomInt(0, Math.max(0, goalsConceded - 1), baseSeed + 6)
    points = 0
  }

  const goalDiff = goals - goalsConceded
  const xg = Math.max(0.2, goals + randomFloat(-0.45, 1.05, baseSeed + 7))
  const xgConceded = Math.max(0.2, goalsConceded + randomFloat(-0.45, 1.05, baseSeed + 8))
  const xgDiff = xg - xgConceded
  const shotsOnTarget = Math.max(goals, randomInt(goals + 1, goals + 7, baseSeed + 9))
  const shotsOnTargetConceded = Math.max(goalsConceded, randomInt(goalsConceded + 1, goalsConceded + 7, baseSeed + 10))
  const shotsOnTargetDiff = shotsOnTarget - shotsOnTargetConceded
  const xgPerShot = xg / Math.max(1, randomInt(shotsOnTarget + 2, shotsOnTarget + 10, baseSeed + 11))
  const xgPerShotConceded = xgConceded / Math.max(1, randomInt(shotsOnTargetConceded + 2, shotsOnTargetConceded + 10, baseSeed + 12))
  const xgPerShotDiff = xgPerShot - xgPerShotConceded
  const boxEntries = randomInt(8, 26, baseSeed + 13)
  const boxEntriesConceded = randomInt(6, 22, baseSeed + 14)
  const boxEntriesDiff = boxEntries - boxEntriesConceded
  const thirdFloor = randomInt(4, 14, baseSeed + 15)
  const thirdFloorOpponent = randomInt(3, 13, baseSeed + 16)
  const thirdFloorDiff = thirdFloor - thirdFloorOpponent
  const secondFloor = randomInt(8, 24, baseSeed + 17)
  const secondFloorOpponent = randomInt(7, 23, baseSeed + 18)
  const secondFloorDiff = secondFloor - secondFloorOpponent
  const possession = Math.min(70, Math.max(30, 50 + randomInt(-14, 14, baseSeed + 19) + (result === 'W' ? 4 : result === 'L' ? -4 : 0)))
  const acceleration8 = randomInt(2, 12, baseSeed + 20)
  const fiveSeconds = randomInt(3, 16, baseSeed + 21)
  const transition4 = randomInt(1, 9, baseSeed + 22)
  const oppSideRegains = randomInt(2, 11, baseSeed + 23)

  return {
    points,
    goalDiff,
    goals,
    goalsConceded,
    xg,
    xgConceded,
    xgDiff,
    shotsOnTarget,
    shotsOnTargetConceded,
    shotsOnTargetDiff,
    xgPerShot,
    xgPerShotConceded,
    xgPerShotDiff,
    boxEntries,
    boxEntriesConceded,
    boxEntriesDiff,
    thirdFloor,
    thirdFloorOpponent,
    thirdFloorDiff,
    secondFloor,
    secondFloorOpponent,
    secondFloorDiff,
    possession,
    acceleration8,
    fiveSeconds,
    transition4,
    oppSideRegains,
  }
}

function getSectionMetricValue(profile, sectionLabel) {
  if (sectionLabel === 'Points') return profile.points
  if (sectionLabel === 'Goal diff') return profile.goalDiff
  if (sectionLabel === 'Goals') return profile.goals
  if (sectionLabel === 'Goals conc.') return profile.goalsConceded
  if (sectionLabel === 'xG diff') return profile.xgDiff
  if (sectionLabel === 'xG') return profile.xg
  if (sectionLabel === 'xG conc.') return profile.xgConceded
  if (sectionLabel === 'Shots on Target Difference') return profile.shotsOnTargetDiff
  if (sectionLabel === 'Shots on Target') return profile.shotsOnTarget
  if (sectionLabel === 'Shots on Target conceded') return profile.shotsOnTargetConceded
  if (sectionLabel === 'xG / Shot Difference') return profile.xgPerShotDiff
  if (sectionLabel === 'xG / Shot') return profile.xgPerShot
  if (sectionLabel === 'xG / Shot Conceded') return profile.xgPerShotConceded
  if (sectionLabel === 'Box Entries Difference') return profile.boxEntriesDiff
  if (sectionLabel === 'Box Entries') return profile.boxEntries
  if (sectionLabel === 'Box Entries conceded') return profile.boxEntriesConceded
  if (sectionLabel === '3rd Floor Difference') return profile.thirdFloorDiff
  if (sectionLabel === '3rd Floor') return profile.thirdFloor
  if (sectionLabel === '3rd Floor Opponent') return profile.thirdFloorOpponent
  if (sectionLabel === '2nd Floor Difference') return profile.secondFloorDiff
  if (sectionLabel === '2nd Floor') return profile.secondFloor
  if (sectionLabel === '2nd Floor Opponent') return profile.secondFloorOpponent
  if (sectionLabel === 'Possession') return profile.possession
  if (sectionLabel === '8 Seconds Acceleration') return profile.acceleration8
  if (sectionLabel === '5 Seconds') return profile.fiveSeconds
  if (sectionLabel === '4 sec Transition+') return profile.transition4
  if (sectionLabel === 'Opp. Side Regains') return profile.oppSideRegains
  return 0
}

function getColumnMetricValue(profile, columnLabel) {
  if (columnLabel === 'Points') return profile.points
  if (columnLabel === 'Goal Difference') return profile.goalDiff
  if (columnLabel === 'Goals') return profile.goals
  if (columnLabel === 'Goals Conceded') return profile.goalsConceded
  if (columnLabel === 'xG Difference') return profile.xgDiff
  if (columnLabel === 'xG') return profile.xg
  if (columnLabel === 'xG Conceded') return profile.xgConceded
  if (columnLabel === 'Shots on Target Difference') return profile.shotsOnTargetDiff
  if (columnLabel === 'Shots on Target') return profile.shotsOnTarget
  if (columnLabel === 'Shots on Target conceded') return profile.shotsOnTargetConceded
  if (columnLabel === 'xG / Shot Difference') return profile.xgPerShotDiff
  if (columnLabel === 'xG / Shot') return profile.xgPerShot
  if (columnLabel === 'xG / Shot Conceded') return profile.xgPerShotConceded
  if (columnLabel === 'Box Entries Difference') return profile.boxEntriesDiff
  if (columnLabel === 'Box Entries') return profile.boxEntries
  if (columnLabel === 'Box Entries conceded') return profile.boxEntriesConceded
  if (columnLabel === '3rd Floor Difference') return profile.thirdFloorDiff
  if (columnLabel === '3rd Floor') return profile.thirdFloor
  if (columnLabel === '3rd Floor Opponent') return profile.thirdFloorOpponent
  if (columnLabel === '2nd Floor Difference') return profile.secondFloorDiff
  if (columnLabel === '2nd Floor') return profile.secondFloor
  if (columnLabel === '2nd Floor Opponent') return profile.secondFloorOpponent
  if (columnLabel === 'Possession') return profile.possession
  if (columnLabel === '8 Seconds Acceleration') return profile.acceleration8
  if (columnLabel === '5 Seconds') return profile.fiveSeconds
  if (columnLabel === '4 sec Transition+') return profile.transition4
  if (columnLabel === 'Opp. Side Regains') return profile.oppSideRegains
  return 0
}

function formatSectionMetric(sectionLabel, value) {
  if (sectionLabel === 'Possession') {
    return `${value.toFixed(1)}%`
  }
  if (sectionLabel === 'xG diff' || sectionLabel === 'xG' || sectionLabel === 'xG conc.' || sectionLabel.includes('xG / Shot')) {
    return value.toFixed(2)
  }
  return `${Math.round(value)}`
}

function formatColumnMetric(columnLabel, value) {
  if (columnLabel === 'Possession') return `${value.toFixed(1)}%`
  if (columnLabel.includes('xG / Shot') || columnLabel.includes('xG')) return Number(value).toFixed(2)
  return `${Math.round(value)}`
}

function pearsonCorrelation(valuesX, valuesY) {
  const n = Math.min(valuesX.length, valuesY.length)
  if (n < 2) return 0

  const meanX = valuesX.reduce((sum, value) => sum + value, 0) / n
  const meanY = valuesY.reduce((sum, value) => sum + value, 0) / n

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < n; i += 1) {
    const dx = valuesX[i] - meanX
    const dy = valuesY[i] - meanY
    numerator += dx * dy
    sumSqX += dx * dx
    sumSqY += dy * dy
  }

  if (sumSqX <= 0 || sumSqY <= 0) return 0
  return numerator / Math.sqrt(sumSqX * sumSqY)
}

function logGamma(z) {
  const coeffs = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  }

  let x = 0.9999999999998099
  const shifted = z - 1
  for (let i = 0; i < coeffs.length; i += 1) {
    x += coeffs[i] / (shifted + i + 1)
  }
  const t = shifted + coeffs.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x)
}

function studentTPdf(value, degreesOfFreedom) {
  const v = degreesOfFreedom
  const logCoeff = logGamma((v + 1) / 2) - logGamma(v / 2) - 0.5 * Math.log(v * Math.PI)
  const logShape = -((v + 1) / 2) * Math.log(1 + (value * value) / v)
  return Math.exp(logCoeff + logShape)
}

function simpsonIntegrate(fn, start, end, steps = 800) {
  const safeSteps = steps % 2 === 0 ? steps : steps + 1
  const h = (end - start) / safeSteps
  let sum = fn(start) + fn(end)

  for (let i = 1; i < safeSteps; i += 1) {
    const x = start + i * h
    sum += (i % 2 === 0 ? 2 : 4) * fn(x)
  }

  return (h / 3) * sum
}

function studentTCdf(value, degreesOfFreedom) {
  if (value === 0) return 0.5
  const absValue = Math.abs(value)
  const area = simpsonIntegrate(x => studentTPdf(x, degreesOfFreedom), 0, absValue)
  const cdf = value > 0 ? 0.5 + area : 0.5 - area
  return Math.max(0, Math.min(1, cdf))
}

function correlationStats(valuesX, valuesY) {
  const n = Math.min(valuesX.length, valuesY.length)
  if (n < 3) return { r: 0, t: 0, p: 1 }

  const rawR = pearsonCorrelation(valuesX, valuesY)
  const r = Math.max(-0.999999, Math.min(0.999999, rawR))
  const df = n - 2
  const t = r * Math.sqrt(df / Math.max(1e-12, 1 - (r * r)))
  const p = 2 * (1 - studentTCdf(Math.abs(t), df))

  return {
    r,
    t,
    p: Math.max(0, Math.min(1, p)),
  }
}

function formatStat(statKey, value) {
  if (!Number.isFinite(value)) return 'n/a'
  if (statKey === 'p') {
    if (value < 0.001) return '<0.001'
    return value.toFixed(3)
  }
  return value.toFixed(2)
}

function getMatchingColumnForSection(sectionLabel) {
  const mapping = {
    'Points': 'Points',
    'Goal diff': 'Goal Difference',
    'Goals': 'Goals',
    'Goals conc.': 'Goals Conceded',
    'xG diff': 'xG Difference',
    'xG': 'xG',
    'xG conc.': 'xG Conceded',
    'Shots on Target Difference': 'Shots on Target Difference',
    'Shots on Target': 'Shots on Target',
    'Shots on Target conceded': 'Shots on Target conceded',
    'xG / Shot Difference': 'xG / Shot Difference',
    'xG / Shot': 'xG / Shot',
    'xG / Shot Conceded': 'xG / Shot Conceded',
    'Box Entries Difference': 'Box Entries Difference',
    'Box Entries': 'Box Entries',
    'Box Entries conceded': 'Box Entries conceded',
    '3rd Floor Difference': '3rd Floor Difference',
    '3rd Floor': '3rd Floor',
    '3rd Floor Opponent': '3rd Floor Opponent',
    '2nd Floor Difference': '2nd Floor Difference',
    '2nd Floor': '2nd Floor',
    '2nd Floor Opponent': '2nd Floor Opponent',
    'Possession': 'Possession',
    '8 Seconds Acceleration': '8 Seconds Acceleration',
    '5 Seconds': '5 Seconds',
    '4 sec Transition+': '4 sec Transition+',
    'Opp. Side Regains': 'Opp. Side Regains',
  }
  return mapping[sectionLabel] || ''
}

function getHeatClass(value, statKey) {
  if (value === 'X') return 'season-heat-x'
  if (value === 'n/a') return 'season-heat-na'

  let numericValue = Number(value)
  if (typeof value === 'string' && value.startsWith('<')) {
    numericValue = Number(value.slice(1))
  }
  if (!Number.isFinite(numericValue)) return 'season-heat-na'

  if (statKey === 'p') {
    if (numericValue <= 0.01) return 'season-heat-5'
    if (numericValue <= 0.05) return 'season-heat-4'
    if (numericValue <= 0.1) return 'season-heat-3'
    if (numericValue <= 0.2) return 'season-heat-2'
    return 'season-heat-1'
  }

  const magnitude = Math.abs(numericValue)
  if (magnitude >= 0.7 || (statKey === 't' && magnitude >= 3)) return 'season-heat-5'
  if (magnitude >= 0.5 || (statKey === 't' && magnitude >= 2)) return 'season-heat-4'
  if (magnitude >= 0.3 || (statKey === 't' && magnitude >= 1.3)) return 'season-heat-3'
  if (magnitude >= 0.15 || (statKey === 't' && magnitude >= 0.8)) return 'season-heat-2'
  return 'season-heat-1'
}

function ModuleCard({ title, to }) {
  return (
    <Link to={to} className="module-card">
      <h3>{title}</h3>
    </Link>
  )
}

function ModulesPage() {
  return (
    <div className="app">
      <header className="home-header">
        <h1 className="home-title-row">
          <img className="home-title-logo" src="/images/gnistanlogo.png" alt="Gnistan logo" />
          <span>Gnistan Analytics</span>
          <img className="home-title-logo" src="/images/gnistanlogo.png" alt="Gnistan logo" />
        </h1>
      </header>

      <section className="panel">
        <div className="module-grid">
          <ModuleCard title="Create a match" to="/create" />
          <ModuleCard title="Analyze previous matches" to="/matches" />
          <ModuleCard title="Season report" to="/season" />
          <ModuleCard title="Placeholder module 2" to="/placeholder/2" />
        </div>
      </section>
    </div>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div className="app">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1>{title}</h1>
          </div>
          <Link className="manual-button" to="/">Back to modules</Link>
        </div>
      </header>

      <section className="panel">
        <p>We are saving this space for future module work. Return to the modules page when you are ready.</p>
      </section>
    </div>
  )
}

function SeasonSection({ sectionKey, label, expanded, onToggle, roundRows, rValues, tValues, pValues, columnLabels }) {
  function renderCell(value, index, rowLabel, keyPrefix, split = false, statKey = null) {
    const columnLabel = columnLabels[index + 1] ?? ''
    const primaryValue = typeof value === 'object' && value !== null ? value.primary : value
    const secondaryValue = typeof value === 'object' && value !== null ? value.secondary : ''
    const heatClass = statKey ? getHeatClass(value, statKey) : ''

    if (split) {
      return (
        <td
          key={`${keyPrefix}-${index}`}
          className="season-hover-cell season-split-cell"
          data-bubble={`${rowLabel} / ${columnLabel}`}
        >
          <div className="season-cell-split">
            <span>{primaryValue}</span>
            <span>{secondaryValue}</span>
          </div>
        </td>
      )
    }

    return (
      <td
        key={`${keyPrefix}-${index}`}
        className={`season-hover-cell ${heatClass}`.trim()}
        data-bubble={`${rowLabel} / ${columnLabel}`}
      >
        {value}
      </td>
    )
  }

  return (
    <>
      {expanded && roundRows.map(row => (
        <tr key={`${sectionKey}-${row.label}`}>
          <th scope="row">{row.label}</th>
          {row.values.slice(1).map((value, index) => renderCell(value, index, label, `${sectionKey}-${row.label}`, true))}
        </tr>
      ))}
      <tr className="season-summary-row season-summary-row-r">
        <th scope="row">
          <button
            type="button"
            className="season-total-toggle"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${label} rounds` : `Expand ${label} rounds`}
          >
            <span className={expanded ? 'season-total-arrow season-total-arrow-open' : 'season-total-arrow'}>▸</span>
            <span>{`${label} r`}</span>
          </button>
        </th>
        {rValues.slice(1).map((value, index) => renderCell(value, index, `r: ${label}`, `${sectionKey}-r`, false, 'r'))}
      </tr>
      <tr className="season-summary-row season-summary-row-t">
        <th scope="row">{`${label} t`}</th>
        {tValues.slice(1).map((value, index) => renderCell(value, index, `t: ${label}`, `${sectionKey}-t`, false, 't'))}
      </tr>
      <tr className="season-summary-row season-summary-row-p">
        <th scope="row">{`${label} p`}</th>
        {pValues.slice(1).map((value, index) => renderCell(value, index, `p: ${label}`, `${sectionKey}-p`, false, 'p'))}
      </tr>
    </>
  )
}

function SeasonPage() {
  const [expandedSections, setExpandedSections] = useState(() => Object.fromEntries(
    seasonSectionConfigs.map(section => [section.sectionKey, false])
  ))

  const sectionLabels = seasonSectionConfigs.map(section => section.label)

  const roundProfiles = seasonTableRows.map((row, index) => ({
    label: row.label,
    profile: createRoundProfile(index),
  }))

  const buildSectionRoundRows = sectionLabel => roundProfiles.map(round => ({
    label: round.label,
    values: seasonTableColumns.map((columnLabel, colIndex) => {
      if (colIndex === 0) {
        return { primary: round.label, secondary: '' }
      }
      const leftValue = getSectionMetricValue(round.profile, sectionLabel)
      const rightValue = getColumnMetricValue(round.profile, columnLabel)
      return {
        primary: formatSectionMetric(sectionLabel, leftValue),
        secondary: formatColumnMetric(columnLabel, rightValue),
      }
    }),
  }))

  const sectionStats = Object.fromEntries(sectionLabels.map(sectionLabel => {
    const xValues = roundProfiles.map(round => getSectionMetricValue(round.profile, sectionLabel))
    const valuesByColumn = seasonTableColumns.map((columnLabel, colIndex) => {
      if (colIndex === 0) return { r: 0, t: 0, p: 1 }
      const yValues = roundProfiles.map(round => getColumnMetricValue(round.profile, columnLabel))
      return correlationStats(xValues, yValues)
    })
    return [sectionLabel, valuesByColumn]
  }))

  const statRowValues = (sectionLabel, statKey) => seasonTableColumns.map((_, colIndex) => {
    if (colIndex === 0) return `${sectionLabel} ${statKey}`
    const columnLabel = seasonTableColumns[colIndex]
    if (columnLabel === getMatchingColumnForSection(sectionLabel)) return 'X'
    const stats = sectionStats[sectionLabel]?.[colIndex]
    if (!stats) return 'n/a'
    return formatStat(statKey, stats[statKey])
  })

  const toggleSection = key => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const roundRowsByLabel = Object.fromEntries(sectionLabels.map(label => [label, buildSectionRoundRows(label)]))

  const seasonSections = seasonSectionConfigs.map(section => ({
    sectionKey: section.sectionKey,
    label: section.label,
    expanded: expandedSections[section.sectionKey],
    onToggle: () => toggleSection(section.sectionKey),
    roundRows: roundRowsByLabel[section.label],
    rValues: statRowValues(section.label, 'r'),
    tValues: statRowValues(section.label, 't'),
    pValues: statRowValues(section.label, 'p'),
  }))

  return (
    <div className="app season-page">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1>Season report</h1>
          </div>
          <Link className="manual-button" to="/">Back to modules</Link>
        </div>
      </header>

      <section className="panel">
        <div className="season-table-wrapper">
          <table className="season-table">
            <thead>
              <tr>
                {seasonTableColumns.map(column => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasonSections.map(section => (
                <SeasonSection
                  key={section.sectionKey}
                  sectionKey={section.sectionKey}
                  label={section.label}
                  expanded={section.expanded}
                  onToggle={section.onToggle}
                  roundRows={section.roundRows}
                  rValues={section.rValues}
                  tValues={section.tValues}
                  pValues={section.pValues}
                  columnLabels={seasonTableColumns}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AnalyzeMatches() {
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [activeTab, setActiveTab] = useState('Summary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualPopupOpen, setManualPopupOpen] = useState(false)
  const [manualAction, setManualAction] = useState({ half: '1st', time: '00:00' })
  const [xgModalOpen, setXgModalOpen] = useState(false)
  const [pendingXgAction, setPendingXgAction] = useState(null)
  const [xgValue, setXgValue] = useState('0.00')
  const [coordValue, setCoordValue] = useState('')
  const [markerRaw, setMarkerRaw] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSetPiece, setIsSetPiece] = useState(false)
  const [isGoal, setIsGoal] = useState(false)
  const imgRef = useRef(null)

  function getActionXg(action) {
    const value = Number.parseFloat(action?.detail)
    if (!Number.isFinite(value)) return null
    if (!shotActions.has(action.action) && !xgActions.has(action.action)) return null
    return value
  }

  function summarizeTeam(actions, team) {
    const teamActions = actions.filter(a => a.team === team)
    const goals = teamActions.filter(a => a.goal === true).length
    const shots = teamActions.filter(a => shotActions.has(a.action)).length
    const shotsOnTarget = teamActions.filter(a => a.action === 'Shot on target').length
    const xg = teamActions.reduce((sum, action) => {
      const value = getActionXg(action)
      return value === null ? sum : sum + value
    }, 0)
    const xgOpenPlay = teamActions.reduce((sum, action) => {
      const value = getActionXg(action)
      if (value === null || action.sp === true) return sum
      return sum + value
    }, 0)
    const xgSetPieces = teamActions.reduce((sum, action) => {
      const value = getActionXg(action)
      if (value === null || action.sp !== true) return sum
      return sum + value
    }, 0)
    const boxEntriesOpenPlay = teamActions.filter(a => a.action === 'Box entry (Open play)').length
    const boxEntriesSetPieces = teamActions.filter(a => a.action === 'Box entry (SP)').length
    const boxEntries = boxEntriesOpenPlay + boxEntriesSetPieces
    const thirdFloorSuccess = teamActions.filter(a => a.action === '3rd Floor+').length
    const secondFloor = teamActions.filter(a => a.action === '2nd Left' || a.action === '2nd Middle' || a.action === '2nd Right').length
    const oppSideRegains = teamActions.filter(a => a.action === 'Opp side regain').length
    const transitionSuccess = teamActions.filter(a => a.action === '5s transition (Success)').length
    const transitionFail = teamActions.filter(a => a.action === '5s transition (Fail)').length
    const transitionTotal = transitionSuccess + transitionFail
    const transitionSuccessPct = transitionTotal > 0 ? (transitionSuccess / transitionTotal) * 100 : 0

    return {
      goals,
      xg,
      xgOpenPlay,
      xgSetPieces,
      shots,
      shotsOnTarget,
      xgPerShot: shots > 0 ? xg / shots : 0,
      boxEntries,
      boxEntriesOpenPlay,
      boxEntriesSetPieces,
      thirdFloorSuccess,
      secondFloor,
      oppSideRegains,
      transitionSuccess,
      transitionSuccessPct,
    }
  }

  function formatXg(value) {
    return value.toFixed(2)
  }

  function parseCoord(coord) {
    if (!coord || typeof coord !== 'string') return null
    const [rawX, rawY] = coord.split(',')
    const x = Number.parseFloat(rawX)
    const y = Number.parseFloat(rawY)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    }
  }

  const selectedActions = selectedMatch?.actions ?? []
  const reportCoordMarkers = selectedActions
    .map(action => {
      const parsed = parseCoord(action.coord)
      if (!parsed) return null
      return {
        id: action.id,
        team: action.team,
        isOffTarget: action.action === 'Shot off target',
        x: parsed.x,
        y: parsed.y,
      }
    })
    .filter(Boolean)
  const homeSummary = summarizeTeam(selectedActions, 'Home')
  const awaySummary = summarizeTeam(selectedActions, 'Away')
  const homeShotsOffTarget = Math.max(0, homeSummary.shots - homeSummary.shotsOnTarget)
  const awayShotsOffTarget = Math.max(0, awaySummary.shots - awaySummary.shotsOnTarget)
  const homeThirdUnder8 = {
    boxEntry: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd <8s Box').length,
    control: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd <8s Control').length,
    loss: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd <8s Loss').length,
  }
  const homeThirdOver8 = {
    boxEntry: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd >8s Box').length,
    control: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd >8s Control').length,
    loss: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd >8s Loss').length,
  }
  const homeSecondFloor = {
    left: selectedActions.filter(a => a.team === 'Home' && a.action === '2nd Left').length,
    middle: selectedActions.filter(a => a.team === 'Home' && a.action === '2nd Middle').length,
    right: selectedActions.filter(a => a.team === 'Home' && a.action === '2nd Right').length,
  }
  const homeThirdFloor = {
    success: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd Floor+').length,
    fail: selectedActions.filter(a => a.team === 'Home' && a.action === '3rd Floor-').length,
  }

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch(apiUrl('/api/matches'))
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load matches')
        }
        const data = await response.json()
        setMatches(data)
      } catch (err) {
        console.error(err)
        setError(`Unable to load matches: ${err.message}`)
      }
    }
    fetchMatches()
  }, [])

  function formatMatchOptionDateTime(dateValue, timeValue) {
    if (!dateValue && !timeValue) return ''

    const rawDate = dateValue ? String(dateValue) : ''
    const rawTime = timeValue ? String(timeValue) : ''

    const datePart = rawDate ? rawDate.slice(0, 10) : ''
    let timePart = ''

    if (rawTime) {
      const cleaned = rawTime.replace('Z', '').split('T').pop() || ''
      const [hh = '00', mm = '00'] = cleaned.split(':')
      timePart = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
    } else if (rawDate.includes('T')) {
      const timeFromDate = rawDate.split('T')[1] || ''
      const cleaned = timeFromDate.replace('Z', '')
      const [hh = '00', mm = '00'] = cleaned.split(':')
      timePart = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
    }

    if (datePart && timePart) return `${datePart} ${timePart}`
    if (datePart) return datePart
    return timePart
  }

  async function loadSelectedMatch(matchId) {
    if (!matchId) {
      setSelectedMatch(null)
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl(`/api/matches/${matchId}`))
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to load match')
      }
      const data = await response.json()
      setSelectedMatch(data)
      setActiveTab('Summary')
    } catch (err) {
      console.error(err)
      setError('Unable to load selected match')
      setSelectedMatch(null)
    } finally {
      setLoading(false)
    }
  }

  function openManualForm(){
    setManualAction({ half: '1st', time: '00:00' })
    setManualPopupOpen(true)
  }

  async function saveSelectedMatchAction(actionData) {
    if (!selectedMatch) return
    try {
      const response = await fetch(apiUrl(`/api/matches/${selectedMatch.id}/actions`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to save action')
      }
      const savedAction = await response.json()
      setSelectedMatch(prev => prev ? { ...prev, actions: [...prev.actions, savedAction] } : prev)
      return savedAction
    } catch (err) {
      console.error(err)
      setError('Unable to save action')
      return null
    }
  }

  async function deleteSelectedMatchAction(actionId) {
    if (!selectedMatch) return
    try {
      const response = await fetch(apiUrl(`/api/actions/${actionId}`), {
        method: 'DELETE',
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to delete action')
      }
      setSelectedMatch(prev => prev ? { ...prev, actions: prev.actions.filter(a => a.id !== actionId) } : prev)
    } catch (err) {
      console.error(err)
      setError('Unable to delete action')
    }
  }

  function renderManualActionSide(teamName, team) {
    return (
      <div>
        <div className="action-button-layout" style={{ alignItems: team === 'Away' ? 'flex-end' : 'flex-start' }}>
          {actionButtonRows.map((row, rowIndex) => (
            <div key={rowIndex} className="button-row" style={{ justifyContent: team === 'Away' ? 'flex-end' : 'flex-start', marginBottom: rowIndex === actionButtonRows.length - 1 ? 0 : 10 }}>
              {row.map(b => (
                shotActions.has(b) || xgActions.has(b)
                  ? <button key={`${team}-${b}`} onClick={() => openXgModal(team, b)}>{b}</button>
                  : <button key={`${team}-${b}`} onClick={async () => {
                      await saveSelectedMatchAction({
                        half: manualAction.half,
                        time: manualAction.time,
                        team,
                        action: b,
                        detail: null,
                        coord: null,
                        sp: false,
                        goal: false,
                      })
                    }}>{b}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function openXgModal(team, label) {
    setPendingXgAction({ team, label })
    setXgValue('0.00')
    setCoordValue('')
    setMarkerRaw(null)
    setIsSetPiece(false)
    setIsGoal(false)
    setXgModalOpen(true)
  }

  function closeXgModal() {
    setPendingXgAction(null)
    setXgModalOpen(false)
  }

  async function confirmXg() {
    if (!pendingXgAction || !selectedMatch) return
    const coord = coordValue || (markerRaw ? `${(isFlipped ? (100 - markerRaw.x) : markerRaw.x).toFixed(2)},${(isFlipped ? (100 - markerRaw.y) : markerRaw.y).toFixed(2)}` : null)
    const isShot = shotActions.has(pendingXgAction.label)
    const setPieceValue = xgActions.has(pendingXgAction.label) ? true : (isShot ? isSetPiece : false)
    const goalValue = isShot && pendingXgAction.label === 'Shot on target' ? isGoal : false
    await saveSelectedMatchAction({
      half: manualAction.half,
      time: manualAction.time,
      team: pendingXgAction.team,
      action: pendingXgAction.label,
      detail: xgValue,
      coord,
      sp: setPieceValue,
      goal: goalValue,
    })
    closeXgModal()
  }

  return (
    <div className="app">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1>Analyze previous matches</h1>
          </div>
          <Link className="manual-button" to="/">Back to modules</Link>
        </div>
      </header>

      <section className="panel">
        <div className="manual-form" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <label className="match-select-label">
            Choose match
            <select className="time-input match-select-input" value={selectedMatchId} onChange={e => {
              const value = e.target.value
              setSelectedMatchId(value)
              loadSelectedMatch(value)
            }}>
              <option value="">-- Select a match --</option>
              {matches.map(match => (
                <option key={match.id} value={match.id}>
                  {match.homeTeam} vs {match.awayTeam} {formatMatchOptionDateTime(match.matchDate, match.matchTime) ? `(${formatMatchOptionDateTime(match.matchDate, match.matchTime)})` : ''}
                </option>
              ))}
            </select>
          </label>
          {loading && <p className="small-text">Loading match...</p>}
          {error && <p className="small-text" style={{ color: '#dc2626' }}>{error}</p>}
        </div>

        {selectedMatch && (
          <>
            <div style={{ marginBottom: '18px' }}>
              <h3>{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</h3>
              <p className="small-text">{selectedMatch.venue} · {formatMatchOptionDateTime(selectedMatch.matchDate, selectedMatch.matchTime) || 'No date/time'}</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {['Summary', 'Report', 'Actions'].map(tab => (
                <button
                  key={tab}
                  className={activeTab === tab ? 'manual-button active-tab' : 'manual-button'}
                  onClick={() => setActiveTab(tab)}
                  style={{ background: activeTab === tab ? '#2563eb' : 'white', color: activeTab === tab ? 'white' : '#2563eb' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Summary' && (
              <div className="list-card">
                <table className="action-table summary-table">
                  <thead>
                    <tr>
                      <th>{selectedMatch.homeTeam}</th>
                      <th></th>
                      <th>{selectedMatch.awayTeam}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="summary-main-row"><td>{homeSummary.goals}</td><td style={{ textAlign: 'center' }}>Goals</td><td>{awaySummary.goals}</td></tr>
                    <tr className="summary-main-row"><td>{formatXg(homeSummary.xg)}</td><td style={{ textAlign: 'center' }}>xG</td><td>{formatXg(awaySummary.xg)}</td></tr>
                    <tr className="summary-sub-row"><td>{formatXg(homeSummary.xgOpenPlay)}</td><td style={{ textAlign: 'center' }}>xG (Open play)</td><td>{formatXg(awaySummary.xgOpenPlay)}</td></tr>
                    <tr className="summary-sub-row"><td>{formatXg(homeSummary.xgSetPieces)}</td><td style={{ textAlign: 'center' }}>xG (Set pieces)</td><td>{formatXg(awaySummary.xgSetPieces)}</td></tr>
                    <tr className="summary-main-row"><td>{homeSummary.shots}</td><td style={{ textAlign: 'center' }}>Shots</td><td>{awaySummary.shots}</td></tr>
                    <tr className="summary-sub-row"><td>{homeSummary.shotsOnTarget}</td><td style={{ textAlign: 'center' }}>Shots (On target)</td><td>{awaySummary.shotsOnTarget}</td></tr>
                    <tr className="summary-sub-row"><td>{homeShotsOffTarget}</td><td style={{ textAlign: 'center' }}>Shots (Off target)</td><td>{awayShotsOffTarget}</td></tr>
                    <tr className="summary-sub-row"><td>{formatXg(homeSummary.xgPerShot)}</td><td style={{ textAlign: 'center' }}>xG/Shot</td><td>{formatXg(awaySummary.xgPerShot)}</td></tr>
                    <tr className="summary-main-row"><td>{homeSummary.boxEntries}</td><td style={{ textAlign: 'center' }}>Box entries</td><td>{awaySummary.boxEntries}</td></tr>
                    <tr className="summary-sub-row"><td>{homeSummary.boxEntriesOpenPlay}</td><td style={{ textAlign: 'center' }}>Box entries (Open play)</td><td>{awaySummary.boxEntriesOpenPlay}</td></tr>
                    <tr className="summary-sub-row"><td>{homeSummary.boxEntriesSetPieces}</td><td style={{ textAlign: 'center' }}>Box entries (Set pieces)</td><td>{awaySummary.boxEntriesSetPieces}</td></tr>
                    <tr><td>{homeSummary.thirdFloorSuccess}</td><td style={{ textAlign: 'center' }}>3rd floor (Success)</td><td>{awaySummary.thirdFloorSuccess}</td></tr>
                    <tr><td>{homeSummary.secondFloor}</td><td style={{ textAlign: 'center' }}>2nd floor</td><td>{awaySummary.secondFloor}</td></tr>
                    <tr><td>{homeSummary.oppSideRegains}</td><td style={{ textAlign: 'center' }}>Opp. side regains</td><td>{awaySummary.oppSideRegains}</td></tr>
                    <tr><td>{homeSummary.transitionSuccess}</td><td style={{ textAlign: 'center' }}>5s transition - Press regains</td><td>{awaySummary.transitionSuccess}</td></tr>
                    <tr><td>{homeSummary.transitionSuccessPct.toFixed(1)}%</td><td style={{ textAlign: 'center' }}>5s transition - Success-%</td><td>{awaySummary.transitionSuccessPct.toFixed(1)}%</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'Report' && (
              <div className="list-card">
                <h4>Match report</h4>
                <div className="report-layout">
                  <div className="report-pitch-card">
                    <div className="report-halfpitch-pair" aria-label="Two half pitches for 8 second attack view">
                      <div className="report-halfpitch-item">
                        <div className="report-halfpitch-label">Final third attacks under 8s</div>
                        <div className="report-halfpitch-box-entry">
                          <div className="report-halfpitch-box-entry-title">Box entry</div>
                          <div className="report-halfpitch-box-entry-value">{homeThirdUnder8.boxEntry}</div>
                        </div>
                        <div className="report-halfpitch-tall-box">
                          <div className="report-halfpitch-tall-box-title">Control</div>
                          <div className="report-halfpitch-tall-box-value">{homeThirdUnder8.control}</div>
                        </div>
                        <div className="report-halfpitch-loss-box">Loss of possession: {homeThirdUnder8.loss}</div>
                        <div className="report-halfpitch-reserved-space" aria-hidden="true" />
                        <img className="report-halfpitch-image" src="/images/halfpitch.png" alt="Half pitch left" />
                      </div>
                      <div className="report-halfpitch-item">
                        <div className="report-halfpitch-label">Final third attacks above 8s</div>
                        <div className="report-halfpitch-box-entry">
                          <div className="report-halfpitch-box-entry-title">Box entry</div>
                          <div className="report-halfpitch-box-entry-value">{homeThirdOver8.boxEntry}</div>
                        </div>
                        <div className="report-halfpitch-tall-box">
                          <div className="report-halfpitch-tall-box-title">Control</div>
                          <div className="report-halfpitch-tall-box-value">{homeThirdOver8.control}</div>
                        </div>
                        <div className="report-halfpitch-loss-box">Loss of possession: {homeThirdOver8.loss}</div>
                        <div className="report-halfpitch-reserved-space" aria-hidden="true" />
                        <img className="report-halfpitch-image" src="/images/halfpitch.png" alt="Half pitch right" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <table className="action-table report-table">
                      <thead>
                        <tr><th>{selectedMatch.homeTeam}</th><th></th></tr>
                      </thead>
                      <tbody>
                        <tr className="report-section-row"><td colSpan={2}>Final third attacks under 8s</td></tr>
                        <tr><td>Box entry</td><td>{homeThirdUnder8.boxEntry}</td></tr>
                        <tr><td>Control</td><td>{homeThirdUnder8.control}</td></tr>
                        <tr><td>Loss of possession</td><td>{homeThirdUnder8.loss}</td></tr>
                        <tr className="report-section-row"><td colSpan={2}>Final third attacks above 8s</td></tr>
                        <tr><td>Box entry</td><td>{homeThirdOver8.boxEntry}</td></tr>
                        <tr><td>Control</td><td>{homeThirdOver8.control}</td></tr>
                        <tr><td>Loss of possession</td><td>{homeThirdOver8.loss}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="report-layout report-block-spacing">
                  <div className="report-pitch-card report-pitch-card-with-arrows">
                    <img className="report-pitch-image" src="/images/pitch.png" alt="Pitch" />
                    <div className="report-arrow-stack" aria-label="2nd floor directional arrows">
                      <div className="report-left-arrow">
                        <span>2nd Floor Right: {homeSecondFloor.right}</span>
                      </div>
                      <div className="report-left-arrow">
                        <span>2nd Floor Middle: {homeSecondFloor.middle}</span>
                      </div>
                      <div className="report-left-arrow">
                        <span>2nd Floor Left: {homeSecondFloor.left}</span>
                      </div>
                    </div>
                    <div className="report-third-floor-arrow" aria-label="3rd floor success ratio">
                      <span>3rd Floor Success: {homeThirdFloor.success}/{homeThirdFloor.success + homeThirdFloor.fail}</span>
                    </div>
                  </div>
                  <div>
                    <table className="action-table report-table">
                      <thead>
                        <tr><th>{selectedMatch.homeTeam}</th><th></th></tr>
                      </thead>
                      <tbody>
                        <tr className="report-section-row"><td colSpan={2}>2nd Floor</td></tr>
                        <tr><td>2nd Floor Left</td><td>{homeSecondFloor.left}</td></tr>
                        <tr><td>2nd Floor Middle</td><td>{homeSecondFloor.middle}</td></tr>
                        <tr><td>2nd Floor Right</td><td>{homeSecondFloor.right}</td></tr>
                        <tr className="report-section-row"><td colSpan={2}>3rd Floor</td></tr>
                        <tr><td>3rd Floor Success</td><td>{homeThirdFloor.success}</td></tr>
                        <tr><td>3rd Floor Fail</td><td>{homeThirdFloor.fail}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="report-layout report-block-spacing">
                  <div className="report-pitch-card">
                    <div className="report-pitch-marker-layer">
                      <img className="report-pitch-image" src="/images/pitch.png" alt="Shots and xG pitch" />
                      {reportCoordMarkers.map(marker => (
                        <div
                          key={marker.id}
                          className={[
                            'report-marker',
                            marker.team === 'Home' ? 'report-marker-home' : 'report-marker-away',
                            marker.isOffTarget ? 'report-marker-offtarget' : '',
                          ].filter(Boolean).join(' ')}
                          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                          title={`${marker.team}: ${marker.x.toFixed(2)},${marker.y.toFixed(2)}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <table className="action-table report-table report-comparison-table">
                      <thead>
                        <tr><th>{selectedMatch.homeTeam}</th><th style={{ textAlign: 'center' }}></th><th style={{ textAlign: 'right' }}>{selectedMatch.awayTeam}</th></tr>
                      </thead>
                      <tbody>
                        <tr className="report-section-row"><td colSpan={3} style={{ textAlign: 'center' }}>Shots</td></tr>
                        <tr><td>{homeSummary.shotsOnTarget}</td><td>Shots on target</td><td style={{ textAlign: 'right' }}>{awaySummary.shotsOnTarget}</td></tr>
                        <tr><td>{homeShotsOffTarget}</td><td>Shots off target</td><td style={{ textAlign: 'right' }}>{awayShotsOffTarget}</td></tr>
                        <tr><td>{formatXg(homeSummary.xg)}</td><td>xG</td><td style={{ textAlign: 'right' }}>{formatXg(awaySummary.xg)}</td></tr>
                        <tr><td>{formatXg(homeSummary.xgOpenPlay)}</td><td>xG (Open play)</td><td style={{ textAlign: 'right' }}>{formatXg(awaySummary.xgOpenPlay)}</td></tr>
                        <tr><td>{formatXg(homeSummary.xgSetPieces)}</td><td>xG (Set pieces)</td><td style={{ textAlign: 'right' }}>{formatXg(awaySummary.xgSetPieces)}</td></tr>
                        <tr><td>{formatXg(homeSummary.xgPerShot)}</td><td>xG/Shot</td><td style={{ textAlign: 'right' }}>{formatXg(awaySummary.xgPerShot)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Actions' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <button className="manual-button" onClick={openManualForm}>Create action manually</button>
                </div>
                {manualPopupOpen && (
                  <div className="fullscreen-overlay">
                    <div className="fullscreen-panel">
                      <div className="fullscreen-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>Manual action popup</h3>
                          <p className="small-text" style={{ margin: '6px 0 0' }}>Choose half and time, then tap an action button.</p>
                        </div>
                        <button className="popup-close-button" onClick={() => setManualPopupOpen(false)}>Close</button>
                      </div>
                      <div className="manual-popup-controls">
                        <div className="manual-form-field">
                          <label>Half</label>
                          <div className="half-radio-group">
                            <label><input type="radio" name="manualHalf" value="1st" checked={manualAction.half === '1st'} onChange={e=>setManualAction({...manualAction,half:e.target.value})} /> 1st</label>
                            <label><input type="radio" name="manualHalf" value="2nd" checked={manualAction.half === '2nd'} onChange={e=>setManualAction({...manualAction,half:e.target.value})} /> 2nd</label>
                          </div>
                        </div>
                        <div className="manual-form-field">
                          <label>Time</label>
                          <input value={manualAction.time} onChange={e=>setManualAction({...manualAction,time:e.target.value})} />
                        </div>
                      </div>
                      <div className="fullscreen-label-row">
                        <div className="fullscreen-team-label">{selectedMatch.homeTeam}</div>
                        <div className="fullscreen-team-label">{selectedMatch.awayTeam}</div>
                      </div>
                      <div className="fullscreen-actions-panel">
                        {renderManualActionSide(selectedMatch.homeTeam, 'Home')}
                        {renderManualActionSide(selectedMatch.awayTeam, 'Away')}
                      </div>
                    </div>
                  </div>
                )}
                {xgModalOpen && (
                  <div className="popup-modal">
                    <div className="popup-modal-content">
                      <h3 style={{ marginTop: 0 }}>Enter details</h3>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 180 }}>
                          xG value
                          <input value={xgValue} onChange={e=>setXgValue(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 6 }} />
                        </label>
                        {pendingXgAction && shotActions.has(pendingXgAction.label) && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="manual-button"
                              style={{ background: isSetPiece ? '#2563eb' : 'white', color: isSetPiece ? 'white' : '#2563eb' }}
                              onClick={() => setIsSetPiece(v => !v)}
                            >
                              Set piece? {isSetPiece ? 'Yes' : 'No'}
                            </button>
                            {pendingXgAction.label === 'Shot on target' && (
                              <button
                                type="button"
                                className="manual-button"
                                style={{ background: isGoal ? '#2563eb' : 'white', color: isGoal ? 'white' : '#2563eb' }}
                                onClick={() => setIsGoal(v => !v)}
                              >
                                Goal? {isGoal ? 'Yes' : 'No'}
                              </button>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="manual-submit" onClick={confirmXg}>Save</button>
                          <button className="manual-cancel" onClick={closeXgModal}>Cancel</button>
                        </div>
                      </div>
                      {pendingXgAction && (shotActions.has(pendingXgAction.label) ? (
                        <div>
                          <p className="small-text">Click on the pitch to pick coordinates ({isFlipped ? '100.00 top-left → 0.00 bottom-right' : '0.00 top-left → 100.00 bottom-right'})</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontSize: 12, color: '#6b7280' }} />
                            <div>
                              <button className="manual-button" onClick={() => {
                                const newFlip = !isFlipped
                                setIsFlipped(newFlip)
                                if (markerRaw) {
                                  const sx = newFlip ? 100 - markerRaw.x : markerRaw.x
                                  const sy = newFlip ? 100 - markerRaw.y : markerRaw.y
                                  setCoordValue(`${sx.toFixed(2)},${sy.toFixed(2)}`)
                                }
                              }}>Flip</button>
                            </div>
                          </div>
                          <div style={{ border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden', width: 722, height: 467 }}>
                            <div style={{ position: 'relative', width: 722, height: 467 }}>
                              <img
                                ref={imgRef}
                                src="/images/pitch.png"
                                alt="pitch"
                                width={722}
                                height={467}
                                style={{ display: 'block', width: 722, height: 467, cursor: 'crosshair' }}
                                onClick={e => {
                                  const img = imgRef.current || e.currentTarget
                                  const rect = img.getBoundingClientRect()
                                  const rawX = (e.clientX - rect.left) / rect.width * 100
                                  const rawY = (e.clientY - rect.top) / rect.height * 100
                                  const xBound = Math.max(0, Math.min(100, rawX))
                                  const yBound = Math.max(0, Math.min(100, rawY))
                                  setMarkerRaw({ x: xBound, y: yBound })
                                  const sx = isFlipped ? 100 - xBound : xBound
                                  const sy = isFlipped ? 100 - yBound : yBound
                                  setCoordValue(`${sx.toFixed(2)},${sy.toFixed(2)}`)
                                }}
                              />
                              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.85)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, pointerEvents: 'none' }}>{isFlipped ? selectedMatch.awayTeam : selectedMatch.homeTeam}</div>
                              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, pointerEvents: 'none' }}>{isFlipped ? selectedMatch.homeTeam : selectedMatch.awayTeam}</div>
                              {markerRaw && (
                                <div style={{ position: 'absolute', left: `calc(${markerRaw.x}% - 7px)`, top: `calc(${markerRaw.y}% - 7px)`, width: 14, height: 14, borderRadius: 14, background: '#ef4444', border: '2px solid #fff', boxSizing: 'border-box', pointerEvents: 'none' }} />
                              )}
                            </div>
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ display: 'flex', flexDirection: 'column' }}>
                              Coord
                              <input value={coordValue} onChange={e=>{ setCoordValue(e.target.value); setMarkerRaw(null) }} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 6, width: 220 }} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#6b7280' }}>No pitch required for this action.</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="actions-split">
                  <div className="team-actions-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>Actions - Home team</h4>
                      <span className="small-text">{selectedMatch.actions.filter(a => a.team === 'Home').length}</span>
                    </div>
                    <div className="action-table-wrapper">
                      <table className="action-table">
                        <thead><tr><th>Half</th><th>Time</th><th>Action</th><th>Detail</th><th>Coord</th><th>SP</th><th>Goal</th><th></th></tr></thead>
                        <tbody>
                          {selectedMatch.actions.filter(a => a.team === 'Home').map(action => (
                            <tr key={action.id}>
                              <td>{action.half}</td>
                              <td>{action.time}</td>
                              <td>{action.action}</td>
                              <td>{action.detail ?? ''}</td>
                              <td>{action.coord ?? ''}</td>
                              <td>{action.sp ? '1' : ''}</td>
                              <td>{action.goal ? '1' : ''}</td>
                              <td><button className="delete-button" onClick={() => deleteSelectedMatchAction(action.id)}>X</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="team-actions-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>Actions - Away team</h4>
                      <span className="small-text">{selectedMatch.actions.filter(a => a.team === 'Away').length}</span>
                    </div>
                    <div className="action-table-wrapper">
                      <table className="action-table">
                        <thead><tr><th>Half</th><th>Time</th><th>Action</th><th>Detail</th><th>Coord</th><th>SP</th><th>Goal</th><th></th></tr></thead>
                        <tbody>
                          {selectedMatch.actions.filter(a => a.team === 'Away').map(action => (
                            <tr key={action.id}>
                              <td>{action.half}</td>
                              <td>{action.time}</td>
                              <td>{action.action}</td>
                              <td>{action.detail ?? ''}</td>
                              <td>{action.coord ?? ''}</td>
                              <td>{action.sp ? '1' : ''}</td>
                              <td>{action.goal ? '1' : ''}</td>
                              <td><button className="delete-button" onClick={() => deleteSelectedMatchAction(action.id)}>X</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function CreateMatch() {
  const [game, setGame] = useState({ homeTeam:'Home United', awayTeam:'Away FC', venue:'Main Stadium', date:'', time:'20:00', tournament:'' })
  const [firstHalfRunning, setFirstHalfRunning] = useState(false)
  const [secondHalfRunning, setSecondHalfRunning] = useState(false)
  const [firstHalfEnded, setFirstHalfEnded] = useState(false)
  const [firstHalfSeconds, setFirstHalfSeconds] = useState(0)
  const [secondHalfSeconds, setSecondHalfSeconds] = useState(0)
  const [actions, setActions] = useState([])
  const [manualPopupOpen, setManualPopupOpen] = useState(false)
  const [manualAction, setManualAction] = useState({ half: '1st', time: '00:00', action: '' })
  const [firstHalfEdit, setFirstHalfEdit] = useState(false)
  const [firstHalfEditValue, setFirstHalfEditValue] = useState('00:00')
  const [secondHalfEdit, setSecondHalfEdit] = useState(false)
  const [secondHalfEditValue, setSecondHalfEditValue] = useState('00:00')
  const [xgModalOpen, setXgModalOpen] = useState(false)
  const [xgValue, setXgValue] = useState('0.00')
  const [pendingXgAction, setPendingXgAction] = useState(null)
  const [coordValue, setCoordValue] = useState('')
  const [markerRaw, setMarkerRaw] = useState(null) // raw {x,y} percent for display
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSetPiece, setIsSetPiece] = useState(false)
  const [isGoal, setIsGoal] = useState(false)
  const [maximizeOpen, setMaximizeOpen] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!firstHalfRunning && !secondHalfRunning) return undefined
    const id = setInterval(() => {
      if (firstHalfRunning) setFirstHalfSeconds(s => s + 1)
      if (secondHalfRunning) setSecondHalfSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [firstHalfRunning, secondHalfRunning])

  function parseClockToSeconds(input) {
    const parts = input.split(':').map(p => parseInt(p,10))
    if (parts.some(n=>Number.isNaN(n))) return null
    if (parts.length===2) return parts[0]*60 + parts[1]
    if (parts.length===3) return parts[0]*3600 + parts[1]*60 + parts[2]
    return null
  }

  function formatClock(s){
    const m = Math.floor(s/60).toString().padStart(2,'0')
    const sec = (s%60).toString().padStart(2,'0')
    return `${m}:${sec}`
  }

  function record(team,label,detail=null,coord=null,sp=false,goal=false, halfOverride, timeOverride){
    const half = halfOverride ?? (firstHalfRunning || (!firstHalfEnded && !secondHalfRunning) ? '1st' : '2nd')
    const time = timeOverride ?? (half === '1st' ? formatClock(firstHalfSeconds) : formatClock(secondHalfSeconds))
    setActions(a=>[...a,{ id: Date.now()+Math.random(), half, time, team, action: label, detail, coord, sp, goal }])
  }

  function deleteAction(id){
    setActions(a=>a.filter(x=>x.id!==id))
  }

  function openManualForm(){
    const defaultHalf = firstHalfRunning || (!firstHalfEnded && !secondHalfRunning) ? '1st' : '2nd'
    const defaultTime = defaultHalf === '1st' ? formatClock(firstHalfSeconds) : formatClock(secondHalfSeconds)
    setManualAction({ half: defaultHalf, time: defaultTime })
    setManualPopupOpen(true)
  }

  function openXgModal(team,label){
    setPendingXgAction({ team, label })
    setXgValue('0.00')
    setCoordValue('')
    setMarkerRaw(null)
    setIsSetPiece(false)
    setIsGoal(false)
    setXgModalOpen(true)
  }

  function renderActionSide(teamName, team, showLabel = true) {
    return (
      <div className={showLabel ? '' : 'fullscreen-side'}>
        {showLabel && <h4>{teamName}</h4>}
        <div className="action-button-layout" style={{ alignItems: team === 'Away' ? 'flex-end' : 'flex-start' }}>
          {actionButtonRows.map((row, rowIndex) => (
            <div key={rowIndex} className="button-row" style={{ justifyContent: team === 'Away' ? 'flex-end' : 'flex-start', marginBottom: rowIndex === actionButtonRows.length - 1 ? 0 : 10 }}>
              {row.map(b => (
                shotActions.has(b) || xgActions.has(b)
                  ? <button key={`${team}-${b}`} onClick={() => openXgModal(team, b)}>{b}</button>
                  : <button key={`${team}-${b}`} onClick={() => record(team, b, null, null, false, false, manualPopupOpen ? manualAction.half : undefined, manualPopupOpen ? manualAction.time : undefined)}>{b}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderClockPanel() {
    return (
      <div className="clock-row popup-clock-row">
        <div>
          <div>First half</div>
          <div className="clock-display">{formatClock(firstHalfSeconds)}</div>
          <div className="half-controls">
            <button className="primary" onClick={()=>{ setFirstHalfRunning(true); setSecondHalfRunning(false)}} disabled={firstHalfRunning||firstHalfEnded}>Start first half</button>
            <button className="primary" onClick={()=>setFirstHalfRunning(false)} disabled={!firstHalfRunning}>Pause first half</button>
            <button className="primary" onClick={()=>{ setFirstHalfRunning(false); setFirstHalfEnded(true)}} disabled={!firstHalfRunning}>End first half</button>
            {!firstHalfRunning && (
              <button className="manual-button" onClick={()=>{ setFirstHalfEdit(true); setFirstHalfEditValue(formatClock(firstHalfSeconds)) }}>Change time</button>
            )}
          </div>
          {firstHalfEdit && (
            <div className="time-edit-form">
              <input className="time-input" value={firstHalfEditValue} onChange={e=>setFirstHalfEditValue(e.target.value)} />
              <button className="manual-submit" onClick={()=>{ const s=parseClockToSeconds(firstHalfEditValue); if(s!==null){ setFirstHalfSeconds(s) } setFirstHalfEdit(false) }}>Save</button>
              <button className="manual-cancel" onClick={()=>setFirstHalfEdit(false)}>Cancel</button>
            </div>
          )}
        </div>
        <div>
          <div>Second half</div>
          <div className="clock-display">{formatClock(secondHalfSeconds)}</div>
          <div className="half-controls">
            <button className="primary" onClick={()=>setSecondHalfRunning(true)} disabled={!firstHalfEnded||secondHalfRunning}>Start second half</button>
            <button className="primary" onClick={()=>setSecondHalfRunning(false)} disabled={!secondHalfRunning}>Pause second half</button>
            <button className="primary" onClick={()=>setSecondHalfRunning(false)} disabled={!secondHalfRunning}>End second half</button>
            {!secondHalfRunning && (
              <button className="manual-button" onClick={()=>{ setSecondHalfEdit(true); setSecondHalfEditValue(formatClock(secondHalfSeconds)) }}>Change time</button>
            )}
          </div>
          {secondHalfEdit && (
            <div className="time-edit-form">
              <input className="time-input" value={secondHalfEditValue} onChange={e=>setSecondHalfEditValue(e.target.value)} />
              <button className="manual-submit" onClick={()=>{ const s=parseClockToSeconds(secondHalfEditValue); if(s!==null){ setSecondHalfSeconds(s) } setSecondHalfEdit(false) }}>Save</button>
              <button className="manual-cancel" onClick={()=>setSecondHalfEdit(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderActionPanel() {
    return (
      <div className="actions-panel">
        {renderActionSide(game.homeTeam, 'Home')}
        {renderActionSide(game.awayTeam, 'Away')}
      </div>
    )
  }

  function renderFullscreenActionPanel() {
    return (
      <>
        {renderClockPanel()}
        <div className="fullscreen-label-row">
          <div className="fullscreen-team-label">{game.homeTeam}</div>
          <div className="fullscreen-team-label">{game.awayTeam}</div>
        </div>
        <div className="fullscreen-actions-panel">
          {renderActionSide(game.homeTeam, 'Home', false)}
          {renderActionSide(game.awayTeam, 'Away', false)}
        </div>
      </>
    )
  }

  function confirmXg(){
    if (!pendingXgAction) return
    // if shot action include coord
    const coord = coordValue || (markerRaw ? `${(isFlipped ? (100 - markerRaw.x) : markerRaw.x).toFixed(2)},${(isFlipped ? (100 - markerRaw.y) : markerRaw.y).toFixed(2)}` : null)
    const isShot = shotActions.has(pendingXgAction.label)
    const setPieceValue = xgActions.has(pendingXgAction.label) ? true : (isShot ? isSetPiece : false)
    const goalValue = isShot && pendingXgAction.label === 'Shot on target' ? isGoal : false
    record(
      pendingXgAction.team,
      pendingXgAction.label,
      xgValue,
      coord,
      setPieceValue,
      goalValue,
      manualPopupOpen ? manualAction.half : undefined,
      manualPopupOpen ? manualAction.time : undefined
    )
    setPendingXgAction(null)
    setXgModalOpen(false)
  }

  function cancelXg(){
    setPendingXgAction(null)
    setXgModalOpen(false)
  }

  const [saveStatus, setSaveStatus] = useState('')

  function submitManualAction(e){
    e.preventDefault()
    if (!manualAction.action.trim()) return
    setActions(a=>[...a,{ id: Date.now()+Math.random(), half: manualAction.half, time: manualAction.time, team: manualAction.team, action: manualAction.action }])
    setManualPopupOpen(false)
  }

  async function saveMatch(){
    setSaveStatus('Saving match...')
    const matchData = {
      game,
      actions,
      firstHalfSeconds,
      secondHalfSeconds,
      firstHalfEnded,
      savedAt: new Date().toISOString(),
    }

    try {
      const response = await fetch(apiUrl('/api/matches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Server error while saving match')
      }

      const data = await response.json()
      setSaveStatus(`Saved match ${data.matchId}`)
    } catch (error) {
      console.error(error)
      setSaveStatus(`Save failed: ${error.message}`)
    }
  }

  return (
    <div className="app">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1>Create New Match</h1>
          </div>
          <Link className="manual-button" to="/">Back to modules</Link>
        </div>
      </header>

      <section className="panel">
        <form className="game-form" onSubmit={(e)=>e.preventDefault()}>
          <div className="row">
            <label>Home team<input value={game.homeTeam} onChange={e=>setGame({...game,homeTeam:e.target.value})} /></label>
            <label>Away team<input value={game.awayTeam} onChange={e=>setGame({...game,awayTeam:e.target.value})} /></label>
          </div>
          <div className="row">
            <label>Place<input value={game.venue} onChange={e=>setGame({...game,venue:e.target.value})} /></label>
            <label>Date<input type="date" value={game.date} onChange={e=>setGame({...game,date:e.target.value})} /></label>
          </div>
          <div className="row">
            <label>Time<input type="time" value={game.time} onChange={e=>setGame({...game,time:e.target.value})} /></label>
            <label>Tournament<input value={game.tournament} onChange={e=>setGame({...game,tournament:e.target.value})} /></label>
          </div>
        </form>

        <div className="section-divider" />
        <div className="action-panel-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3>Action panel</h3>
            <button className="manual-button" onClick={() => setMaximizeOpen(true)}>Maximize</button>
          </div>
          {renderClockPanel()}
        </div>
        {renderActionPanel()}
        {maximizeOpen && (
          <div className="fullscreen-overlay">
            <div className="fullscreen-panel">
              <div className="fullscreen-header" style={{ justifyContent: 'flex-end' }}>
                <button className="popup-close-button" onClick={() => setMaximizeOpen(false)}>Close</button>
              </div>
              {renderFullscreenActionPanel()}
            </div>
          </div>
        )}

        <div className="section-divider" />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Recorded actions</h3>
          <div>
            <button className="manual-button" onClick={openManualForm}>Create action manually</button>
          </div>
        </div>

        {manualPopupOpen && (
          <div className="fullscreen-overlay">
            <div className="fullscreen-panel">
              <div className="fullscreen-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Manual action popup</h3>
                  <p className="small-text" style={{ margin: '6px 0 0' }}>Choose first/second half and enter the time, then tap an action button.</p>
                </div>
                <button className="popup-close-button" onClick={() => setManualPopupOpen(false)}>Close</button>
              </div>
              <div className="manual-popup-controls">
                <div className="manual-form-field">
                  <label>Half</label>
                  <div className="half-radio-group">
                    <label><input type="radio" name="manualHalf" value="1st" checked={manualAction.half === '1st'} onChange={e=>setManualAction({...manualAction,half:e.target.value})} /> 1st</label>
                    <label><input type="radio" name="manualHalf" value="2nd" checked={manualAction.half === '2nd'} onChange={e=>setManualAction({...manualAction,half:e.target.value})} /> 2nd</label>
                  </div>
                </div>
                <div className="manual-form-field">
                  <label>Time</label>
                  <input value={manualAction.time} onChange={e=>setManualAction({...manualAction,time:e.target.value})} />
                </div>
              </div>
              <div className="fullscreen-label-row">
                <div className="fullscreen-team-label">{game.homeTeam}</div>
                <div className="fullscreen-team-label">{game.awayTeam}</div>
              </div>
              <div className="fullscreen-actions-panel">
                {renderActionSide(game.homeTeam, 'Home', false)}
                {renderActionSide(game.awayTeam, 'Away', false)}
              </div>
            </div>
          </div>
        )}

        {actions.length===0 ? <p className="small-text">No actions yet</p> : (
          <div className="actions-split">
            <div className="team-actions-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h4>Actions - Home team</h4>
                <span className="small-text">{actions.filter(a=>a.team==='Home').length}</span>
              </div>
              <div className="action-table-wrapper">
                <table className="action-table">
                  <thead><tr><th>Half</th><th>Time</th><th>Action</th><th>Detail</th><th>Coord</th><th>SP</th><th>Goal</th><th></th></tr></thead>
                  <tbody>
                    {actions.filter(a=>a.team==='Home').map(it=> (
                      <tr key={it.id}><td>{it.half}</td><td>{it.time}</td><td>{it.action}</td><td>{it.detail ?? ''}</td><td>{it.coord ?? ''}</td><td>{it.sp ? '1' : ''}</td><td>{it.goal ? '1' : ''}</td><td><button className="delete-button" onClick={()=>deleteAction(it.id)}>X</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="team-actions-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h4>Actions - Away team</h4>
                <span className="small-text">{actions.filter(a=>a.team==='Away').length}</span>
              </div>
              <div className="action-table-wrapper">
                <table className="action-table">
                  <thead><tr><th>Half</th><th>Time</th><th>Action</th><th>Detail</th><th>Coord</th><th>SP</th><th>Goal</th><th></th></tr></thead>
                  <tbody>
                    {actions.filter(a=>a.team==='Away').map(it=> (
                      <tr key={it.id}><td>{it.half}</td><td>{it.time}</td><td>{it.action}</td><td>{it.detail ?? ''}</td><td>{it.coord ?? ''}</td><td>{it.sp ? '1' : ''}</td><td>{it.goal ? '1' : ''}</td><td><button className="delete-button" onClick={()=>deleteAction(it.id)}>X</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {xgModalOpen && (
          <div className="popup-modal">
            <div className="popup-modal-content">
              <h3 style={{ marginTop: 0 }}>Enter details</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 180 }}>
                  xG value
                  <input value={xgValue} onChange={e=>setXgValue(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 6 }} />
                </label>
                {pendingXgAction && shotActions.has(pendingXgAction.label) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="manual-button"
                      style={{ background: isSetPiece ? '#2563eb' : 'white', color: isSetPiece ? 'white' : '#2563eb' }}
                      onClick={() => setIsSetPiece(v => !v)}
                    >
                      Set piece? {isSetPiece ? 'Yes' : 'No'}
                    </button>
                    {pendingXgAction.label === 'Shot on target' && (
                      <button
                        type="button"
                        className="manual-button"
                        style={{ background: isGoal ? '#2563eb' : 'white', color: isGoal ? 'white' : '#2563eb' }}
                        onClick={() => setIsGoal(v => !v)}
                      >
                        Goal? {isGoal ? 'Yes' : 'No'}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="manual-submit" onClick={confirmXg}>Save</button>
                  <button className="manual-cancel" onClick={cancelXg}>Cancel</button>
                </div>
              </div>
              {pendingXgAction && (shotActions.has(pendingXgAction.label) ? (
                  <div>
                  <p className="small-text">Click on the pitch to pick coordinates ({isFlipped ? '100.00 top-left → 0.00 bottom-right' : '0.00 top-left → 100.00 bottom-right'})</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }} />
                    <div>
                      <button className="manual-button" onClick={() => {
                        const newFlip = !isFlipped
                        setIsFlipped(newFlip)
                        if (markerRaw) {
                          const sx = newFlip ? 100 - markerRaw.x : markerRaw.x
                          const sy = newFlip ? 100 - markerRaw.y : markerRaw.y
                          setCoordValue(`${sx.toFixed(2)},${sy.toFixed(2)}`)
                        }
                      }}>Flip</button>
                    </div>
                  </div>
                  <div style={{ border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden', width: 722, height: 467 }}>
                    <div style={{ position: 'relative', width: 722, height: 467 }}>
                      <img
                        ref={imgRef}
                        src="/images/pitch.png"
                        alt="pitch"
                        width={722}
                        height={467}
                        style={{ display: 'block', width: 722, height: 467, cursor: 'crosshair' }}
                        onClick={e => {
                          const img = imgRef.current || e.currentTarget
                          const rect = img.getBoundingClientRect()
                          const rawX = (e.clientX - rect.left) / rect.width * 100
                          const rawY = (e.clientY - rect.top) / rect.height * 100
                          const xBound = Math.max(0, Math.min(100, rawX))
                          const yBound = Math.max(0, Math.min(100, rawY))
                          setMarkerRaw({ x: xBound, y: yBound })
                          const sx = isFlipped ? 100 - xBound : xBound
                          const sy = isFlipped ? 100 - yBound : yBound
                          setCoordValue(`${sx.toFixed(2)},${sy.toFixed(2)}`)
                        }}
                      />
                      {/* Team name overlays */}
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.85)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, pointerEvents: 'none' }}>{isFlipped ? game.awayTeam : game.homeTeam}</div>
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, pointerEvents: 'none' }}>{isFlipped ? game.homeTeam : game.awayTeam}</div>
                      {markerRaw && (
                        <div style={{ position: 'absolute', left: `calc(${markerRaw.x}% - 7px)`, top: `calc(${markerRaw.y}% - 7px)`, width: 14, height: 14, borderRadius: 14, background: '#ef4444', border: '2px solid #fff', boxSizing: 'border-box', pointerEvents: 'none' }} />
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                      Coord
                      <input value={coordValue} onChange={e=>{ setCoordValue(e.target.value); setMarkerRaw(null) }} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 6, width: 220 }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6b7280' }}>No pitch required for this action.</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
          <button className="primary" onClick={saveMatch} disabled={actions.length === 0}>Save match</button>
          {saveStatus && <span className="small-text">{saveStatus}</span>}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModulesPage />} />
        <Route path="/create" element={<CreateMatch />} />
        <Route path="/matches" element={<AnalyzeMatches />} />
        <Route path="/analyze" element={<AnalyzeMatches />} />
        <Route path="/season" element={<SeasonPage />} />
        <Route path="/placeholder/2" element={<PlaceholderPage title="Placeholder module 2" />} />
      </Routes>
    </BrowserRouter>
  )
}
