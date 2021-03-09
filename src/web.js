const Web = {
   check_admin: (username) => {
      return (i_env.config.admins || []).indexOf(username) >= 0;
   },
   require_json: (fn /*req, res, options{json}*/) => {
      return (req, res, options) => {
         Web.read_request_json(req).then(
            (json) => {
               options.json = json;
               return fn(req, res, options);
            },
            () => Web.e400(res)
         );
      }
   },
   require_login: (fn /*req, res, options{json}*/, checkFn) => {
      // TODO: man-in-the-middle attack issue
      return (req, res, options) => {
         Web.read_request_json(req).then(
            (json) => {
               if (!checkFn(json.username, json.uuid)) return Web.e401(res);
               options.json = json;
               return fn(req, res, options);
            },
            () => Web.e400(res)
         );
      };
   },
   require_admin_login: (fn /*req, res, options{json}*/, checkFn) => {
      // TODO: man-in-the-middle attack issue
      return (req, res, options) => {
         Web.read_request_json(req).then(
            (json) => {
               if (!checkFn(json.username, json.uuid)) return Web.e401(res);
               if (!Web.check_admin(json.username)) return Web.e401(res);
               options.json = json;
               return fn(req, res, options);
            },
            () => Web.e400(res)
         );
      };
   },
   require_json_batch: (group) => {
      Object.keys(group).forEach((name) => {
         if (!group[name]) return;
         switch(typeof(group[name])) {
            case 'function':
            group[name] = Web.require_json(group[name]);
            break;
            case 'object':
            Web.require_json_batch(group[name]);
            break;
         }
      });
   },
   require_login_batch: (group) => {
      Object.keys(group).forEach((name) => {
         if (!group[name]) return;
         switch(typeof(group[name])) {
            case 'function':
            group[name] = Web.require_login(group[name]);
            break;
            case 'object':
            Web.require_login_batch(group[name]);
            break;
         }
      });
   },
   require_admin_login_batch: (group) => {
      Object.keys(group).forEach((name) => {
         if (!group[name]) return;
         switch(typeof(group[name])) {
            case 'function':
            group[name] = Web.require_admin_login(group[name]);
            break;
            case 'object':
            Web.require_admin_login_batch(group[name]);
            break;
         }
      });
   },
   get_request_ip: (req) => {
      let ip = null;
      if (req.headers['x-forwarded-for']) {
         ip = req.headers['x-forwarded-for'].split(",")[0];
      } else if (req.connection && req.connection.remoteAddress) {
         ip = req.connection.remoteAddress;
      } else {
         ip = req.ip;
      }
      return ip;
   },
   read_request_binary: (req) => {
      return new Promise((resolve, reject) => {
         let body = [];
         req.on('data', (chunk) => { body.push(chunk); });
         req.on('end', () => {
            body = Buffer.concat(body);
            resolve(body);
         });
         req.on('error', reject);
      });
   },
   read_request_json: (req) => {
      return new Promise((resolve, reject) => {
         Web.read_request_binary(req).then((buf) => {
            try {
               body = JSON.parse(buf.toString());
               resolve(body);
            } catch(e) {
               reject(e);
            }
         }, reject);
      });
   },
   rjson: (res, json) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(json?JSON.stringify(json):'{}');
   },
   r200: (res, text) => {
      res.writeHead(200, text || null);
      res.end();
   },
   e400: (res, text) => {
      res.writeHead(400, text || 'Bad Request');
      res.end();
   },
   e401: (res, text) => {
      res.writeHead(401, text || 'Not Authenticated');
      res.end();
   },
   e403: (res, text) => {
      res.writeHead(403, text || 'Forbbiden');
      res.end();
   },
   e404: (res, text) => {
      res.writeHead(404, text || 'Not Found');
      res.end();
   },
   e405: (res, text) => {
      res.writeHead(405, text || 'Not Allowed');
      res.end();
   },
   exxx: (res, code, text) => {
      res.writeHead(code, text);
      res.end();
   },
};

module.exports = Web;
