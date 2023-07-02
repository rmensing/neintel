const mongoose = require('mongoose')

const factionSchema = new mongoose.Schema({
    factionID: Number,
    factionName: String,
    corporationID: Number,
    militiaCorporationID: Number,
})

module.exports = mongoose.model('Factions', factionSchema, 'factions')