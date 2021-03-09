const i_cp = require('child_process');

async function act(cmd, eachLineFn, ...args) {
   return new Promise((r, e) => {
      const env = {
         err: false,
         last: null,
      };
      const p = i_cp.exec(cmd, (error, stdout, stderr) => {
         if(error) {
            env.err = true;
            return e(error);
         }
         r();
      });
      p.stdout.on('data', (chunk) => {
         const lines = ((env.last || '') + chunk.toString()).split('\n');
         env.last = lines.pop();
         lines.forEach((line) => {
            eachLineFn(line, ...args);
         });
      });
      /*p.stderr.on('data', (stderr) => {
         // deal with stderr data
      });*/
      p.on('exit', (code) => {
         if (env.last) eachLineFn(env.last, ...args);
      });
   });
}

const api = {
   act,
};

module.exports = api;
