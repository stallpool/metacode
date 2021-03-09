const i_ldap = require('ldapjs');
const i_uuid = require('uuid');

const i_env = require('../env');
const EXPIRATION_MS = i_env.config.session_expiration_ms || (2 * 24 * 3600 * 1000);

const authSession = {};

async function authenticateForLDAP(username, password) {
   return new Promise((r, e) => {
      if (!username || !password) return reject({username, error: "invalid"});
      const client = i_ldap.createClient({
         url: i_env.config.ldap_server
      });
      client.bind(`${username}@${i_env.config.ldap_domain}`, password, (error) => {
         client.unbind();
         if (error) {
            e({username, error: "invalid"});
         } else {
            const uuid = i_uuid.v4();
            const key = `${username}:${uuid}`;
            const now = new Date().getTime();
            authSession[key] = {
               loginAt: now,
               lastActivityAt: now,
            };
            r({username, uuid});
         }
      });
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
   act: authenticateForLDAP,
};
