const mongoose = require('mongoose')

const traitsSchema = new mongoose.Schema({
    typeID: Number,
    bonus: Number,
    bonusText: String,
    unitName: String,
    typeName: String,
    skillID: Number
})

module.exports = mongoose.model('Traits', traitsSchema)