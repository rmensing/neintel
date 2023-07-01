const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
    report_id: String,
    report_type: String,
    report_data: [String],
    report_dt: Date
})

module.exports = mongoose.model('Reports', reportSchema)