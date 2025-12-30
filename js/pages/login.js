define(
  ['jquery', 'service/page', 'service/qiscus', 'service/html', 'service/toast'],
  function ($, createPage, qiscus, html, toast) {
    function handleLoginSubmit(event) {
      event.preventDefault();

      var userId = $('#user-id').val().trim();
      var username = $('#username').val().trim();
      var userKey = $('#user-key').val().trim();

      // Validation
      if (!userId) {
        toast.warning('Please enter your User ID');
        return;
      }

      if (!userKey) {
        toast.warning('Please enter your User Key');
        return;
      }

      // Disable button and show loading
      var $btn = $('#submit-login-btn');
      var originalText = $btn.html();
      $btn.prop('disabled', true).html('Signing in...');

      // Attempt login
      qiscus.setUser(userId, userKey, username)
        .then(function (user) {
          toast.success('Welcome back, ' + (username || userId) + '!');
          // Button will be re-enabled by page navigation
        })
        .catch(function (error) {
          console.error('Login error:', error);

          // Re-enable button
          $btn.prop('disabled', false).html(originalText);

          // Parse error message
          var errorMessage = 'Login failed. Please check your credentials';

          if (error && error.message) {
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              errorMessage = 'Invalid User ID or User Key';
            } else if (error.message.includes('network') || error.message.includes('Network')) {
              errorMessage = 'Network error. Please check your connection';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'Request timeout. Please try again';
            }
          }

          toast.error(errorMessage);
        });
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
