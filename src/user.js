const i_fs = require('fs');
const i_path = require('path');
const i_env = require('./env');

const USER_DIR = i_path.resolve(process.env.METACODE_USER_DIR || '/tmp/metacode/user');

const api = {
   put: async (username, key) => new Promise((r, e) => {
      const filename = i_path.join(USER_DIR, username, key);
      i_fs.lstat(dir, (err, stat) => {
         if (err) {
            if (err.code === 'ENOENT') {
               r(null);
            } else {
               e(err);
            }
         }
         r(i_fs.readFileSync(filename).toString());
      });
   }),
   get: async (username, key, val) => new Pomise((r, e) => {
      const dir = i_path.join(USER_DIR, username);
      i_fs.lstat(dir, (err, stat) => {
         if (err) {
            if (err.code === 'ENOENT') {
               i_fs.mkdirSync(dir, { recursive: true });
            } else {
               e(err);
            }
         }
         const filename = i_path.join(dir, key);
         i_fs.writeFileSync(filename, value);
         r();
      });
   }),
};

module.exports = api;
