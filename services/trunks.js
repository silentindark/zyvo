const { connect } = require('../db/db')
const { getTrunks, commitChanges } = require('./common')

async function getMaxId () {
  return connect(async db => {
    return await db.get('SELECT MAX(id) as max FROM trunks')
  })
}

async function createTrunk (
  id,
  host,
  port,
  secret,
  codecs
) {
  return connect(async db => {
    const [
      exists
    ] = await Promise.all([
      db.get('SELECT * FROM trunks WHERE host = ?', [host])
    ])

    if (exists === undefined) {
      const gwName = `gw_${id}`
      const gwType = 'peer'
      const gwContext = 'from-siptrunk'
      const gwQualify = 'yes'
      const gwCanrenivite = 'no'
      const gwInsecure = 'port,invite'
      const gwPort = (port !== '') ? port : ''
      const gwSecret = (secret !== '') ? secret : ''

      await db.run('INSERT INTO trunks (id, name, type, context, host, port, secret, qualify, canreinvite, insecure, codecs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id,
        gwName,
        gwType,
        gwContext,
        host,
        gwPort,
        gwSecret,
        gwQualify,
        gwCanrenivite,
        gwInsecure,
        codecs])
      await commitChanges()
      return { error: false, created: true }
    } else {
      return { error: true, message: 'Trunk already exists' }
    }
  })
}

async function deleteTrunk (id) {
  return connect(async db => {
    await db.run('DELETE FROM trunks WHERE id = ?', [id])

    await reorder()
    await commitChanges()

    return { deleted: true }
  })
}

async function updateTrunk (id, host, port, secret, codecs) {
  return connect(async db => {
    await db.run(`UPDATE trunks SET host = '${host}', port = '${port}', secret = '${secret}', codecs = '${codecs}' WHERE ID = ${id};`)
    await commitChanges()
  })
}

async function reorder () {
  const trunks = (await getTrunks())
  await connect(async db => {
    await db.run('DELETE FROM trunks')
    for (let i = 0; i < trunks.length; i++) {
      await db.run('INSERT INTO trunks (id, name, type, context, host, port, secret, qualify, canreinvite, insecure, codecs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [i,
        trunks[i].name,
        trunks[i].type,
        trunks[i].context,
        trunks[i].host,
        trunks[i].port,
        trunks[i].secret,
        trunks[i].qualify,
        trunks[i].canreinvite,
        trunks[i].insecure,
        trunks[i].codecs])
    }
    await commitChanges()
  })
}

async function getOneTrunk (id) {
  return connect(async db => {
    return await db.get('SELECT * FROM trunks WHERE id = ?', [id])
  })
}

module.exports = {
  createTrunk,
  deleteTrunk,
  updateTrunk,
  getOneTrunk,
  getMaxId
}
