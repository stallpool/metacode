const i_url = require('url');
const i_https = require('https');
const i_http = require('http');

const api = {
   act: async (url, options) => new Promise((r, e) => {
      const uobj = i_url.parse(url);
      const isHttps = uobj.protocol === 'https:'?true:false;
      const httpRef = isHttps?i_https:i_http;
      const reqObj = Object.assign({
         method: 'GET',
         hostname: uobj.hostname,
         port: uobj.port || (isHttps?443:80),
         path: uobj.path,
         agent: false,
      }, options);
      httpRef.get(reqObj, (res) => {
         r(res);
      }).on('error', (err) => {
         e(err);
      });
   }), //get
   readData: async (rex) => new Promise((r, e) => {
      // TODO: limit data size
      const env = {
         buf: [],
         err: false,
      };
      rex.on('data', (chunk) => env.buf.push(chunk));
      rex.on('end', () => {
         if (!rex.complete) {
            env.err = true;
            e('not complete');
         }
         if (env.err) return;
         r(Buffer.concat(env.buf));
      });
      rex.on('error', (err) => {
         env.err = true;
         e(err);
      });
   }), // readReqData
};

module.exports = api;
