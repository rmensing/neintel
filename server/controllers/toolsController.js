// TTL on node-cache is 15 min (900sec)
// TTL on mysql db - char zkill stats - 1hr
// TTL on mysql db - char corp info - 1 day
const differenceInSeconds = require('date-fns/differenceInSeconds')
const formatISO9075 = require('date-fns/formatISO9075')
var parseISO = require('date-fns/parseISO')
const { nanoid } = require("nanoid");
const mysql = require('mysql2')
const mongoose = require('mongoose');
const Chars = require('../models/charModel');
const Reports = require('../models/reportsModel')
const Ships = require('../models/shipsModel')
const Traits = require('../models/traitsModel')
const Traits2 = require('../models/traits2Model')
var Bottleneck = require("bottleneck/es5");
const axios = require("../node_modules/axios/dist/node/axios.cjs");
const swag = require("../utils/swag");
const swagClient = new swag({});
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1500
  });

const {
    conSDE,
    conTool,
    conSDEProm,
    conToolProm,
    evetoolsDB,
    rClient
} = require('../config/db')

const zData = {"activepvp":{},"info":null,"topLists":[{"type":"character","title":"Top Characters","values":[]},{"type":"corporation","title":"Top Corporations","values":[]},{"type":"alliance","title":"Top Alliances","values":[]},{"type":"shipType","title":"Top Ships","values":[]},{"type":"solarSystem","title":"Top Systems","values":[]},{"type":"location","title":"Top Locations","values":[]}],"topIskKillIDs":[]}



//@
const fetchShips = async (req, res) => {
    ships = await shipQuery()
    // console.log("SHIPS==>", ships)
    res.status(200).json(ships)
}
//@
const fetchTraits = async (req, res) => {
    var traits = await traitQuery()
    console.log("traits==>", traits)
    res.status(200).json(traits)
}
//@
// get Hello
const getHello = async (req, res) => {
    res.status(200).send('Hello World!')
}
//used?
//postID
const postID = async (req, res) => {
    // const names = req.body.names
    const names = req.body
    // console.log("postID1-->", names)
    ids = await getID2(names)
    result = await createReport(ids)
    console.log("REPORT_ID-->", result)
    let report_id = result
    report = await reportQuery(report_id)
    console.log("REPORT->",report)
    // res.status(200).json({report})
    res.status(200).json(report)
}
//@
const prepReport = async (req, res) => {
    //parse for data type
    const report_data = req.body
    console.log("Pre-reportdata", report_data)
    var report_type = ""
    var report_id = nanoid(10)
    let reslen = report_data[0].split('\t').length
      console.log("length=>", reslen)
      switch (reslen){
        case 1: //local scan
          report_type = "local"
          //no additional formatting rqd
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
      result = await insertReport(report_id, report_type, report_data)
      console.log("Insert Report==>",result)
      res.status(200).json(report_id)
}
//@
//check for new info and update info
//then go getReport
const fetchReport = async (req, res) => {
    let report_id = req.params.id
    data = await getReportData(report_id)
    console.log("DATA", data)
    let report_type = data.report_type
    let report_data = data.report_data
    console.log("DATA==>", data, report_type, report_data)
    switch (report_type) {
        case 'local':
            ids = await getID2(report_data)
            report = await reportQuery(report_id)
            console.log("REPORT->",report)
            // res.status(200).json({report})
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

// async function getID(names){
//     let result = {}
//     let chars = {}
//     let charData = {}
//     var url = "https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en";
//     var headers = {
//         'accept': 'application/json',
//         'Accept-Language': `en-us`,
//         'Content-Type': 'application/json'
//     };
//     var body = names;
//     result = await axios.post(url, body, {
//         headers
//     })
//     // console.log("getNtoID=>", result)
//     chars = result.data
//     console.log("CHARS=>",chars)   
//     charData = chars.characters
//     console.log("CHARDATA=>",charData)
//     // return charData[0].id
//     return charData
// }
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
// async function getChar(id){
//     var url = `https://esi.evetech.net/latest/characters/${id}/?datasource=tranquility`;
//     var headers = {
//         'accept': 'application/json',
//         'Accept-Language': `en-us`,
//         'Content-Type': 'application/json'
//     };
//     result = await axios.get(url, {
//         headers
//     })
//     // console.log("getNtoID=>", result)
//     charInfo = result.data
//     // console.log(charInfo)
//     return charInfo
// }

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
// async function getAff(ids){
//     let result = {}
//     let chars = {}
//     let charData = {}
//     var url = "https://esi.evetech.net/latest/characters/affiliation/?datasource=tranquility&language=en";
//     var headers = {
//         'accept': 'application/json',
//         'Accept-Language': `en-us`,
//         'Content-Type': 'application/json'
//     };
//     var body = ids;
//     result = await axios.post(url, body, {
//         headers
//     })
//     affData = result.data
//     console.log("affInfo--", affData)
//     return affData
// }

//@
async function getFaction(factionID){
    result = await factionQuery(factionID)
    factionData = result[0]
    console.log("factionResult:", factionData)
    return factionData
}

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

// async function getCorp(corpID){
//     var url = `https://esi.evetech.net/latest/corporations/${corpID}/?datasource=tranquility`;
//     var headers = {
//         'accept': 'application/json',
//         'Accept-Language': `en-us`,
//         'Content-Type': 'application/json'
//     };
//     result = await axios.get(url, {
//         headers
//     })
//     corpInfo = result.data
//     corpName = corpInfo.name
//     return corpName
// }

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

// async function getAlly(allyID){
//     var url = `https://esi.evetech.net/latest/alliances/${allyID}/?datasource=tranquility`;
//     var headers = {
//         'accept': 'application/json',
//         'Accept-Language': `en-us`,
//         'Content-Type': 'application/json'
//     };
//     result = await axios.get(url, {
//         headers
//     })
//     allyInfo = result.data
//     allyName = allyInfo.name
//     return allyName
// }

//@
async function getID2(names){
    console.log("NAMES-->",names)
    var ids = await getID(names)
    console.log("ids", ids)
    var tmpids = ids.map(({id}) => id)
    console.log("tmpids", tmpids)
    var affData = await getAff(tmpids)
    // console.log("IDS-->",ids)
    let nLen = names.length
    for (let i = 0; i< nLen; i++){
        let results = await nameQuery(names[i])
        console.log('getID2---', names[i], results)
        var date = new Date()
        dt = date.toISOString().slice(0, 19).replace('T', ' ')
        console.log("DATE==>", dt)
        if (results == 0){
            // console.log("aName-->", names[i], ids[i].id)
            // let charInfo = await getChar(ids[i].id)
            let charInfo = await getChar(ids[i].id)
            let ii = affData.findIndex(x => x.character_id === ids[i].id)
            let factionID = affData[ii].faction_id ?? 0
            if (factionID != 0){
                var factionData = await getFaction(factionID)
                // var factionName = await getFaction(factionID)
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
                zData,
                dt,
                dt
                )
            // console.log(result)
        } else {
            const charData = await charQuery(ids[i].id)
            console.log("CHARDATA",charData)
            var zts = charData.z_dt
            var cts = charData.char_dt
            var dt = new Date()
            // var date = new Date()
            // dt = date.toISOString().slice(0, 19).replace('T', ' ')
            var diffzts = differenceInSeconds(dt, zts)
            var diffcts = differenceInSeconds(dt, cts)
            console.log("CHARDATA->",zts, cts, diffzts,diffcts, dt )
            // if(diffzts >= 3600) { //cache zkill data for 1 hour
            //     //update zkill stats
            //     // let zData = await limiter.schedule(() => getZkill(ids[i].id))
            //     let result = await updateCharZ(
            //         ids[i].id, 
            //         zData.shipsDestroyed, 
            //         zData.shipsLost, 
            //         zData.soloKills, 
            //         zData.dangerRatio, 
            //         zData.gangRatio, 
            //         zData.topLists[3].values,  //top ships
            //         zData,
            //         dt
            //         )
            // }
            if (diffcts >= 86400){       //cache character data for 24 hours
                //check/update corp info 
                let charInfo = await getChar(ids[i].id)
                let ii = affData.findIndex(x => x.character_id === ids[i].id)
                let factionID = affData[ii].faction_id ?? 0
                if (factionID != 0){
                    var factionData = await getFaction(factionID)
                    // var factionName = await getFaction(factionID)
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
    let id = req.params.id
    var dt = new Date()
    var charData = await charQuery(id);
    var zData = charData.zkill_stats;
    var diffzts = differenceInSeconds(dt, zData.z_dt)
    if (zData.info == null || diffzts >= 3600){
        zData = await limiter.schedule(() => getZkill(id))
        var shipsSeven = [];
        var ships_all = [];
        if(zData.topLists[3].values.length > 0){
            shipsSeven =  zData.topLists[3].values
        }
        if (zData.hasOwnProperty("topAllTime") && zData.topAllTime != null) {
            if(zData.topAllTime[4].data.length > 0){
                ships_all =  zData.topAllTime[4].data
            }
        }
        let result = await updateCharZ(
            id, 
            zData.shipsDestroyed, 
            zData.shipsLost, 
            zData.soloKills, 
            zData.dangerRatio, 
            zData.gangRatio, 
            shipsSeven,  //top ships
            ships_all,
            zData,
            dt
            )
    }
    // let zData = await limiter.schedule(() => getZkill(id))
    // var shipsSeven = [];
    // var ships_all = [];
    // if(zData.topLists[3].values.length > 0){
    //     shipsSeven =  zData.topLists[3].values
    // }
    // if (zData.hasOwnProperty("topAllTime") && zData.topAllTime != null) {
    //     if(zData.topAllTime[4].data.length > 0){
    //         ships_all =  zData.topAllTime[4].data
    //     }
    // }
    // let result = await updateCharZ(
    //     id, 
    //     zData.shipsDestroyed, 
    //     zData.shipsLost, 
    //     zData.soloKills, 
    //     zData.dangerRatio, 
    //     zData.gangRatio, 
    //     shipsSeven,  //top ships
    //     ships_all,
    //     zData,
    //     dt
    //     )
    res.status(200).json(zData)
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
//used?
async function createReport(ids){
    let report_id = nanoid(10)
    // console.log("Report_ID==>", report_id)
    let iLen = ids.length
        for (let i = 0; i< iLen; i++){
            const result = await reportInsert(report_id, ids[i].id, ids[i].name);
        }
        return report_id
}
//@
// async function insertReport(report_id, report_type, report_data) {
//     var date = new Date()
//     report_dt = date.toISOString().slice(0, 19).replace('T', ' ')
//     // report_data = conToolProm.escape(report_data)
//     report_dataString = report_data.join(',')
//     var sql = 'INSERT INTO `reports` (`report_id`, `report_type`, `report_data`, `report_dt`) VALUES (?,?,?,?)'
//     const [rows, fields] = await conToolProm.query(sql, [report_id, report_type, report_dataString, report_dt])
//     return rows
// }
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
// async function getReportData(report_id) {
//     var sql = 'SELECT * FROM `reports` WHERE `report_id` = ? LIMIT 1'
//     const [rows, fields] = await conToolProm.query(sql, [report_id])
//     return rows
// }
async function getReportData(report_id) {
    try {
        const result = await Reports.findOne({report_id: report_id});
        // console.log("RESULT", result);
        return result;
    } catch (error) {
        console.error("Error saving report:", error);
        throw error;
    }
}
//used?
async function reportInsert(report_id, id, name) {
    // name = conToolProm.escape(name)
    var sql = 'INSERT INTO reports (report_id, char_id, char_name) VALUES ("'+ report_id +'",'+ id +',"'+ name +'")'
    const [rows, fields] = await conToolProm.query(sql)
    return rows
}
//@
// async function reportQuery(report_id) {
//     // var sql = "SELECT reports.report_id, chars.id, chars.name, chars.security, chars.corp_id, chars.corp_name, chars.alliance_id, chars.alliance_name, chars.kills, chars.losses, chars.solo, chars.danger, chars.gang, chars.ships FROM reports JOIN chars ON reports.char_id = chars.id WHERE reports.report_id = '"+ report_id +"'";
//     var sql = 'SELECT `reports`.`report_id`, `chars`.`id`, `chars`.`name`, `chars`.`security`, `chars`.`corp_id`, `chars`.`corp_name`, `chars`.`alliance_id`, `chars`.`alliance_name`, `chars`.`faction_id`, `chars`.`faction_name`, `chars`.`faction_corp`, `chars`.`kills`, `chars`.`losses`, `chars`.`solo`, `chars`.`danger`, `chars`.`gang`, `chars`.`ships` FROM `reports` JOIN `chars` ON `reports`.`report_data` LIKE concat("%", `chars`.`name`, "%") WHERE `reports`.`report_id` = ?';
//     const [rows, fields] = await conToolProm.query(sql, [report_id])
//     // console.log("REPORT-->", Object.values(JSON.parse(JSON.stringify(rows))))
//     return Object.values(JSON.parse(JSON.stringify(rows)))
// }
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
                    "id": "$char_info.id",
                    "name": "$char_info.name",
                    "security": "$char_info.security",
                    "corp_id": "$char_info.corp_id",
                    "corp_name": "$char_info.corp_name",
                    "alliance_id": "$char_info.alliance_id",
                    "alliance_name": "$char_info.alliance_name",
                    "faction_id": "$char_info.faction_id",
                    "faction_name": "$char_info.faction_name",
                    "faction_corp": "$char_info.faction_corp",
                    // "kills": "$char_info.kills",
                    // "losses": "$char_info.losses",
                    // "solo": "$char_info.solo",
                    // "danger": "$char_info.danger",
                    // "gang": "$char_info.gang",
                    // "ships": "$char_info.ships",
                    "kills": {"$literal": 0},
                    "losses": {"$literal": 0},
                    "solo": {"$literal": 0},
                    "danger": {"$literal": 0},
                    "gang": {"$literal": 0},
                    "ships": {"$literal": []},
                    "ships_all": {"$literal": []},
                    "zkill_stats": {"$literal": {}},
                  },
                },
              ]
        );
        // console.log("RESULT", result);
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
    // var sql = 'SELECT IFNULL((SELECT `id` FROM `chars` WHERE `name` = ? LIMIT 1), 0)'
    // const [rows, fields] = await conToolProm.query(sql, [name])
    // console.log("nameQuery==>",Number(Object.values(JSON.parse(JSON.stringify(rows[0])))))
    // return Number(Object.values(JSON.parse(JSON.stringify(rows[0]))))
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
    // var sql = 'SELECT * FROM `chars` WHERE `id` = ? LIMIT 1'
    // const [rows, fields] = await conToolProm.query(sql, [id])
    // return Object.values(JSON.parse(JSON.stringify(rows)))
}
//@
async function insertChar(name, id, security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, kills, losses, solo, danger, gang, ships, ships_all, zData, dt, dt){
    kills = kills ?? 0
    losses = losses ?? 0
    solo = solo ?? 0
    danger = danger ?? 0
    gang = gang ?? 0
    ships = ships ?? []
    ships_all = ships_all ?? []
    zData = zData ?? {}
    // name = conToolProm.escape(name)
    // corpName = conToolProm.escape(corpName)
    // allyName = conToolProm.escape(allyName)
    // ships = JSON.stringify(ships)
    // zData = JSON.stringify(zData)
    console.log("INSERT REPORT",name, id, security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, kills, losses, solo, danger, gang, ships, ships_all,  zData, dt, dt)
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
        ships_all: ships_all,
        zkill_stats: zData,
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
    // var sql = 'INSERT INTO `chars` (`id`, `name`, `security`, `corp_id`, `corp_name`, `alliance_id`, `alliance_name`, `faction_id`, `faction_name`, `faction_corp`, `kills`, `losses`, `solo`, `danger`, `gang`, `ships`, `zkill_stats`, `z_dt`, `char_dt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    // const [rows, fields] = await conToolProm.query(sql, [id, name, security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, kills, losses, solo, danger, gang, ships, zData, dt, dt])
    // return rows
}
//@
async function updateCharZ(id, kills, losses, solo, danger, gang, ships, ships_all, zData, z_dt){
    kills = kills ?? 0
    losses = losses ?? 0
    solo = solo ?? 0
    danger = danger ?? 0
    gang = gang ?? 0
    ships = ships ?? []
    ships_all = ships_all ?? []
    zData = zData ?? {}
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
            char.zkill_stats = zData;
            char.z_dt = z_dt;
            await char.save();
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
    // var sql = 'UPDATE `chars` SET `kills` = ?, `losses` = ?, `solo` = ?, `danger` = ?, `gang` = ?, `ships` = ?, `zkill_stats` = ?, `z_dt` = ? WHERE `id` = ?' 
    // const [rows, fields] = await conToolProm.query(sql, [kills, losses, solo, danger, gang, ships, zData, z_dt, id])
    // return rows
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
    // var sql = 'UPDATE `chars` SET `security` = ?, `corp_id` = ?, `corp_name` = ?, `alliance_id` = ?, `alliance_name` = ?, `faction_id` = ?, `faction_name` = ?, `faction_corp` = ?, `char_dt` = ? WHERE `id` = ?' 
    // const [rows, fields] = await conToolProm.query(sql, [security, corpID, corpName, allyID, allyName, factionID, factionName, factionCorp, char_dt, id])
    return;
}
//@
async function shipQuery() {
    try {
        const result = await Ships.find({});
        // console.log("SHIPS RESULT", result);
        if (result == null){
            return 0;
        } else{
            return result;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
    // var sql = 'SELECT * FROM `ships`'
    // const [rows, fields] = await conToolProm.query(sql)
    // return Object.values(JSON.parse(JSON.stringify(rows)))
}
//@
async function traitQuery() {
    try {
        const result = await Traits2.find();
        console.log("TRAITS RESULT", result);
        if (result == null){
            return 0;
        } else{
            return result;
        }
        } catch (error) {
            console.error("Error getting char:", error);
            throw error;
        }
    // var sql = 'SELECT * FROM `shipTraits`'
    // const [rows, fields] = await conToolProm.query(sql)
    // return Object.values(JSON.parse(JSON.stringify(rows)))
}
//@
async function factionQuery(factionID) {
    var sql = 'SELECT * FROM `chrFactions` WHERE `factionID` = ?'
    const [rows, fields] = await conSDEProm.query(sql, [factionID])
    return Object.values(JSON.parse(JSON.stringify(rows)))
}
module.exports = {
    getHello,
    getChar,
    getID,
    getID2,
    postID,
    getReport,
    prepReport,
    fetchReport,
    fetchShips,
    fetchTraits,
    fetchZkill
}