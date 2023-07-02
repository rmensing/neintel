require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose');
const redis = require('redis');

const mongoString = process.env.MONGODB_URL
const rHost = process.env.REDIS_HOST
const rPort = process.env.REDIS_PORT
const rUname = process.env.REDIS_UNAME
const rPass = process.env.REDIS_PASS

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
    evetoolsDB,
    rClient
}