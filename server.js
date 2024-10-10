/*
 * Marble Blast Rating Race
 * Speedrun because I lost data and had no backup L.O.L.! ! !
 */

const path = require("path")
const express = require("express")
const app = express()
const PORT = 7800

app.use(express.static(path.join(__dirname, "static")))

app.listen(PORT, () => {
	console.log(`Started HTTP server on port ${PORT}`)
})
