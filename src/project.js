const i_fs = require('fs');
const i_path = require('path');

/*
 jsonlist: <each line>
    { id, path, server, private, branch }
    p4: { id:-1, path://depot/project/version, branch:, server:perforce.com:1666 }
    gitlab: { id:1, path:test/test, branch:master }
    private = null | ["username"]
 */
const env = {
   jsonlist: process.env.METACODE_PROJECT_JSONLIST,
   timer: 0,
   projectList: {
      items: { /* serverName: [] */ },
      mtime: 0,
   },
};

function startWatch(intervalMs) {
   if (!env.jsonlist) return false;
   intervalMs = intervalMs || (10 * 1000);
   if (env.timer) return true;
   syncProjectList();
   env.timer = setInterval(() => {
      syncProjectList();
   }, intervalMs);
   return true;
}

function stopWatch() {
   if (env.timer) clearInterval(env.timer);
   env.timer = 0;
}

function getProjectList() {
   return env.projectList.items;
}

function getServerProjectList(server) {
   return env.projectList.items[server] || [];
}

function syncProjectList() {
   if (!env.jsonlist) return;
   i_fs.lstat(env.jsonlist, (err, stat) => {
      if (err) return;
      const mtime = stat.mtimeMs;
      if (mtime <= env.projectList.mtime) return;
      i_fs.readFile(env.jsonlist, (err, raw) => {
         if (err) {
            console.error(`failed to update project list ...`, err);
            return;
         }
         env.projectList.items = {};
         raw.toString().split('\n').forEach((line) => {
            if (!line) return;
            const obj = JSON.parse(line);
            const server = obj.server || 'gitlab';
            delete obj.server;
            if (!env.projectList.items[server]) env.projectList.items[server] = [];
            env.projectList.items[server].push(obj);
         });
         env.projectList.mtime = mtime;
         console.error(`project list is updated ...`);
      });
   });
}

module.exports = {
   _debug: env,
   startWatch,
   stopWatch,
   sync: syncProjectList,
   list: getProjectList,
   listByServer: getServerProjectList,
};
