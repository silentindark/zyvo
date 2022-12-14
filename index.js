require('dotenv').config()

const express = require('express')
const session = require('express-session')
const app = express()
const PORT = 3000

const { initDb } = require('./db/db')
const { commitChanges } = require('./services/common')

const { logger } = require('./utils/logger/index')
const { asciiArt, checkIfAsteriskRunning } = require('./utils/defaults')
const { startCron } = require('./services/cron')
const { actionSipPeers } = require('./services/agi')

require('./services/agi')

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // support encoded bodies
app.use(express.static('public'))
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dummy_secret',
    resave: true,
    saveUninitialized: true
  })
)

const passport = require('passport')
require('./services/passport')(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use('/api/extensions', require('./routes/extensions'))
app.use('/api/queues', require('./routes/queues'))
app.use('/api/trunks', require('./routes/trunks'))
app.use('/api/core', require('./routes/core'))

app.use('/auth', require('./routes/auth'))
app.use('/advanced', require('./routes/advanced'))
app.use('/ivr', require('./routes/ivr'))
app.use('/', require('./routes/index'))

app.listen(PORT, async () => {
  await initDb()
  asciiArt()

  if (!(await checkIfAsteriskRunning())) {
    logger.error('Asterisk is not running. Please start it and try again.')
    console.log('\n')
    process.exit(0)
  }

  await Promise.all([
    actionSipPeers(),
    commitChanges(true)
  ])

  startCron()
  logger.info(`Zyvo server listening on port ${PORT}`)
})
