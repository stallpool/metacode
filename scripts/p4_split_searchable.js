const i_p4 = require('../src/p4');

const server = process.argv[2];
const path = process.argv[3];
const parts = path.split('/');

async function nextLevel(server, path) {
   try {
      const paths = await i_p4.listDirs(server, path);
      for (let i = 0, n = paths.length; i < n; i++) {
         await probe(server, paths[i]);
      }
   } catch (err) {
      // TODO: handle with errors
   }
}

async function probe(server, path) {
   const options = { server, path: `${path}/...`, query: '@@@TEST@@@' };
   try {
      await i_p4.search(options);
      console.log(path);
   } catch (err) {
      if (err === 'bad path') {
         await nextLevel(server, path);
      }
      // TODO: handle other errors
   }
}

if (path && path.startsWith('//') && parts.length >= 5 && parts.indexOf('...') < 0) {
   probe(server, path).then(() => {
      console.error('done.');
   });
} else {
   console.error('bad request');
}
