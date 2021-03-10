const i_gitlab = require('../src/gitlab');

const project_id = process.argv[2];

function once(page, L, fn) {
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

once(1, [], (L) => {
   console.log(JSON.stringify(L));
});
