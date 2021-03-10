const i_gitlab = require('../src/gitlab');

function once(page, L, fn) {
   const n = 1000;
   i_gitlab.listProjects({
      page: page,
      n: 1000,
   }).then((obj) => {
      const meta = obj.meta;
      obj.items.forEach((item) => {
         L.push(item);
      });
      if (!meta || page >= meta.total_page) {
         fn && fn(L);
         return;
      }
      once(page + 1, L, fn);
   }).catch((err) => {
      // TODO: deal with errors
   });
}

function collectMembers_(project_id, page, L, fn) {
   const n = 1000;
   i_gitlab.listMembers({
      project_id: project_id,
      page: page,
      n: 100,
   }).then((obj) => {
      const meta = obj.meta;
      obj.items.forEach((item) => {
         L.push(item);
      });
      if (!meta || page >= meta.total_page) {
         fn && fn(L);
         return;
      }
      once(page + 1, L, fn);
   }).catch((err) => {
      // TODO: deal with errors
   });
}
async function collectMembers(project_id) {
   return new Promise((r) => {
      collectMembers_(project_id, 1, [], (L) => {
         r(L);
      });
   });
}

async function fill(item) {
   console.error(`- get extra info ...`);
   const pobj = (await i_gitlab.project(item.id)).item;
   item.creator_id = pobj.creator_id;
   item.created_at = pobj.created_at?new Date(pobj.created_at).getTime():0;
   item.empty = pobj.empty_repo;
   item.archived = pobj.archived;
   item.visibility = pobj.visibility;
   if (item.visibility === 'private') {
      console.error(`- [private] project ...`);
      const members = (await collectMembers(item.id)).map((item) => {
         if (item.state !== 'active') return null;
         // access_level, expires_at, name, username, id
         // access_level == 50 -> owner
         return {
            id: item.id,
            name: item.name,
            username: item.username,
            access_level: item.access_level,
         };
      }).filter((x) => !!x);
      item.members = members;
      console.error(`- get active members: ${members.length}`);
   }
   return item;
}

once(1, [], (L) => {
   console.error(`projects: ${L.length}`);
   (async function () {
      for (let i = 0, n = L.length; i < n; i++) {
         console.error(`${i} project: (${L[i].id}) ${L[i].path}`);
         const item = L[i];
         await fill(item);
      }
   })().then(() => {
      console.log(JSON.stringify(L));
   }).catch((err) => {
      console.error(err);
   });
});
