require('dotenv').config()
const request = require('./request');



const swag = class {
    constructor({
        token = ''
    }) {
        if (process.env.SWAG_TOKEN != ''){
            token = process.env.SWAG_TOKEN
        }
    }
    universe = {
        nToI(names){
            return request({
                subUrl: `universe/ids`,
                requestType: 'post',
                body: names
            })
        }
    }
    character = {
        affiliation(characterIdArray){
            return request({
                subUrl: 'characters/affiliation',
                requestType: 'post',
                body: characterIdArray
            })
        },
        info(characterID){
            return request({
                subUrl: `characters/${characterID}`
            })
        }
    }
    corporation = {
        info(corpID){
            return request ({
                subUrl: `corporations/${corpID}`
            })
        }
    }
    alliance = {
        info(allianceID){
            return request({
                subUrl: `alliances/${allianceID}`
            })
        }
    }
}

module.exports = swag