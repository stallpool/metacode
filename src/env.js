const i_fs = require('fs');

const config = (
   i_fs.existsSync(process.env.METACODE_CONFIG)?
   JSON.parse(i_fs.readFileSync(process.env.METACODE_CONFIG)):
   { /* default value here */ }
);

const api = {
   config
};

module.exports = api;
