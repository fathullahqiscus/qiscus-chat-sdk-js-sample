define([
  'jquery',
  'dateFns',
  'lodash',
  'service/page',
  'service/qiscus',
  'service/content',
  'service/route',
  'service/emitter',
], function ($, dateFns, _, createPage, qiscus, $content, route, emitter) {
  var newMessageIds = [];

  function searchAndReplace(str, find, replace) {
    return str.split(find).join(replace);
  }
  function escapeHTML(text) {
    var comment = searchAndReplace(text, '<p>', '');
    comment = searchAndReplace(comment, '</p>', '');
    return comment;
  }

  function Toolbar() {
    return `
      <div class="Toolbar">
        <div class="toolbar-meta">
          <div class="eyebrow">Inbox</div>
          <div class="toolbar-title">Conversations</div>
        </div>
        <div class="toolbar-actions">
          <button id="profile-btn" type="button" class="avatar-btn">
            <img src="${qiscus.userData.avatar_url}">
          </button>
        </div>
      </div>
    `;
  }

  function Empty() {
    return `
      <div class="ChatList">
        ${Toolbar()}
        <div class="empty-content-container">
          <div class="empty-card">
            <div class="empty-visual">
              <img src="/img/img-empty-chat.svg" class="empty-logo">
            </div>
            <div class="empty-title">No conversations yet</div>
            <p class="empty-description">
              Start a chat to see conversations appear here.
            </p>
            <div class="empty-actions">
              <button type="button" class="start-chat primary-btn pill">
                Start chat
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getTime(lastMessageTime) {
    if (dateFns.isSameDay(lastMessageTime, new Date())) {
      return dateFns.format(lastMessageTime, 'HH:mm');
    } else {
      return dateFns.format(lastMessageTime, 'DD/MM/YYYY');
    }
  }

  function roomFormatter(room) {
    var lastComment = room.last_comment_message.startsWith('[file]')
      ? 'File attachment'
      : room.last_comment_message;
    var unreadCountClass =
      room.count_notif > 0 ? 'room-unread-count' : 'room-unread-count hidden';
    return `
      <li class="room-item"
        data-room-id="${room.id}"
        data-room-name="${room.name}"
        data-room-avatar="${room.avatar}">
        <img class="room-avatar" src="${room.avatar}">
        <div class="room-data-container">
          <div class="room-content">
            <div class="room-name">${room.name}</div>
            <div class="room-last-message">${lastComment}</div>
          </div>
          <div class="room-meta">
            <div class="room-time">${getTime(room.last_comment_message_created_at)}</div>
            <div class="${unreadCountClass}">${room.count_notif}</div>
          </div>
        </div>
      </li>
    `;
  }

  function RoomList(rooms) {
    return `
      <div class="ChatList">
        ${Toolbar()}
        <ul class="room-list">
          ${rooms.map(roomFormatter).join('')}
          <li class="load-more">
            <button type="button">
              Load more
            </button>
          </li>
        </ul>
      </div>
    `;
  }

  var isLoadingRooms = false;
  var isAbleToLoadRoom = true;
  var loadRooms = _.debounce(function loadRooms(currentLength) {
    if (isLoadingRooms || !isAbleToLoadRoom) return;

    var perPage = 10;
    var currentPage = Math.ceil(currentLength / perPage);
    var nextPage = currentPage + 1;

    isLoadingRooms = true;
    return qiscus
      .loadRoomList({
        page: nextPage,
        limit: perPage,
      })
      .then(function (roomData) {
        isLoadingRooms = false;
        if (roomData.length < perPage) {
          isAbleToLoadRoom = false;
          $content.find('.room-list .load-more').hide();
        }
        var rooms = roomData.map(roomFormatter).join('');
        $(rooms).insertBefore('.room-list .load-more');
      });
  }, 100);

  function handleNewMessage(comment) {
    if (newMessageIds.includes(comment.id)) return;
    newMessageIds.push(comment.id);

    var roomId = comment.room_id;
    var $room = $content.find('.room-item[data-room-id="' + roomId + '"]');
    if ($room.length === 0) return;
    $room.find('.room-last-message').text(escapeHTML(comment.message));
    var $unreadCount = $room.find('.room-unread-count');
    var lastUnreadCount = Number($unreadCount.text());
    $unreadCount.removeClass('hidden').text(lastUnreadCount + 1);
    $content.find('.ChatList .room-list').prepend($room.detach());
  }

  function bindEvents($content) {
    $content
      .off('.ChatList')
      .on('click.ChatList', '.ChatList .room-item', function (event) {
        event.preventDefault();
        newMessageIds.length = 0;
        var target = $(event.currentTarget);
        var roomId = target.data('room-id');
        var roomName = target.data('room-name');
        var roomAvatar = target.data('room-avatar');
        qiscus.getRoomById(roomId).then(function () {
          route.push('/chat-room', {
            roomId: roomId,
            roomName: roomName,
            roomAvatar: roomAvatar,
          });
        });
      })
      .on('click.ChatList', '.ChatList .start-chat', function (event) {
        event.preventDefault();
        route.push('/users');
      })
      .on('click.ChatList', '.ChatList #profile-btn', function () {
        route.push('/profile');
      })
      .on('click.ChatList', '.ChatList .load-more button', function (event) {
        event.preventDefault();
        var childLength = $content.find('.room-list').children().length - 1;
        loadRooms(childLength);
      });

    emitter.off('qiscus::new-message', handleNewMessage);
    emitter.on('qiscus::new-message', handleNewMessage);
  }

  function mount() {
    qiscus.loadRoomList().then(function (rooms) {
      if (rooms.length === 0) $content.html(Empty());
      else $content.html(RoomList(rooms));
    });
  }

  function template() {
    return Empty();
  }

  return createPage({
    path: '/chat',
    template: template,
    bindEvents: bindEvents,
    onMount: mount,
  });
});
