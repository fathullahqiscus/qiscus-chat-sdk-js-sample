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

  emitter.on('route::change', function (location) {
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
