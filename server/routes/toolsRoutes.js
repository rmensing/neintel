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
    fetchZkill,
    writeShips,
    writeTraits
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

router.get('/writeships', writeShips)

router.get('/writetraits', writeTraits)

module.exports =  router