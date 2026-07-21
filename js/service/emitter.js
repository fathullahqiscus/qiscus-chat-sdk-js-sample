// Taken from mitt https://github.com/developit/mitt

define(function () {
  function mitt(all) {
    all = all || Object.create(null);

    return {
      on(type, handler) {
        (all[type] || (all[type] = [])).push(handler);
      },
      off(type, handler) {
        if (all[type]) {
          all[type].splice(all[type].indexOf(handler) >>> 0, 1);
        }
      },
      emit(type, evt) {
        (all[type] || []).slice().map(function (handler) {
          try {
            handler(evt);
          } catch (err) {
            console.error('Error in event handler for "' + type + '":', err);
          }
        });
        (all['*'] || []).slice().map(function (handler) {
          try {
            handler(type, evt);
          } catch (err) {
            console.error('Error in wildcard event handler for "' + type + '":', err);
          }
        });
      }
    }
  }

  return mitt()
})
