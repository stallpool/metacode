const i_ldap = require('ldapjs');
const i_uuid = require('uuid');

const i_env = require('../env');
const EXPIRATION_MS = i_env.config.session_expiration_ms || (2 * 24 * 3600 * 1000);

const authSession = {};

async function authenticateForTest(username, password) {
   return new Promise((r, e) => {
      if (!username || !password || username !== 'test' || password != 'test') {
         return reject({username, error: "invalid"});
      }
      const uuid = 'test';
      const key = `${username}:${uuid}`;
      const now = new Date().getTime();
      authSession[key] = {
         loginAt: now,
         lastActivityAt: now,
      };
      r({username, uuid});
   });
}

module.exports = {
   check: (username, uuid) => {
      const key = `${username}:${uuid}`;
      const obj = authSession[key];
      if (!obj) return false;
      if (!obj.lastActivityAt) {
         delete authSession[key];
         return false;
      }
      const now = new Date().getTime();
      if (now - obj.lastActivityAt > EXPIRATION_MS) {
         delete authSession[key];
         return false;
      }
      obj.lastActivityAt = now;
      return true;
   },
   out: (username, uuid) => {
      const key = `${username}:${uuid}`;
      const obj = authSession[key];
      delete authSession[key];
   },
   act: authenticateForTest,
};
