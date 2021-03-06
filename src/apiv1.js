const i_url = require('url');

const i_web = require('./web');
const i_auth = (
   process.env.METACODE_AUTH_MODE?
   (process.env.METACODE_AUTH_MODE === 'ldap'?
      require('./auth/ldap'):
      (process.env.METACODE_AUTH_MODE === 'test'?require('./auth/test'):null)
   ):require('./auth/ldap')
);
const i_p4 = require('./p4');
const i_gitlab = require('./gitlab');
const i_project = require('./project');
const i_user = require('./user');
const i_log = require('./logger');

function parseSearchTarget(target) {
   const uobj = i_url.parse(target);
   const tobj = {};
   tobj.protocol = uobj.protocol;
   tobj.path = `${uobj.host}${uobj.path || ''}`;
   const parts = tobj.path.split('/');
   const last0 = parts.pop();
   const last = last0 || parts.pop();
   if (!last) return null;
   if (last.charAt(0) === '@') {
      tobj.ref = last.substring(1);
   } else {
      parts.push(last);
   }
   switch(tobj.protocol) {
   case 'p4:':
      tobj.server = parts.shift();
      tobj.path = `//${parts.join('/')}`;
      break;
   case 'gitlab:':
      tobj.path = parts.join('/');
      break;
   default:
      return null;
   }
   return tobj;
}

const api = {
   login: i_web.require_json((req, res, options) => {
      const username = options.json.username;
      const password = options.json.password;
      if (!username || !password) return i_web.e400(res);
      i_auth.act(username, password).then((obj) => {
         i_web.rjson(res, obj);
      }).catch((err) => {
         i_web.e401(res);
      });
   }), // login
   logout: i_web.require_login((req, res, options) => {
      i_auth.out(options.json.username, options.json.uuid);
      res.end('ok');
   }, i_auth.check), // logout
   search: i_web.require_login((req, res, options) => {
      const query = options.json.q;
      // target =     p4://depot/path/to/folder/@rev
      //          gitlab://path/to/repo/@ref
      const target = options.json.m;
      if (!query || !target) return i_web.e400(res);
      const tobj = parseSearchTarget(target);
      if (!tobj) return i_web.e400(res);
      const env = {
         n: parseInt(options.json.n || '20', 10),
         page: parseInt(options.json.page || '1', 10),
         ref: options.json.ref || options.json.rev || '',
      };
      if (env.n < 20) env.n = 20; else if (env.n > 100) env.n = 100;
      switch(tobj.protocol) {
      case 'p4:': {
         const config = {
            page: env.page,
            n: env.n,
            query: query,
            server: `${tobj.server}`,
            path: `${tobj.path}/...`,
         };
         if (env.ref) config.changenumber = `${parseInt(env.ref, 10)}`;
         i_log.info(
            options.json.username,
            '--> search: (p4)',
            config.server,
            config.path,
            config.changenumber || '',
            '--|', query
         );
         i_p4.search(config).then((data) => {
            i_web.rjson(res, data);
         }).catch((err) => {
            i_log.error(
               options.json.username,
               '-> search: (p4)',
               config.server, config.path, config.changenumber || '',
               '-!|', query, err
            );
            i_web.rjson(res, { error: 1 });
         });
         break;
      }
      case 'gitlab:': {
         env.origin_path = tobj.path;
         if (tobj.path.startsWith(':')) {
            // e.g. gitlab://:123/@master
            tobj.path = parseInt(tobj.path.substring(1), 10);
            const project = i_project.listByServer('gitlab').filter(
               (project) => project.id === tobj.path
            )[0];
            // TODO: prevent search in unregistered projects?
            // if (!project) return i_web.e400(res);
            if (project) env.origin_path = project.path;
         } else {
            // e.g. gitlab://path/to/repo/@master
            const project = i_project.listByServer('gitlab').filter(
               (project) => project.path === tobj.path
            )[0];
            if (!project) return i_web.e400(res);
            tobj.path = project.id;
         }
         const config = {
            page: env.page,
            n: env.n,
            query: query,
            project_id: tobj.path,
         };
         if (env.ref) config.ref = env.ref;
         i_log.info(
            options.json.username,
            '--> search: (gitlab)',
            config.project_id, env.origin_path, config.ref || '',
            '--|', query
         );
         i_gitlab.search(config).then((data) => {
            i_web.rjson(res, data);
         }).catch((err) => {
            i_log.error(
               options.json.username,
               '--> search: (gitlab)',
               config.project_id, config.ref || '',
               '-!|', query, err
            );
            i_web.rjson(res, { error: 1 });
         });
         break;
      }
      default:
         return i_web.e400(res);
      }
   }, i_auth.check), // search
};

module.exports = api;
