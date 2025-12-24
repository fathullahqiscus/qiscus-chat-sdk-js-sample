define([
  'jquery',
  'lodash',
  'service/page',
  'service/route',
  'service/content',
  'service/qiscus',
], function ($, _, createPage, route, $content, qiscus) {
  function contactFormatter(contact) {
    return `
      <li class="contact-item"
        data-user-id="${contact.email}">
        <img src="${contact.avatar_url}">
        <div class="name">${contact.username}</div>
      </li>
    `;
  }

  var searchQuery = null;
  var isLoadingUser = false;
  var isAbleToLoadMore = true;

  var loadUser = _.debounce(function loadUser(currentLength) {
    if (isLoadingUser) return;
    if (!isAbleToLoadMore) return;

    var perPage = 20;
    var currentPage = Math.ceil(currentLength / perPage);
    var nextPage = currentPage + 1;

    isLoadingUser = true;
    return qiscus
      .getUsers(searchQuery, nextPage)
      .then(function (resp) {
        isLoadingUser = false;
        var users = resp.users.map(contactFormatter).join('');
        $(users).insertBefore('.contact-list .load-more');

        if (resp.meta.total_page === nextPage) {
          isAbleToLoadMore = false;
          $content.find('.load-more').css({
            display: 'none',
          });
        }
      });
  }, 100);

  function mount() {
    qiscus.getUsers().then(function (resp) {
      var users = resp.users.map(contactFormatter).join('');
      $(users).insertBefore('.contact-list .load-more');
    });
  }

  function bindEvents($content) {
    $content
      .off('.Users')
      .on('click.Users', '.Users .back-btn', function (event) {
        event.preventDefault();
        route.push('/chat');
      })
      .on('click.Users', '.Users li.contact-item', function (event) {
        event.preventDefault();
        var userId = $(event.currentTarget).data('user-id');
        qiscus.chatTarget(userId).then(function (room) {
          route.push('/chat-room', {
            roomName: room.name,
            roomAvatar: room.avatar,
          });
        });
      })
      .on(
        'input.Users',
        '.Users input#search-input',
        _.debounce(function (event) {
          searchQuery =
            event.target.value.length === 0 ? null : event.target.value;
          if (searchQuery === null) {
            isAbleToLoadMore = true;
            return;
          }
          return qiscus.getUsers(searchQuery).then(function (resp) {
            var users = resp.users.map(contactFormatter).join('');
            $content
              .find('.contact-list')
              .empty()
              .append(users)
              .append('<li class="load-more"><button>Load more</button></li>');
          });
        }, 300)
      )
      .on('click.Users', '.Users .create-group-btn', function (event) {
        event.preventDefault();
        route.push('/create-group');
      })
      .on('click.Users', '.Users .load-more button', function (event) {
        event.preventDefault();
        var childLength = $content.find('.contact-list').children().length - 1;
        loadUser(childLength);
      });
  }

  function template() {
    return `
      <div class="Users">
        <div class="toolbar">
          <button type="button" class="back-btn">
            <i class="icon icon-arrow-back"></i>
          </button>
          <div class="toolbar-title">Choose Contacts</div>
        </div>
        <button id="create-group-btn" class="create-group-btn">
          <i class="icon icon-new-chat-group"></i> Create Group Chat
        </button>
        <div class="search-container">
          <i class="icon icon-search"></i>
          <input type="text" id="search-input" name="search-input" placeholder="Search contacts">
        </div>
        
        <div class="contact-list-container">
          <div class="contact-list-title">Contacts</div>
          <ul class="contact-list">
            <li class="load-more">
              <button type="button">
                Load more
              </button>
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  return createPage({
    path: '/users',
    template: template,
    bindEvents: bindEvents,
    onMount: mount,
  });
});
