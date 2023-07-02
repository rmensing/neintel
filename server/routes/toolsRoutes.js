const express = require('express')
const {
    getHello,
    getChar,
    postID,
    getReport,
    prepReport,
    fetchReport,
    fetchShips,
    fetchTraits,
    fetchZkill
} = require('../controllers/toolsController')



const router = express.Router()

router.get('/', getHello)

router.get('/getid', getChar)

router.post('/report', prepReport)

// router.get('/report/:id', getReport)
router.get('/report/:id', fetchReport)

router.get('/ships', fetchShips)

router.get('/traits', fetchTraits)

router.get('/zkill/:id', fetchZkill)

module.exports =  router