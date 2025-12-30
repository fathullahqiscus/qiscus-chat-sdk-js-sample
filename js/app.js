define([
  'jquery',
  'service/qiscus',
  'service/route',
  'service/emitter',
  'service/content',
  'pages/login',
  'pages/chat-list',
  'pages/chat',
  'pages/users',
  'pages/create-group',
  'pages/profile',
  'pages/room-info',
], function (
  $,
  qiscus,
  route,
  emitter,
  $content,
  LoginPage,
  ChatListPage,
  ChatPage,
  UserPage,
  CreateGroupPage,
  Profile,
  RoomInfoPage
) {
  window.route = route;
  window.qiscus = qiscus;

  // Handle unhandled promise rejections (e.g., from disconnect during logout)
  window.addEventListener('unhandledrejection', function (event) {
    // Suppress expected errors from disconnect/logout
    if (event.reason && event.reason.message) {
      var msg = event.reason.message;
      if (msg.includes('Request has been terminated') ||
        msg.includes('network is offline') ||
        msg.includes('page is being unloaded')) {
        console.log('Suppressed expected error during disconnect:', msg);
        event.preventDefault(); // Prevent error from showing in console
        return;
      }
    }
    // Let other errors through
    console.error('Unhandled promise rejection:', event.reason);
  });

  var pages = [
    LoginPage,
    ChatListPage,
    ChatPage,
    UserPage,
    CreateGroupPage,
    Profile,
    RoomInfoPage,
  ];
  var pageMap = pages.reduce(function (acc, page) {
    acc[page.path] = page;
    return acc;
  }, {});

  function renderPage(path, state) {
    var page = pageMap[path];
    if (page == null) {
      $content.html('<div class="PageNotFound">Page not found</div>');
      return;
    }
    var view = page.render(state);
    $content.html(view);
    if (typeof page.mount === 'function') {
      page.mount(state);
    }
  }

  emitter.on('qiscus::login-success', function () {
    route.replace('/chat');
    localStorage.setItem('authdata', JSON.stringify(qiscus.userData));
  });

  // Public routes that don't require authentication
  var publicRoutes = ['/login'];

  emitter.on('route::change', function (location) {
    var isPublicRoute = publicRoutes.indexOf(location.pathname) !== -1;

    console.log('Route change:', location.pathname, '| isLogin:', qiscus.isLogin, '| isPublic:', isPublicRoute);

    // If trying to access protected route without login, redirect to login
    if (!isPublicRoute && !qiscus.isLogin) {
      console.log('❌ Not authenticated, redirecting to login...');
      route.replace('/login');
      return;
    }

    // If already logged in and trying to access login page, redirect to chat
    if (location.pathname === '/login' && qiscus.isLogin) {
      console.log('✅ Already authenticated, redirecting to chat...');
      route.replace('/chat');
      return;
    }

    console.log('✅ Access granted to:', location.pathname);
    renderPage(location.pathname, location.state);
  });

  $('.widget-container').on('click', 'button.close-btn', function (event) {
    event.preventDefault();
    $('.widget-container').slideUp();
    // Show toggle button when widget is closed
    $('.toggle-widget-btn').fadeIn(200);
  });
  $('.toggle-widget-btn').on('click', function (event) {
    event.preventDefault();
    $('.widget-container').slideDown();
    // Hide toggle button when widget is open
    $('.toggle-widget-btn').fadeOut(200);
  });

  // App ID Setup Logic
  var savedAppId = localStorage.getItem('qiscus_app_id');

  if (savedAppId) {
    // If App ID is saved, use it and show chat button
    console.log('📦 Using saved App ID:', savedAppId);
    window.APP_ID = savedAppId;

    // Initialize Qiscus with saved App ID
    if (typeof window.initQiscus === 'function') {
      console.log('🔄 Initializing Qiscus on page load...');
      window.initQiscus(savedAppId);
    }

    $('#app-id-setup').addClass('hidden');
    $('.toggle-widget-btn').show();
  } else {
    // Show setup form
    console.log('❌ No App ID found, showing setup form');
    $('#app-id-setup').removeClass('hidden');
    $('.toggle-widget-btn').hide();
  }

  // Handle App ID form submission
  $('#init-app-btn').on('click', function () {
    var appId = $('#app-id-input').val().trim();

    if (!appId) {
      alert('Please enter an App ID');
      return;
    }

    console.log('🚀 Initializing with App ID:', appId);

    // Save App ID to localStorage
    localStorage.setItem('qiscus_app_id', appId);
    window.APP_ID = appId;

    // Initialize Qiscus with the App ID
    if (typeof window.initQiscus === 'function') {
      window.initQiscus(appId);
    }

    // Hide setup form and show chat button
    $('#app-id-setup').addClass('hidden');
    $('.toggle-widget-btn').show();

    console.log('✅ Qiscus initialized successfully!');
  });

  // Allow Enter key to submit form
  $('#app-id-input').on('keypress', function (e) {
    if (e.which === 13) {
      $('#init-app-btn').click();
    }
  });

  if (localStorage['authdata'] != null) {
    var authdata = JSON.parse(localStorage['authdata']);
    qiscus.setUserWithIdentityToken({ user: authdata });
  }

  var initialPath = qiscus.isLogin ? '/chat' : '/login';
  route.replace(initialPath);

  // Update SDK Status Display
  function updateSDKStatus() {
    if (qiscus.isLogin && qiscus.userData) {
      $('#sdk-status').removeClass('hidden');

      // Update App ID
      $('#app-id-display').text(window.APP_ID || '-');

      // Update User
      var userName = qiscus.userData.username || qiscus.userData.email || 'Unknown';
      $('#user-display').text(userName);

      // Update Connection Status
      var isConnected = qiscus.realtimeAdapter && qiscus.realtimeAdapter.connected;
      var $connectionStatus = $('#connection-status');
      if (isConnected) {
        $connectionStatus.text('✅ Active').removeClass('inactive').addClass('active');
      } else {
        $connectionStatus.text('⚠️ Disconnected').removeClass('active').addClass('inactive');
      }

      // Update Broker URLs
      if (qiscus.mqttURL) {
        $('#broker-url').text(qiscus.mqttURL);
      }
      if (qiscus.brokerLbUrl) {
        $('#broker-lb-url').text(qiscus.brokerLbUrl);
      }

      // Update SDK Configuration
      $('#sdk-config').removeClass('hidden');

      // Helper function to format boolean values
      function formatBoolean(value) {
        if (value === true) {
          return '<span class="enabled">✅ Enabled</span>';
        } else if (value === false) {
          return '<span class="disabled">❌ Disabled</span>';
        }
        return '-';
      }

      // Update config values
      if (qiscus.syncInterval !== undefined) {
        $('#sync-interval').text(qiscus.syncInterval + ' ms');
      }
      $('#sync-on-connect').text(qiscus.syncOnConnect + ' ms');
      $('#enable-lb').html(formatBoolean(qiscus.enableLb));
      $('#enable-realtime').html(formatBoolean(qiscus.enableRealtime));
      $('#enable-realtime-check').html(formatBoolean(qiscus.enableRealtimeCheck));
      $('#enable-sync').html(formatBoolean(qiscus.enableSync));
      $('#enable-sync-event').html(formatBoolean(qiscus.enableSyncEvent));

      // Update Last Update Time
      var now = new Date();
      var timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      $('#last-update').text(timeStr);
    } else {
      $('#sdk-status').addClass('hidden');
    }
  }

  // Update status every second
  setInterval(updateSDKStatus, 1000);

  // Initial update
  setTimeout(updateSDKStatus, 500);

  // Global Avatar Error Handler
  // Handle all avatar image load errors and replace with placeholder
  $(document).on('error', 'img.room-avatar, img.avatar, img.contact-avatar, img.participant-avatar, img.profile-avatar', function () {
    var $img = $(this);
    if ($img.attr('data-error-handled')) return; // Prevent infinite loop

    $img.attr('data-error-handled', 'true');

    // Try to get name from nearby elements or alt attribute
    var name = $img.attr('alt') ||
      $img.closest('.room-item').find('.room-name').text() ||
      $img.closest('.contact-item').find('.contact-name').text() ||
      'U';

    var initial = name.charAt(0).toUpperCase();
    var placeholder = `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2240%22 text-anchor=%22middle%22 x=%2250%22 y=%2265%22%3E${initial}%3C/text%3E%3C/svg%3E`;

    $img.attr('src', placeholder);
  });
});
