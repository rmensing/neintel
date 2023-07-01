require('dotenv').config()

const express = require('express')
const mysql = require('mysql2')
const mongoose = require('mongoose');
const redis = require('redis');

const mongoString = process.env.MONGODB_URL
const rHost = process.env.REDIS_HOST
const rPort = process.env.REDIS_PORT
const rUname = process.env.REDIS_UNAME
const rPass = process.env.REDIS_PASS

const conSDE = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: 'sdeyaml',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0
})

const conTool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: 'evetools',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0
})
const conSDEProm = conSDE.promise();
const conToolProm = conTool.promise();

mongoose.connect(
    mongoString,
    {
        authSource: "admin",
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
    );
const evetoolsDB = mongoose.connection;

evetoolsDB.on('error', (error) => {
    console.log(error)
})

evetoolsDB.once('connected', () => {
    console.log('Database Connected');
})

const rClient = redis.createClient({
    socket: {
        host: rHost,
        port: rPort
    },
    username: rUname,
    password: rPass
});
rClient.on('error', err => console.log('Redis Client Error', err));

rClient.connect();
rClient.on('ready', () => console.log("Redis client connected"))

module.exports = {
    conSDE,
    conTool,
    conSDEProm,
    conToolProm,
    evetoolsDB,
    rClient
}