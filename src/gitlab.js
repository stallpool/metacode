const i_env = require('./env');
const i_req = require('./request');

const api = {
   listProjects: async (options) => {
      options = options || {};
      options.page = parseInt(options.page || '1', 10);
      options.n = parseInt(options.n || '20', 10);
      const url = (
         `${i_env.config.gitlab.url}/api/v4/projects/` +
         `?page=${options.page}&per_page=${options.n}&simple=true`
      );
      const res = await i_req.act(url, {
         headers: {
            'PRIVATE-TOKEN': i_env.config.gitlab.token,
         }
      });
      const obj = JSON.parse(await i_req.readData(res));
      const meta = {
         n: parseInt(res.headers['x-per-page'], 10),
         page: parseInt(res.headers['x-page'], 10),
         total: parseInt(res.headers['x-total'], 10),
         total_page: parseInt(res.headers['x-total-pages'], 10),
      };
      const items = obj.map((item) => ({
         id: item.id,
         path: item.path_with_namespace,
         branch: item.default_branch,
         url: item.web_url,
         fork_n: item.forks_count,
         star_n: item.star_count,
         created_at: new Date(item.created_at),
         last_activity_at: new Date(item.last_activity_at),
      }));
      return { meta, items };
   }, // listProjects
   search: async (options) => {
      options = options || {};
      if (!options.project_id || !options.query) throw 'bad request';
      options.scope = options.scope || 'blobs';
      options.page = parseInt(options.page || '1', 10);
      options.n = parseInt(options.n || '20', 10);
      const refOption = options.ref?`&ref=${options.ref}`:''
      const url = (
         i_env.config.gitlab.url +
         `/api/v4/projects/${options.project_id}/search` +
         `?search=${encodeURIComponent(options.query)}` +
         `&scope=${options.scope}${refOption}` +
         `&page=${options.page}&per_page=${options.n}`
      );
      const res = await i_req.act(url, {
         headers: {
            'PRIVATE-TOKEN': i_env.config.gitlab.token,
         }
      });
      const obj = JSON.parse(await i_req.readData(res));
      const meta = {
         n: parseInt(res.headers['x-per-page'], 10),
         page: parseInt(res.headers['x-page'], 10),
         total: parseInt(res.headers['x-total'], 10),
         total_page: parseInt(res.headers['x-total-pages'], 10),
      };
      const items = obj.map?obj.map((item) => ({
         path: item.path,
         ref: item.ref,
         startline: item.startline,
         data: item.data,
      })):[];
      return { meta, items };
   }, // search
};

module.exports = api;
