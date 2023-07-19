// TTL on node-cache is 15 min (900sec)
// TTL on mysql db - char zkill stats - 1hr
// TTL on mysql db - char corp info - 1 day
const fs = require('fs');
const differenceInSeconds = require('date-fns/differenceInSeconds')
const formatISO9075 = require('date-fns/formatISO9075')
var parseISO = require('date-fns/parseISO')
const { nanoid } = require("nanoid");
const mongoose = require('mongoose');
const Chars = require('../models/charModel');
const Reports = require('../models/reportsModel')
const Ships = require('../models/shipsModel')
const Traits = require('../models/traitsModel')
const Traits2 = require('../models/traits2Model')
const Factions = require('../models/factionsModel')
const Zkill = require('../models/zkillModel')
var Bottleneck = require("bottleneck/es5");
const axios = require("../node_modules/axios/dist/node/axios.cjs");
const swag = require("../utils/swag");
const swagClient = new swag({});
var _ = require('lodash');
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1500
  });

const {
    evetoolsDB,
    rClient
} = require('../config/db')

const zData = {"activepvp":{},"info":null,"topLists":[{"type":"character","title":"Top Characters","values":[]},{"type":"corporation","title":"Top Corporations","values":[]},{"type":"alliance","title":"Top Alliances","values":[]},{"type":"shipType","title":"Top Ships","values":[]},{"type":"solarSystem","title":"Top Systems","values":[]},{"type":"location","title":"Top Locations","values":[]}],"topIskKillIDs":[]}



//@
const fetchShips = async (req, res) => {
    try {
        var ships = JSON.parse(await fs.promises.readFile('./data/ships.json', { encoding: 'utf8' }));
        // console.log("SHIPS==>", ships);
        res.status(200).json(ships);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch ships' });
    }
}

const writeShips = async (req, res) => {
    var ships= await shipQuery()
    var traits = await traitQuery()
    // console.log("SHIPS==>", ships)
    const combined = {};
    
    for (let ship of ships){
        
        delete ship[1]["_id"];
        let t = ship[1].typeID.toString();
        combined[t] = ship[1]
    }
    for (let trait of traits){
        let t = trait.typeID.toString();
        delete trait["_id"];
        if (typeof combined[t] === "undefined"){
            // console.log(t, combined[t], typeof combined[t])
        }else {
            
            // combined[t] = Object.assign(combined[t], trait);
            combined[t]['traits'] = trait.traits;
            console.log("done",combined[t])
        }
    }
    // console.log("COMBINED:",combined)
    fs.writeFile('./data/ships.json', JSON.stringify(combined),{flag: 'w'} ,err => {
        if (err) {
          console.error(err);
        }
        // file written successfully
    });
    res.status(200).json("OK")
}

// const writeShips = async (req, res) => {
//     var ships = await shipQuery()
//     // console.log("SHIPS==>", ships)
//     fs.writeFile('./data/ships.json', JSON.stringify(ships),{flag: 'w'} ,err => {
//         if (err) {
//           console.error(err);
//         }
//         // file written successfully
//     });
//     res.status(200).json("OK")
// }

//@
const fetchTraits = async (req, res) => {
    try {
        var traits= JSON.parse(await fs.promises.readFile('./data/traits.json', { encoding: 'utf8' }));
        // console.log("TRAITS==>", traits);
        res.status(200).json(traits);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch traits' });
    }
}

const writeTraits = async (req, res) => {
    var traits = await traitQuery()
    var input = traits;
    console.log("TRAITS==>", traits, traits[0].typeID, traits[0].traits);
    const output = input.map(({ typeID, traits }) => [
        Number(typeID),
        traits.map((trait) => ({ ...trait }))
      ]);
    fs.writeFile('./data/traits.json', JSON.stringify(output),{flag: 'w'} ,err => {
        if (err) {
          console.error(err);
        }
        // file written successfully
    });
    res.status(200).json("OK")
}

//@
// get Hello
const getHello = async (req, res) => {
    res.status(200).send('Hello World!')
}

//@
const prepReport = async (req, res) => {
    //parse for data type
    var report_data = req.body
    console.log("Pre-reportdata", report_data)
    var report_type = ""
    var report_id = nanoid(10)
    let reslen = report_data[0].split('\t').length
      console.log("length=>", reslen)
      switch (reslen){
        case 1: //local scan
          report_type = "local"
          console.log("Before Filter:", report_data.length)
          // Check array of names against regex pattern to filter out invalid names.
          filteredArray = await checkNames(report_data);
          console.log("After Filter:", filteredArray.length)
          if (filteredArray.length == 0) {
            report_id = "NONE"
            res.status(200).json(report_id);
            return;
        }
          break;
        case 4: //dscan
          navigate('/dscan', { replace: true })
          break;
        case 6: //probe scan
          navigate('/probe', { replace: true })
          break;
        case 8: //cargo/inventory
          navigate('/cargo', { replace: true })
          break;
      }
      //call create report db entry
      result = await insertReport(report_id, report_type, filteredArray)
      console.log("Insert Report==>",result)
      res.status(200).json(report_id)
}

async function checkNames(names) {
    const regex = /^(?=.{3,37}$)["'][a-zA-Z0-9' -]{1,24}(?: [a-zA-Z0-9' -]{1,24})?(?: [a-zA-Z0-9' -]{1,12})?["']$/;
    const filteredArray = names.filter((item) => !regex.test(item));
    console.log("DURING FILTER:", filteredArray)
    return filteredArray;
}
//@
//check for new info and update info
//then go getReport
const fetchReport = async (req, res) => {
    // console.log("REQUEST", req)
    let report_id = req.params.id
    var data = await getReportData(report_id)
    console.log("DATA", data)
    if (data == null) {
        report = "NONE"
        res.status(200).json(report);
        return;
    }
    let report_type = data.report_type
    let report_data = data.report_data
    console.log("DATA==>", data, report_type, report_data,report_id)
    switch (report_type) {
        case 'local':
            ids = await getID2(report_data)
            console.log("PRE_REPORTQUERY:",report_id)
            var report = await reportQuery(report_id)
            console.log("REPORT->",report)
            res.status(200).json(report)
            break;
        
        case 'dscan':
            break;

        case 'probe':
            break;

        case 'cargo':
            break;

        default:
            break;
    }
}

//@
const getReport = async (req, res) => {
    let report_id = req.params.id
    console.log("REPORT_ID-->", result)
    report = await reportQuery(report_id)
    console.log("REPORT->",report)
    // res.status(200).json({report})
    res.status(200).json(report)
}

async function getID(names){
    try {
        var result = await swagClient.universe.nToI(names)
    } catch(e) { // try/catch is used when you await a function
        // Error? What error?
        console.log("WE HAD AN ERROR", e)
    }
    // console.log("getNtoID=>", result)
    var chars = result.data
    console.log("CHARS=>",chars)   
    charData = chars.characters
    console.log("CHARDATA=>",charData)
    // return charData[0].id
    return charData
}

//@
// getID
async function getChar(id){
    try {
        var result = await swagClient.character.info(id)
    } catch(e) { // try/catch is used when you await a function
        // Error? What error?
        console.log("WE HAD AN ERROR", e)
    }
    // console.log("getNtoID=>", result)
    charInfo = result.data
    console.log(charInfo)
    return charInfo
}

async function getAff(ids){
    console.log("AFFINFO:", ids)
    try {
        var result = await swagClient.character.affiliation(ids)
    } catch(e) { // try/catch is used when you await a function
        console.log("AFFINFO-ERROR:", e)
    }
    // console.log("affInfo:", result)
    affData = result.data
    console.log("affInfo--", affData)
    return affData
}

//@
// async function getFaction(factionID){
//     result = await factionQuery(factionID)
//     factionData = result[0]
//     console.log("factionResult:", factionData)
//     return factionData
// }

async function getCorp(corpID){
    try {
        var result = await swagClient.corporation.info(corpID)
    } catch(e) { // try/catch is used when you await a function
        // Error? What error?
    }
    // console.log("getNtoID=>", result)
    corpInfo = result.data
    console.log("CORPINFO=>", corpInfo)
    corpName = corpInfo.name
    return corpName
}

async function getAlly(allyID){
    try {
        var result = await swagClient.alliance.info(allyID)
    } catch(e) { // try/catch is used when you await a function
        // Error? What error?
    }
    allyInfo = result.data
    allyName = allyInfo.name
    return allyName
}

//@
async function getID2(names){
    console.log("NAMES-->",names)
    var ids = await getID(names)
    //only valid names in names var
    names = ids.map(obj => obj.name);
    console.log("ids", ids)
    console.log("NAMES2-->",names)
    var tmpids = ids.map(({id}) => id)
    console.log("tmpids", tmpids)
    var affData = await getAff(tmpids)
    // console.log("IDS-->",ids)
    let nLen = names.length
    for (let i = 0; i< nLen; i++){
        let results = await nameQuery(names[i])
        console.log('getID2---', names[i], results)
        var date = new Date();
        var zdate = new Date(+0);
        dt = date.toISOString().slice(0, 19).replace('T', ' ');
        zdt = zdate.toISOString().slice(0, 19).replace('T', ' ');
        console.log("DATE==>", dt)
        if (results == 0){
            let charInfo = await getChar(ids[i].id)
            let ii = affData.findIndex(x => x.character_id === ids[i].id)
            let factionID = affData[ii].faction_id ?? 0
            console.log("FACTIONID:", factionID)
            if (factionID != 0){
                var factionData = await factionQuery(factionID)
                var factionName = factionData.factionName
                var factionCorp = factionData.corporationID
            } else {
                var factionName = ""
                var factionCorp = 0
            }
            // console.log("ALLIANCEID",charInfo.alliance_id)
            let corpName = await getCorp(charInfo.corporation_id)
            let allyID = charInfo.alliance_id ?? 0
            var allyName = ""
            if (allyID != 0){
                allyName = await getAlly(charInfo.alliance_id)
            }
            // let zData = await limiter.schedule(() => getZkill(ids[i].id))
            console.log("TOPLISTS=>",zData.topLists[3].values);
            var ships_all = [];
            let result = await insertChar(
                names[i], 
                ids[i].id,
                charInfo.security_status,
                charInfo.corporation_id, 
                corpName, 
                allyID, 
                allyName,
                factionID,
                factionName,
                factionCorp, 
                zData.shipsDestroyed, 
                zData.shipsLost, 
                zData.soloKills, 
                zData.dangerRatio, 
                zData.gangRatio, 
                zData.topLists[3].values,  //top ships
                ships_all,
                zdt,
                dt
                )
            // console.log(result)
        } else {
            const charData = await charQuery(ids[i].id)
            console.log("CHARDATA",charData)
            var zts = charData.z_dt
            var cts = charData.char_dt
            var dt = new Date()
            var diffzts = differenceInSeconds(dt, zts)
            var diffcts = differenceInSeconds(dt, cts)
            console.log("CHARDATA->",zts, cts, diffzts,diffcts, dt )
            if (diffcts >= 43200){       //cache character data for 12 hours
                //check/update corp info 
                let charInfo = await getChar(ids[i].id)
                let ii = affData.findIndex(x => x.character_id === ids[i].id)
                let factionID = affData[ii].faction_id ?? 0
                if (factionID != 0){
                    var factionData = await factionQuery(factionID)
                    var factionName = factionData.factionName
                    var factionCorp = factionData.corporationID
                } else {
                    var factionName = ""
                    var factionCorp = 0
                } 
                let corpName = await getCorp(charInfo.corporation_id)
                let allyID = charInfo.alliance_id ?? 0
                var allyName = ""
                if (allyID != 0){
                    allyName = await getAlly(charInfo.alliance_id)
                }
                let result = await updateCharCorp(
                    ids[i].id, 
                    charInfo.security_status,
                    charInfo.corporation_id, 
                    corpName, 
                    allyID, 
                    allyName,
                    factionID,
                    factionName,
                    factionCorp, 
                    dt
                    )
            }
        }
    }
    return ids
}

const fetchZkill = async (req, res) => {
    let id= req.params.id
    var dt = new Date();
    var charData = await charQuery(id);
    console.log("FETCHZKILL-CHARQUERY", charData)
    var diffzts = differenceInSeconds(dt, charData.z_dt);
    // if (diffzts >= 3600){
        var zkillData = await limiter.schedule(() => getZkill(id));
        console.log("FETCHZKILL-ZKILLDATA", zkillData)
        var shipsSeven = [];
        var ships_all = [];
        if(zkillData.topLists[3].values.length > 0){
            shipsSeven =  zkillData.topLists[3].values
        };
        if (zkillData.hasOwnProperty("topAllTime") && zkillData.topAllTime != null) {
            if(zkillData.topAllTime[4].data.length > 0){
                ships_all =  zkillData.topAllTime[4].data
                ships_all = await getShipName(ships_all);
            }
        }
        let result = await updateCharZ(
            id, 
            zkillData.shipsDestroyed, 
            zkillData.shipsLost, 
            zkillData.soloKills, 
            zkillData.dangerRatio, 
            zkillData.gangRatio, 
            shipsSeven,  //top ships
            ships_all,
            dt
        );
        x = await updateZkill(id, zkillData);
        result = await charQuery(id);
        console.log("FETCHZKILL", result)
    // };
    res.status(200).json(result)
}

async function getShipName(ships_all) {
    var ships = await shipQuery();
    const newShips_all = ships_all.map((ship) => {
        const matchingShip = ships.find((s) => s[1].typeID === ship.shipTypeID);
        // console.log("MATCHING:",matchingShip)
        return {
            ...ship,
            shipName: matchingShip ? matchingShip[1].typeName : null
        };
    });
    console.log("NEWSHIPS_ALL:", newShips_all)
    return newShips_all
}

async function updateZkill(id, zData){
    const result = await Zkill.findOneAndUpdate({id: id},
        zData,
        {upsert: true, new: true}
    );
    return result;
}

//@
async function getZkill(id){
    const response = await fetch(process.env.ZKILL_API + id +"/", {
        headers: {
            "Accept-Encoding": "gzip",
            "User-Agent": process.env.ZKILL_USERAGENT
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
    })
    const zData = await response.json()
    // console.log(zData.info)
    return zData
}

async function insertReport(report_id, report_type, report_data) {
    var date = new Date()
    report_dt = date.toISOString().slice(0, 19).replace('T', ' ')
    // report_data = conToolProm.escape(report_data)
    report_dataString = report_data.join(',')
    console.log("INSERT REPORT",report_id,report_type,report_data, report_dt)
    const report = new Reports({
        report_id: report_id,
        report_type: report_type,
        report_data: report_data,
        report_dt: report_dt
    });
    try {
        const result = await report.save();
        // console.log("RESULT", result);
        return result;
    } catch (error) {
        console.error("Error saving report:", error);
        throw error;
    }
}
//@
async function getReportData(report_id) {
    console.log("QUERY:", report_id)
    try {
        const result = await Reports.findOne({report_id: report_id});
        console.log("RESULT", result);
        return result;
    } catch (error) {
        console.error("Error saving report:", error);
        throw error;
    }
}

async function reportQuery(report_id) {
    try {
        const result = await Reports.aggregate(
            [
                {
                  $match: {
                    report_id: report_id,
                  },
                },
                {
                  $lookup: {
                    from: "chars",
                    localField: "report_data",
                    foreignField: "name",
                    as: "char_info",
                  },
                },
                {
                  $unwind: "$char_info",
                },
                {
                  $project: {
                    _id: 0,
                    id: "$char_info.id",
                    name: "$char_info.name",
                    security: "$char_info.security",
                    corp_id: "$char_info.corp_id",
                    corp_name: "$char_info.corp_name",
                    alliance_id: "$char_info.alliance_id",
                    alliance_name: "$char_info.alliance_name",
                    faction_id: "$char_info.faction_id",
                    faction_name: "$char_info.faction_name",
                    faction_corp: "$char_info.faction_corp",
                    kills: "$char_info.kills",
                    losses: "$char_info.losses",
                    solo: "$char_info.solo",
                    danger: "$char_info.danger",
                    gang: "$char_info.gang",
                    ships: "$char_info.ships",
                    ships_all: "$char_info.ships_all",
                  },
                },
              ]
        );
        console.log("QUERY-RESULT", result);
        return result;
    } catch (error) {
        console.error("Error saving report:", error);
        throw error;
    }
}
//@
async function nameQuery(name) {
    try {
        const result = await Chars.findOne({name: name});
        // console.log("RESULT", result);
        if (result == null){
            return 0;
        } else{
            return result.id;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
}
//@
async function charQuery(id) {
    try {
        const result = await Chars.findOne({id: id});
        // console.log("RESULT", result);
        if (result == null){
            return 0;
        } else{
            return result;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
}

async function charNameToID(name) {
    try {
        const result = await Chars.findOne({name: name});
        console.log("charNameToID-RESULT", result);
        if (result == null){
            return 0;
        } else{
            return result.id;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
}
//@
async function insertChar(name, id, security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, kills, losses, solo, danger, gang, ships, ships_all, dt, dt){
    kills = kills ?? 0
    losses = losses ?? 0
    solo = solo ?? 0
    danger = danger ?? 0
    gang = gang ?? 0
    ships = ships ?? []
    ships_all = ships_all ?? []
    console.log("INSERT REPORT",name, id, security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, kills, losses, solo, danger, gang, ships, ships_all, dt, dt)
    const char = new Chars({
        id: id,
        name: name,
        security: security,
        corp_id: corpID,
        corp_name: corpName,
        alliance_id: allyID,
        alliance_name: allyName,
        faction_id: factionID,
        faction_name: factionName,
        faction_corp: factionCorp,
        kills: kills,
        losses: losses,
        solo: solo,
        danger: danger,
        gang: gang,
        ships: ships,
        ships: ships_all,
        z_dt: dt,
        char_dt: dt
    });
    try {
        const result = await char.save();
        // console.log("RESULT", result);
        return result;
    } catch (error) {
        console.error("Error saving report:", error);
        throw error;
    }
}
//@
async function updateCharZ(id, kills, losses, solo, danger, gang, ships, ships_all, z_dt){
    kills = kills ?? 0
    losses = losses ?? 0
    solo = solo ?? 0
    danger = danger ?? 0
    gang = gang ?? 0
    ships = ships ?? []
    ships_all = ships_all ?? []
    try {
        const char = await Chars.findOne({id: id});
        // console.log("RESULT", char);
        if (char == null){
            return 0;
        } else{
            char.kills = kills;
            char.losses = losses;
            char.solo = solo;
            char.danger = danger;
            char.gang = gang;
            char.ships = ships;
            char.ships_all = ships_all;
            char.z_dt = z_dt;
            await char.save();
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
    return;
}

//@
async function updateCharCorp(id, security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, char_dt){
    try {
        const char = await Chars.findOne({id: id});
        // console.log("RESULT", char);
        if (char == null){
            return 0;
        } else{
            char.security = security;
            char.corp_id = corpID;
            char.corp_name = corpName;
            char.alliance_id = allyID;
            char.alliance_name = allyName;
            char.faction_id = factionID;
            char.faction_name = factionName;
            char.faction_corp = factionCorp;
            char.char_dt = char_dt;
            await char.save();
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
    return;
}
//@
async function shipQuery() {
    try {
        const result = await Ships.find({}).lean();
        // console.log("SHIPS RESULT", result);
        if (result == null){
            return 0;
        } else{
            var newResult = result.map(x => [x.typeID,x])
            // console.log("NEWSHIPS:",newResult)
            return newResult;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
}

//@

async function traitQuery() {
    try {
        const result = await Traits2.find();
        // console.log("TRAITS RESULT", result);
        if (result == null){
            return 0;
        } else{
            return result;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
}

// async function traitQuery() {
//     try {
//         const result = await Traits2.find();
//         // console.log("TRAITS RESULT", result);
//         if (result == null){
//             return 0;
//         } else{
//             return result;
//         }
//         } catch (error) {
//             console.error("Error getting char:", error);
//             throw error;
//         }
// }


//@
async function factionQuery(factionID) {
    try {
        const result = await Factions.findOne({'factionID': factionID});
        console.log("FACTION RESULT",factionID, result);
        if (result == null){
            return 0;
        } else{
            return result;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
    // var sql = 'SELECT * FROM `chrFactions` WHERE `factionID` = ?'
    // const [rows, fields] = await conSDEProm.query(sql, [factionID])
    // return Object.values(JSON.parse(JSON.stringify(rows)))
}
module.exports = {
    getHello,
    getChar,
    getID,
    getID2,
    getReport,
    prepReport,
    fetchReport,
    fetchShips,
    fetchTraits,
    fetchZkill,
    writeShips,
    writeTraits
}