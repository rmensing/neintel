const axios = require('axios')
const {URLSearchParams} = require('node:url')
var differenceInSeconds = require('date-fns/differenceInSeconds')
const md5 = require('md5');
const {
    rClient
} = require('../config/db')

async function makeRequest({
    subUrl,
    body,
    query,
    requestType = 'get',
    needsAuth = false
}) {
    const link = process.env.SWAG_LINK;
    const token = process.env.SWAG_TOKEN;
    const lang = process.env.SWAG_LANG;
    const progName = process.env.SWAG_NAME;
    var expires = "";
    let headers = {
        'accept': 'application/json',
        'Accept-Language': `${lang}`,
        'Content-Type': 'application/json'
    }
    let request
    let fullURL = `${link}${subUrl}/?datasource=tranquility`

    if (query) {
        fullURL += `?${new URLSearchParams(query).toString()}` // URLSearchParams doesn't add the beginning "?"
    }

    if (lang !== '') {
        fullURL += `&language=${lang.split('/').join('-')}`
    }
    // and the auth token if needed
    if (needsAuth && token !== '') {
        // Include both the headers and the query just in case one or the other fails
        headers['authorization'] = `Bearer: ${token}`
        fullURL += `&token=${token}`
    } else if (needsAuth && token === '') {
        console.log("Missing token")
    }

    var urlHash = md5(fullURL);
    if (body != null && body != undefined){
        // console.log("BODY:", body.toString())
        var bodyHash = md5(body.toString());
        var fullHash = urlHash + '-' + bodyHash;
    } else {
        fullHash = urlHash;
    }

    var value = await rClient.get(fullHash);
    console.log("REDIS1:", fullURL, urlHash);
    console.log("REDIS2:", body, bodyHash);
    console.log("REDIS3:", fullHash, value);
    if (value === null){
        headers['x-user-agent'] = `${progName}`;

        switch (requestType.toUpperCase()) {
            case 'GET': {
                request = await axios.get(fullURL, {
                    headers
                })
                break;
            }
            case 'POST': {
                request = await axios.post(fullURL, body, {
                    headers
                })
                break;
            }
            case 'PUT': {
                request = await axios.put(fullURL, body, {
                    headers
                })
                break;
            }
            case 'DELETE': {
                request = await axios.delete(fullURL, body, {
                    headers
                })
                break;
            }
            default: {
                const url = fullURL.split('&token')[0]
                console.log(`REQUEST ERROR: Endpoint function not configured properly.` , url);

            }
        }
        // console.log("REQUEST:", request.data, request.headers)
        if (request.headers.expires !== undefined){
            expires = differenceInSeconds(Date.parse(request.headers.expires),Date.parse(request.headers.date) )
            console.log("DATE:", differenceInSeconds(Date.parse(request.headers.expires),Date.parse(request.headers.date)))
        } else {
            expires = 1800;
        }
        console.log("REDIS2:",fullHash, expires, JSON.stringify(request.data))
        await rClient.set(fullHash, JSON.stringify(request.data),{EX: expires});
    } else {
        result = await rClient.get(fullHash);
        request = {
            data: JSON.parse(result)
        }
    }
    // console.log("REQUEST0:", request)
    // console.log("REQUEST2:", request.data, request.headers)
    return request
        // .then(response => {
        //     let data = {
        //         headers: response.headers,
        //         data: response.data
        //     }

        //     return data
        // }).catch(error => {
        //     if (error.response) { // if its a error from ESI
        //         const esiError = `${error.response.data.error}${error.response.data.error_description}`
        //         const url = fullURL.split('&token')[0]
        //         console.log(esiError, `ESI_ERROR`, url)
        //     }
        //     // if its another error, just send the full error
        //     console.log(error, 'ESIJS_ERROR')
        // })
}

module.exports = makeRequest