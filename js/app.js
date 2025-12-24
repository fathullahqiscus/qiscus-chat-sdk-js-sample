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
  });
  $('.toggle-widget-btn').on('click', function (event) {
    event.preventDefault();
    $('.widget-container').slideDown();
  });

  if (localStorage['authdata'] != null) {
    var authdata = JSON.parse(localStorage['authdata']);
    qiscus.setUserWithIdentityToken({ user: authdata });
  }

  var initialPath = qiscus.isLogin ? '/chat' : '/login';
  route.replace(initialPath);
});
