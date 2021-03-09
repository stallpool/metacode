// p4 grep -n -A 1 -B 1 -e 'test' //depot/path/to/repo/...

// Perforce password (P4PASSWD) invalid or unset.

const i_env = require('./env');
const i_exec = require('./exec');
const P4BIN = process.env.P4BIN || 'p4';
const P4USER = ((i_env.config.perforce || {}).user) || process.env.P4USER || process.env.USER;

const api = {
   search: async (options) => {
      options = options || {};
      if (!options.query || !options.path || !options.server) throw 'bad request';
      if (options.changenumber) options.changenumber = parseInt(options.changenumber, 10);
      const prefix = P4USER?`P4USER=${P4USER} `:'';
      const suffix = options.changenumber?`@${options.changenumber}`:''
      // shell safe transform: 'test' -> '"'"'test'"'"'
      const query = options.query.replace(/'/g, '\'"\'"\'').replace(/[\n]/g, '\\n');
      // TODO: normalize query, path, server to make sure safe
      // TODO: how to deal with long line, for example json in one line, where length > 1G
      const cmd = (
         `${prefix} P4PORT=${options.server} ${P4BIN} grep -n -A 1 -B 1 -e '${query}' ` +
         `${options.path}${suffix}`
      );
      const env = { err: false };
      const items = [{}]; // { ref, path, data, startline }
      await i_exec.act(cmd, (line) => {
         if (!line) return;
         if (line === '--') {
            items.push({});
            return;
         }
         const env = { parts: null };
         const item = items[items.length-1];
         env.parts = line.split('#');
         const path = env.parts[0];
         env.parts = env.parts[1].split(/[:\-]/);
         const rev = env.parts[0];
         const linenumber = env.parts[1];
         const text = line.substring(path.length + 1 + rev.length + 1 + linenumber.length + 1);
         // TODO: do we check item.path === path
         if (item.path) {
            item.data += '\n' + text;
         } else {
            item.path = path;
            item.ref = options.changenumber || '';
            item.rev = parseInt(rev, 10);
            item.startline = parseInt(linenumber, 10);
            item.data = text;
         }
      }).catch((err) => {
         if (err.message.indexOf('Grep revision limit exceeded (over 10000)') >= 0) {
            env.err = 'bad path';
            return;
         }
         if (err.message.indexOf('Perforce password (P4PASSWD) invalid or unset.') >= 0) {
            env.err = 'bad config';
            console.error('[!] p4 tickets are expired ...');
            return;
         }
         env.err = err;
      });
      if (env.err) throw env.err;
      return {
         meta: {
            n: items.length,
            page: 1,
            total: items.length,
            total_page: 1
         },
         items
      };
   }, // search
};

module.exports = api;
