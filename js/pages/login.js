define(
  ['jquery', 'service/page', 'service/qiscus', 'service/html'],
  function ($, createPage, qiscus, html) {
    function handleLoginSubmit(event) {
      event.preventDefault();
      var userId = $('#user-id').val();
      var username = $('#username').val();
      var userKey = $('#user-key').val();
      if (!userId || !userKey) return;
      qiscus.setUser(userId, userKey, username);
    }

    function bindEvents($content) {
      $content.off('submit.LoginPage').on('submit.LoginPage', '#LoginForm', handleLoginSubmit);
    }

    function template() {
      return html`
        <div class="LoginPage">
          <div class="login-card">
            <div class="login-header">
              <div class="eyebrow">Welcome back</div>
              <div class="title">Sign in to start chatting</div>
              <p class="subtitle">
                Use your sandbox credentials to explore conversations with the refreshed interface.
              </p>
            </div>
            <form id="LoginForm" class="login-form">
              <div class="form-group">
                <label for="user-id">User ID</label>
                <input id="user-id" type="text" name="user-id" value="guest-101" autocomplete="off" />
              </div>
              <div class="form-group">
                <label for="username">Username</label>
                <input id="username" type="text" name="username" value="guest-101" autocomplete="off" />
              </div>
              <div class="form-group">
                <label for="user-key">User Key</label>
                <input id="user-key" type="password" name="user-key" value="passkey" />
              </div>
              <button type="submit" id="submit-login-btn" class="primary-btn">
                Start chatting <i class="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>
        </div>
      `;
    }

    return createPage({
      path: '/login',
      template: template,
      bindEvents: bindEvents,
    });
  }
);
