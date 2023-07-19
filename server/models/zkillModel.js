const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const topListSchema = new Schema({
  type: String,
  data: [{ type: Schema.Types.Mixed }],
});

const groupSchema = new Schema({
  groupID: Number,
  shipsLost: Number,
  pointsLost: Number,
  iskLost: Number,
});

const monthSchema = new Schema({
  year: Number,
  month: Number,
  shipsLost: Number,
  pointsLost: Number,
  iskLost: Number,
});

const labelSchema = new Schema({
  shipsLost: Number,
  pointsLost: Number,
  iskLost: Number,
});

const lastApiUpdateSchema = new Schema({
  sec: Number,
  usec: Number,
});

const infoSchema = new Schema({
  id: Number,
  type: String,
  name: String,
  lastApiUpdate: lastApiUpdateSchema,
});

const topListValuesSchema = new Schema({
  type: String,
  title: String,
  values: [{ type: Schema.Types.Mixed }],
});

const zkillSchema = new Schema({
  _id: Schema.Types.ObjectId,
  type: String,
  id: Number,
  topAllTime: [topListSchema],
  shipsLost: Number,
  pointsLost: Number,
  iskLost: Number,
  attackersLost: Number,
  groups: { type: Map, of: groupSchema },
  months: { type: Map, of: monthSchema },
  labels: { type: Map, of: labelSchema },
  soloLosses: Number,
  shipsDestroyed: Number,
  pointsDestroyed: Number,
  iskDestroyed: Number,
  attackersDestroyed: Number,
  soloKills: Number,
  sequence: Number,
  epoch: Number,
  dangerRatio: Number,
  gangRatio: Number,
  trophies: {
    levels: Number,
    max: Number,
  },
  allTimeSum: Number,
  nextTopRecalc: Number,
  activepvp: Schema.Types.Mixed,
  info: infoSchema,
  topLists: [topListValuesSchema],
  topIskKillIDs: [Number],
  activity: Schema.Types.Mixed
});

module.exports = mongoose.model('Zkill', zkillSchema)