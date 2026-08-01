import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

function toActionTimeSeconds(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value))
  }

  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    return Math.max(0, Number(raw))
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds > 59) return null

  return minutes * 60 + seconds
}

app.post('/api/matches', async (req, res) => {
  const { game, actions, firstHalfSeconds, secondHalfSeconds, firstHalfEnded, savedAt } = req.body
  if (!game || !Array.isArray(actions)) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  const normalizedActions = []
  for (const action of actions) {
    const timeSeconds = toActionTimeSeconds(action.time)
    if (timeSeconds === null) {
      return res.status(400).json({ error: `Invalid action time: ${String(action.time ?? '')}` })
    }
    normalizedActions.push({
      ...action,
      time: timeSeconds,
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const matchResult = await client.query(
      `INSERT INTO matches (home_team, away_team, venue, match_date, match_time, tournament, first_half_seconds, second_half_seconds, first_half_ended, saved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, created_at AS "createdAt"`,
      [
        game.homeTeam,
        game.awayTeam,
        game.venue,
        game.date || null,
        game.time || null,
        game.tournament || null,
        firstHalfSeconds,
        secondHalfSeconds,
        firstHalfEnded,
        savedAt,
      ]
    )

    const matchId = matchResult.rows[0].id
    const actionPromises = normalizedActions.map(action => {
      return client.query(
        `INSERT INTO actions (match_id, half, time, team, action_label, detail, coord, sp, goal)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [matchId, action.half, action.time, action.team, action.action, action.detail || null, action.coord || null, action.sp || false, action.goal || false]
      )
    })
    await Promise.all(actionPromises)
    await client.query('COMMIT')

    res.json({ matchId })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    res.status(500).json({ error: 'Failed to save match' })
  } finally {
    client.release()
  }
})

app.get('/api/matches', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, home_team AS "homeTeam", away_team AS "awayTeam", venue, match_date AS "matchDate", match_time AS "matchTime", tournament, saved_at AS "savedAt", created_at AS "createdAt"
       FROM matches
       ORDER BY id DESC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load matches' })
  }
})

app.get('/api/matches/:id', async (req, res) => {
  const matchId = req.params.id
  try {
    const matchResult = await pool.query(
      `SELECT id, home_team AS "homeTeam", away_team AS "awayTeam", venue, match_date AS "matchDate", match_time AS "matchTime", tournament, saved_at AS "savedAt", created_at AS "createdAt"
       FROM matches
       WHERE id = $1`,
      [matchId]
    )

    if (matchResult.rowCount === 0) {
      return res.status(404).json({ error: 'Match not found' })
    }

    const actionsResult = await pool.query(
      `SELECT id, half, time, team, action_label AS action, detail, coord, sp, goal, created_at AS "createdAt"
       FROM actions
       WHERE match_id = $1
       ORDER BY id`,
      [matchId]
    )

    res.json({ ...matchResult.rows[0], actions: actionsResult.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load match' })
  }
})

app.delete('/api/actions/:id', async (req, res) => {
  const actionId = req.params.id
  try {
    const deleteResult = await pool.query('DELETE FROM actions WHERE id = $1 RETURNING id', [actionId])
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Action not found' })
    }
    res.json({ id: actionId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete action' })
  }
})

app.post('/api/matches/:id/actions', async (req, res) => {
  const matchId = req.params.id
  const { half, time, team, action, detail, coord, sp, goal } = req.body

  if (!half || time === undefined || time === null || time === '' || !team || !action) {
    return res.status(400).json({ error: 'Missing action required fields' })
  }

  const timeSeconds = toActionTimeSeconds(time)
  if (timeSeconds === null) {
    return res.status(400).json({ error: `Invalid action time: ${String(time)}` })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const matchResult = await client.query('SELECT id FROM matches WHERE id = $1', [matchId])
    if (matchResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Match not found' })
    }

    const insertResult = await client.query(
      `INSERT INTO actions (match_id, half, time, team, action_label, detail, coord, sp, goal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, half, time, team, action_label AS action, detail, coord, sp, goal, created_at AS "createdAt"`,
      [matchId, half, timeSeconds, team, action, detail || null, coord || null, sp || false, goal || false]
    )

    await client.query('COMMIT')
    res.json(insertResult.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    res.status(500).json({ error: 'Failed to save action' })
  } finally {
    client.release()
  }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
