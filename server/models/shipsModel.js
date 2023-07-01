const mongoose = require('mongoose')

const shipsSchema = new mongoose.Schema({
    typeID: Number,
    typeName: String,
    groupName: String,
    marketGroupName: String,
    parentGroupName: String,
    raceName: String
})

module.exports = mongoose.model('Ships', shipsSchema)