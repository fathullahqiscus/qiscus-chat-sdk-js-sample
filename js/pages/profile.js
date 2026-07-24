define([
  'jquery',
  'service/page',
  'service/route',
  'service/content',
  'service/qiscus'
], function ($, createPage, route, $content, qiscus) {
  var avatarBlobURL = null;
  var pendingAppId = null;

  function LogoutConfirm() {
    return `
      <div class="LogoutConfirm" style="display:none;">
        <div class="modal-overlay"></div>
        <div class="modal-content-simple">
          <h3 class="modal-title">Log out</h3>
          <p class="modal-description">Are you sure you want to log out from this account?</p>
          <div class="modal-actions">
            <button type="button" id="cancel-logout-btn" class="btn-cancel">Cancel</button>
            <button type="button" id="confirm-logout-btn" class="btn-danger">Log out</button>
          </div>
        </div>
      </div>
    `;
  }

  function ChangeAppIdConfirm() {
    return `
      <div class="ChangeAppIdConfirm" style="display:none;">
        <div class="modal-overlay"></div>
        <div class="modal-content-simple">
          <h3 class="modal-title">Change App ID</h3>
          <p class="modal-description">
            Changing the App ID will log you out and reload the page with the new App ID. Continue?
          </p>
          <div class="modal-actions">
            <button type="button" id="cancel-change-app-id-btn" class="btn-cancel">Cancel</button>
            <button type="button" id="confirm-change-app-id-btn" class="btn-danger">Change App ID</button>
          </div>
        </div>
      </div>
    `;
  }

  function template() {
    var avatarURL = qiscus.userData.avatar_url;
    var username = qiscus.userData.username;
    var userId = qiscus.userData.email;
    var currentAppId = window.APP_ID || localStorage.getItem('qiscus_app_id') || '';
    return `
      <div class="Profile">
        ${LogoutConfirm()}
        ${ChangeAppIdConfirm()}
        <div class="toolbar">
          <button id="back-btn" type="button">
            <i class="icon icon-arrow-left-green"></i>
          </button>
          <div class="toolbar-title">Profile</div>
          <button id="logout-btn" type="button" class="power-btn" title="Log out">
            <i class="icon icon-power"></i>
          </button>
        </div>
        <div class="avatar-container">
          <input id="input-avatar" type="file" accept="image/*" class="hidden">
          <img class="profile-avatar" src="${avatarURL}" alt="${userId}">
          <div class="change-avatar-container">
            <button id="avatar-picker-btn" type="button">
              <i class="icon icon-avatar-picker"></i>
            </button>
          </div>
        </div>
        <div class="info-container">
          <div class="info-header">
            Information
          </div>
          <div class="field-group">
            <div class="icon-container">
              <i class="icon icon-user"></i>
            </div>
            <input id="input-user-name" type="text" value="${username}" disabled>
            <button id="edit-name-btn" type="button">
              <i class="icon icon-pencil-grey"></i>
            </button>
          </div>
          <div class="field-group">
            <div class="icon-container">
              <i class="icon icon-id-card"></i>
            </div>
            <input id="input-user-id" type="text" value="${userId}" disabled>
          </div>
          <div class="field-group">
            <div class="icon-container">
              <i class="icon icon-hash"></i>
            </div>
            <input id="input-app-id" type="text" value="${currentAppId}" disabled>
            <button id="edit-app-id-btn" type="button">
              <i class="icon icon-pencil-grey"></i>
            </button>
          </div>
          <div class="spacer"></div>
        </div>
      </div>
    `;
  }

  function bindEvents($content) {
    $content
      .off('.Profile')
      .on('click.Profile', '.Profile #back-btn', function (event) {
        event.preventDefault();
        route.push('/chat');
      })
      .on('click.Profile', '.Profile #avatar-picker-btn', function () {
        $content.find('#input-avatar').click();
      })
      .on('change.Profile', '.Profile #input-avatar', function (event) {
        var file = Array.from(event.target.files).pop();
        if (avatarBlobURL != null) URL.revokeObjectURL(avatarBlobURL);
        avatarBlobURL = URL.createObjectURL(file);
        $content.find('.profile-avatar').attr('src', avatarBlobURL);

        qiscus.upload(file, function (err, progress, url) {
          if (err) return console.error('error when uploading new avatar', err);
          if (progress) return console.info('uploading avatar', progress.percent);
          if (url) {
            qiscus.userData.avatar_url = url;
            qiscus.updateProfile({ avatar_url: url }).then(function () {
              URL.revokeObjectURL(avatarBlobURL);
            });
          }
        });
      })
      .on('click.Profile', '.Profile #edit-name-btn', function (event) {
        event.preventDefault();
        $content
          .find('#input-user-name')
          .removeAttr('disabled')
          .focus();
        $(this).addClass('hidden');
      })
      .on('keydown.Profile', '.Profile #input-user-name', function (event) {
        if (event.keyCode === 13) {
          $(this).attr('disabled', true);
          $content.find('#edit-name-btn').removeClass('hidden');
          var newName = event.target.value;
          qiscus.updateProfile({ name: newName }).then(function () {
            qiscus.userData.username = newName;
            localStorage.setItem('authdata', JSON.stringify(qiscus.userData));
          });
        }
      })
      .on('click.Profile', '.Profile #edit-app-id-btn', function (event) {
        event.preventDefault();
        $content
          .find('#input-app-id')
          .removeAttr('disabled')
          .focus();
        $(this).addClass('hidden');
      })
      .on('keydown.Profile', '.Profile #input-app-id', function (event) {
        if (event.keyCode !== 13) return;

        var newAppId = event.target.value.trim();
        var currentAppId = window.APP_ID || localStorage.getItem('qiscus_app_id') || '';

        $(this).attr('disabled', true);
        $content.find('#edit-app-id-btn').removeClass('hidden');

        if (!newAppId || newAppId === currentAppId) {
          $(this).val(currentAppId);
          return;
        }

        pendingAppId = newAppId;
        $content.find('.ChangeAppIdConfirm').fadeIn(200);
      })
      .on('click.Profile', '.Profile #cancel-change-app-id-btn, .Profile .ChangeAppIdConfirm .modal-overlay', function (event) {
        event.preventDefault();
        pendingAppId = null;
        var currentAppId = window.APP_ID || localStorage.getItem('qiscus_app_id') || '';
        $content.find('#input-app-id').val(currentAppId);
        $content.find('.ChangeAppIdConfirm').fadeOut(200);
      })
      .on('click.Profile', '.Profile #confirm-change-app-id-btn', function (event) {
        event.preventDefault();
        if (!pendingAppId) return;

        localStorage.setItem('qiscus_app_id', pendingAppId);
        localStorage.removeItem('authdata');

        window.location.reload();
      })
      .on('click.Profile', '.Profile #logout-btn', function (event) {
        event.preventDefault();
        $content.find('.LogoutConfirm').fadeIn(200);
      })
      .on('click.Profile', '.Profile #cancel-logout-btn, .Profile .LogoutConfirm .modal-overlay', function (event) {
        event.preventDefault();
        $content.find('.LogoutConfirm').fadeOut(200);
      })
      .on('click.Profile', '.Profile #confirm-logout-btn', function (event) {
        event.preventDefault();

        console.log('🔴 Logging out... isLogin before:', qiscus.isLogin);

        // Manually clear authentication state
        qiscus.isLogin = false;
        qiscus.userData = {};

        // Clear localStorage
        localStorage.removeItem('authdata');

        try {
          // Disconnect from Qiscus
          qiscus.disconnect();
        } catch (error) {
          // Ignore disconnect errors - they're expected when terminating connections
          console.log('Disconnect error (expected):', error.message);
        }

        console.log('🔴 Logged out. isLogin after:', qiscus.isLogin);

        $content.find('.LogoutConfirm').fadeOut(200);

        // Show success toast
        toast.success('Logged out successfully');

        // Redirect to login after clearing state
        setTimeout(function () {
          route.push('/login');
        }, 200);
      });
  }

  return createPage({
    path: '/profile',
    template: template,
    bindEvents: bindEvents
  });
});
