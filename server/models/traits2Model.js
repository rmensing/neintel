const mongoose = require('mongoose')

const traits2Schema = new mongoose.Schema({
    id: Number,
    traits: Array
})

module.exports = mongoose.model('Traits2', traits2Schema)