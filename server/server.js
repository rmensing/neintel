require('dotenv').config()

const express = require('express')
// const cors = require('cors');
const mongoose = require('mongoose');
const toolsRoutes = require('./routes/toolsRoutes')
const toolsController = require('./controllers/toolsController')

// var corsOptions = {
//   origin: '*',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   allowedHeaders: ["authorization", "Content-Type"],
//   exposedHeaders: ["authorization"],
//   preflightContinue: false,
//   credentials:true,
//   optionsSuccessStatus: 200
// }
// express app
const app = express()

// middleware
// app.options('*', cors(corsOptions))
// app.use(cors(corsOptions))
app.use(express.json())
app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
})

//routes
app.use('/', toolsRoutes)

app.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}!`))

process.once('SIGUSR2', function () {
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', function () {
  // this is only called on ctrl+c, not restart
  process.kill(process.pid, 'SIGINT');
});
