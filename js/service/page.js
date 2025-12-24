define(['service/content'], function ($content) {
  /**
   * Factory to build page objects with a consistent interface.
   * It keeps event bindings idempotent and separates rendering from mounting.
   */
  return function createPage({ path, template, bindEvents, onMount }) {
    var hasBoundEvents = false;

    function ensureBoundEvents() {
      if (hasBoundEvents || typeof bindEvents !== 'function') return;
      bindEvents($content);
      hasBoundEvents = true;
    }

    return {
      path: path,
      render: function (state) {
        ensureBoundEvents();
        return template(state || {});
      },
      mount: function (state) {
        ensureBoundEvents();
        if (typeof onMount === 'function') {
          onMount($content, state || {});
        }
      },
    };
  };
});
