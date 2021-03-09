const api = {
   info: (...args) => {
      console.log(`[${new Date().toISOString()}] INFO`, ...args);
   },
   error: (...args) => {
      console.error(`[${new Date().toISOString()}] ERRO`, ...args);
   }
};

module.exports = api;
