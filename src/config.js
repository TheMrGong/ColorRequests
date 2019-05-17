//@ts-check

//@ts-ignore
const loadedConfig = require("../config.json")

const config = {
    "token": "",
    "prefix": "-",
    "deleteMessagesAfter": 10000,
    "mysql": {
        "host": "localhost",
        "port": 3306,
        "database": "colorrequests",
        "username": "root",
        "password": ""
    }
}

for (let k in loadedConfig)
    config[k] = loadedConfig[k]

module.exports = config
