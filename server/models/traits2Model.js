const mongoose = require('mongoose')

const traits2Schema = new mongoose.Schema({
    typeID: Number,
    traits: Array
})

module.exports = mongoose.model('Traits2', traits2Schema)