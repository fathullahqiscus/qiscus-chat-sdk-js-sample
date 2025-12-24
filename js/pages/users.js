define(
  ['jquery', 'lodash', 'service/page', 'service/route', 'service/content', 'service/qiscus'],
  function ($, _, createPage, route, $content, qiscus) {
    var activeTab = 'single';

    function getFormConfig(tab) {
      if (tab === 'group') {
        return {
          title: 'Create a group chat',
          buttonText: 'Create Group',
          fields: [
            {
              id: 'group-name',
              label: 'Group Name',
              placeholder: 'Group Name',
              icon: 'icon-group',
              required: true
            },
            {
              id: 'user-ids',
              label: 'User IDs',
              placeholder: 'User IDs',
              icon: 'icon-group',
              required: true,
              helper: 'Separate user IDs with commas'
            },
            {
              id: 'avatar-url',
              label: 'Avatar URL (Optional)',
              placeholder: 'Avatar URL (Optional)',
              icon: 'icon-image',
              required: false
            }
          ]
        };
      }

      if (tab === 'channel') {
        return {
          title: 'Create or join a channel',
          subtitle: 'Channels are public chat rooms that anyone can join',
          buttonText: 'Create/Join Channel',
          fields: [
            {
              id: 'channel-id',
              label: 'Channel Unique ID',
              placeholder: 'Channel Unique ID',
              icon: 'icon-hash',
              required: true
            },
            {
              id: 'channel-name',
              label: 'Channel Name (Optional)',
              placeholder: 'Channel Name (Optional)',
              icon: 'icon-chat',
              required: false
            },
            {
              id: 'avatar-url',
              label: 'Avatar URL (Optional)',
              placeholder: 'Avatar URL (Optional)',
              icon: 'icon-image',
              required: false
            }
          ]
        };
      }

      // Single chat (default)
      return {
        title: 'Start a chat',
        buttonText: 'Start Chat',
        fields: [
          {
            id: 'user-id',
            label: 'User ID',
            placeholder: 'Masukkan User ID',
            icon: 'icon-user',
            required: true,
            helper: 'Masukkan ID pengguna untuk memulai chat'
          }
        ]
      };
    }

    function renderForm(tab) {
      var config = getFormConfig(tab);
      var fieldsHtml = config.fields.map(function (field) {
        return `
          <div class="input-group">
            <label for="${field.id}">${field.label}</label>
            <div class="input-row">
              <i class="icon ${field.icon}"></i>
              <input 
                type="text" 
                id="${field.id}" 
                name="${field.id}" 
                placeholder="${field.placeholder}"
                ${field.required ? 'data-required="true"' : ''}
              >
            </div>
            ${field.helper ? `<div class="helper-text">${field.helper}</div>` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="form-header">
          <h3 class="form-title">${config.title}</h3>
          ${config.subtitle ? `<p class="form-subtitle">${config.subtitle}</p>` : ''}
        </div>
        ${fieldsHtml}
        <button type="button" class="start-chat-btn primary-btn pill is-disabled" disabled>
          ${config.buttonText}
        </button>
      `;
    }

    function setActiveTab($root, tab) {
      activeTab = tab;
      $root.find('.tab-btn').removeClass('active');
      $root.find('.tab-btn[data-tab="' + tab + '"]').addClass('active');

      // Re-render the form
      var $formCard = $root.find('.user-form-card');
      var $tabSwitcher = $formCard.find('.tab-switcher').detach();
      $formCard.html(renderForm(tab));
      $formCard.prepend($tabSwitcher);

      toggleStartButton($root);
    }

    function toggleStartButton($root) {
      var config = getFormConfig(activeTab);
      var allRequiredFilled = true;

      config.fields.forEach(function (field) {
        if (field.required) {
          var value = $.trim($root.find('#' + field.id).val());
          if (value.length === 0) {
            allRequiredFilled = false;
          }
        }
      });

      var $btn = $root.find('.start-chat-btn');
      $btn.prop('disabled', !allRequiredFilled);
      $btn.toggleClass('is-disabled', !allRequiredFilled);
    }

    function startChat($root) {
      if (activeTab === 'single') {
        var userId = $.trim($root.find('#user-id').val());
        return qiscus.chatTarget(userId).then(function (room) {
          route.push('/chat-room', {
            roomName: room.name,
            roomAvatar: room.avatar,
          });
        });
      } else if (activeTab === 'group') {
        var groupName = $.trim($root.find('#group-name').val());
        var userIds = $.trim($root.find('#user-ids').val()).split(',').map(function (id) {
          return $.trim(id);
        }).filter(function (id) {
          return id.length > 0;
        });
        var avatarUrl = $.trim($root.find('#avatar-url').val());

        var options = {};
        if (avatarUrl) {
          options.avatar_url = avatarUrl;
        }

        return qiscus.createGroupRoom(groupName, userIds, options).then(function (room) {
          route.push('/chat-room', {
            roomName: room.name,
            roomAvatar: room.avatar_url || room.avatar,
          });
        });
      } else if (activeTab === 'channel') {
        var channelId = $.trim($root.find('#channel-id').val());
        var channelName = $.trim($root.find('#channel-name').val());
        var avatarUrl = $.trim($root.find('#avatar-url').val());

        // First, get or create the room with unique ID
        return qiscus.getOrCreateRoomWithUniqueId(channelId).then(function (room) {
          // If channel name or avatar is provided, update the room
          if (channelName || avatarUrl) {
            var updateOptions = {
              id: room.id
            };
            if (channelName) {
              updateOptions.room_name = channelName;
            }
            if (avatarUrl) {
              updateOptions.avatar_url = avatarUrl;
            }

            return qiscus.updateRoom(updateOptions).then(function (updatedRoom) {
              route.push('/chat-room', {
                roomName: updatedRoom.name || room.name,
                roomAvatar: updatedRoom.avatar_url || room.avatar_url || room.avatar,
              });
            });
          } else {
            route.push('/chat-room', {
              roomName: room.name,
              roomAvatar: room.avatar_url || room.avatar,
            });
          }
        });
      }
    }

    function bindEvents($content) {
      $content
        .off('.Users')
        .on('click.Users', '.Users .back-btn', function (event) {
          event.preventDefault();
          route.push('/chat');
        })
        .on('click.Users', '.Users .tab-btn', function (event) {
          event.preventDefault();
          var tab = $(event.currentTarget).data('tab');
          setActiveTab($content, tab);
        })
        .on(
          'input.Users',
          '.Users input[type="text"]',
          _.debounce(function () {
            toggleStartButton($content);
          }, 80)
        )
        .on('click.Users', '.Users .start-chat-btn', function (event) {
          event.preventDefault();
          var $btn = $(this);
          if ($btn.prop('disabled')) return;

          $btn.prop('disabled', true).addClass('is-disabled');
          startChat($content).finally(function () {
            toggleStartButton($content);
          });
        });
    }

    function mount() {
      activeTab = 'single';
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

          <div class="user-form-card">
            <div class="tab-switcher">
              <button type="button" class="tab-btn active" data-tab="single">1-on-1</button>
              <button type="button" class="tab-btn" data-tab="group">Group</button>
              <button type="button" class="tab-btn" data-tab="channel">Channel</button>
            </div>

            ${renderForm('single')}
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
  }
);
