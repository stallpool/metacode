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
      if (page === meta.total_page) {
         fn && fn(L);
      }
      once(page + 1, L, fn);
   }).catch((err) => {
      // TODO: deal with errors
   });
}

once(1, [], (L) => {
   L.forEach((item) => {
      console.log(JSON.stringify(item));
   });
});
