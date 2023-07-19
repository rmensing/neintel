const mongoose = require('mongoose')

const charSchema = new mongoose.Schema({
    id: Number,
    name: String,
    security: Number,
    corp_id: Number,
    corp_name: String,
    alliance_id: Number,
    alliance_name: String,
    faction_id: Number,
    faction_name: String,
    faction_corp: Number,
    kills: Number,
    losses: Number,
    solo: Number,
    danger: Number,
    gang: Number,
    ships: Array,
    ships_all: Array,
    z_dt: Date,
    char_dt: Date
})

module.exports = mongoose.model('Chars', charSchema)