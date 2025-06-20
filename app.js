const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const bcrypt = require('bcrypt')

const dbpath = path.join(__dirname, 'userData.db')
const app = express()
app.use(express.json())
let db = null
const initalize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error :${e.message}`)
    process.exit(1)
  }
}
initalize()

//API -1 REGISTER
app.post('/register', async (req, res) => {
  const {username, name, password, gender, location} = req.body
  const hassedPassword = await bcrypt.hash(password, 10)
  const getRegisterQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(getRegisterQuery)
  if (password.length < '5') {
    res.status(400)
    res.send('Password is too short')
  } else if (dbUser === undefined) {
    const getCreateQuery = `INSERT INTO user (
      username,
      name,
      password,
      gender,
      location
    )
    VALUES(
      '${username}',
      '${name}',
      '${hassedPassword}',
      '${gender}',
      '${location}'
    );`
    const user = await db.run(getCreateQuery)
    res.status(200)
    res.send('User created successfully')
  } else {
    res.status(400)
    res.send('User already exists')
  }
})

//API -2 LOGIN
app.post('/login', async (req, res) => {
  const {username, password} = req.body
  const getloginDetails = `SELECT * FROM user WHERE username = '${username}';`
  const dbuser = await db.get(getloginDetails)
  if (dbuser === undefined) {
    res.status(400)
    res.send('Invalid user')
  } else {
    const isMatched = await bcrypt.compare(password, dbuser.password)
    if (isMatched === true) {
      res.status(200)
      res.send('Login success!')
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  }
})

//API -3 change-password
app.put('/change-password', async (req, res) => {
  const {username, oldPassword, newPassword} = req.body
  const getDetailsQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbuser = await db.get(getDetailsQuery)
  const isCurrentPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbuser.password,
  )
  if (isCurrentPasswordMatched === false) {
    res.status(400)
    res.send('Invalid current password')
  } else if (newPassword.length < 5) {
    res.status(400)
    res.send('Password is too short')
  } else {
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    const updatePasswordQuery = `UPDATE user SET password ='${newPasswordHash}' WHERE username = '${username}';`
    await db.run(updatePasswordQuery)
    res.status(200)
    res.send('Password updated')
  }
})

module.exports = app
