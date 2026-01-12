define([
  'jquery',
  'lodash',
  'service/page',
  'service/content',
  'service/route',
  'service/qiscus',
], function ($, _, createPage, $content, route, qiscus) {
  var blobURL = null
  var searchQuery = null
  var selectedIds = window.selectedIds = []
  var isLoadingUser = false

  var loadContact = _.debounce(function (currentLength) {
    if (isLoadingUser) return;

    // Use participants from room instead of deprecated getUsers()
    if (!qiscus.selected || !qiscus.selected.participants) {
      isLoadingUser = false;
      return;
    }

    isLoadingUser = true;

    // Filter participants by search query if provided
    var participants = qiscus.selected.participants;
    if (searchQuery) {
      var lowerQuery = searchQuery.toLowerCase();
      participants = participants.filter(function (user) {
        return user.username.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery);
      });
    }

    var users = participants.map(function (user) {
      var selected = selectedIds.includes(user.email);
      return ContactItem(user, selected);
    }).join('');

    $(users).insertBefore('.contact-list .load-more');
    isLoadingUser = false;
  }, 300);

  function ParticipantItem(user) {
    var initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
    var placeholder = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2240%22 text-anchor=%22middle%22 x=%2250%22 y=%2265%22%3E" + initial + "%3C/text%3E%3C/svg%3E";

    return `
      <li class="participant-item"
        data-user-id="${user.email}">
        <img src="${user.avatar_url}" 
             onerror="this.onerror=null; this.src='${placeholder}';">
        <div class="name">${user.username}</div>
        <button id="remove-participant-btn"
          class="remove-participant-btn"
          type="button"
          data-userid="${user.email}">
          <i class="icon icon-cross-red"></i>
        </button>
      </li>
    `;
  }
  function ContactItem(contact, selected) {
    var selected = selected || false;
    var initial = contact.name ? contact.name.charAt(0).toUpperCase() : '?';
    var placeholder = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2240%22 text-anchor=%22middle%22 x=%2250%22 y=%2265%22%3E" + initial + "%3C/text%3E%3C/svg%3E";

    return `
      <li class="contact-item"
        data-contact-id="${contact.id}"
        data-contact-name="${contact.name}"
        data-contact-avatar="${contact.avatar_url}"
        data-contact-userid="${contact.email}"
        ${selected ? `data-selected="${selected}"` : ''}>
        <div class="avatar-container">
          <img class="contact-avatar" 
               src="${contact.avatar_url}" 
               alt="${contact.email}"
               onerror="this.onerror=null; this.src='${placeholder}';">
        </div>
        <button type="button">
          <div class="displayname-container">
            ${contact.name}
          </div>
          <i class="icon icon-check-green ${selected ? '' : 'hidden'}"></i>
        </button>
      </li>
    `;
  }
  function SingleRoomInfo(user) {
    return `
      <div class="info-header">
        Information
      </div>
      <div class="field-group">
        <div class="icon-container">
          <i class="icon icon-user"></i>
        </div>
        <input id="input-user-name" type="text" value="${user.username}" disabled>
      </div>
      <div class="field-group">
        <div class="icon-container">
          <i class="icon icon-id-card"></i>
        </div>
        <input id="input-user-id" type="text" value="${user.email}" disabled>
      </div>
    `
  }
  function GroupRoomInfo(data) {
    return `
      <div class="info-header">Participants</div>
      <ul class="participant-list">
        <li class="participant-item">
            <i class="icon icon-add-participant"></i>
          <button id="open-contact-chooser-btn" type="button">
            Add Participant
          </button>
        </li>
        ${data.participants.map(function (user) {
      return ParticipantItem(user)
    }).join('')}
      </ul>
    `
  }

  function ContactChooser() {
    return `
      <div class="ContactChooser" style="display:none;">
        <div class="modal-overlay"></div>
        <div class="modal-content-simple">
          <h3 class="modal-title">Add Participants</h3>
          <p class="modal-description">Enter user IDs or emails (comma-separated for multiple users)</p>
          <textarea 
            id="participant-input" 
            class="participant-input" 
            placeholder="e.g. user1@example.com, user2@example.com"
            rows="4"
          ></textarea>
          <div class="modal-actions">
            <button type="button" id="cancel-add-participant" class="btn-cancel">Cancel</button>
            <button type="button" id="confirm-add-participant" class="btn-add">Add</button>
          </div>
        </div>
      </div>
    `;
  }

  function removeParticipant(contactId) {
    // remove check from contact list
    var $el = $content.find(`li.contact-item[data-contact-id="${contactId}"]`)
    $el
      .removeAttr('data-selected')
      .find('.icon')
      .addClass('hidden')
    var userId = $el.attr('data-contact-userid')
    var index = selectedIds.findIndex(function (id) {
      return id === userId
    })
    selectedIds.splice(index, 1)
  }
  function addParticipant(detail) {
    // add check mark to contact list
    var $el = $(`li.contact-item[data-contact-id="${detail.id}"]`)
    $el
      .attr('data-selected', true)
      .find('.icon')
      .removeClass('hidden')

    var userId = $el.attr('data-contact-userid')
    selectedIds.push(userId)
  }

  function mount(state) {
    selectedIds.splice(0, selectedIds.length);
    searchQuery = null;
    if (blobURL != null) {
      URL.revokeObjectURL(blobURL);
      blobURL = null;
    }

    // Helper function to generate avatar placeholder
    function getAvatarPlaceholder(name) {
      var initial = name ? name.charAt(0).toUpperCase() : '?';
      return "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2240%22 text-anchor=%22middle%22 x=%2250%22 y=%2265%22%3E" + initial + "%3C/text%3E%3C/svg%3E";
    }

    // Helper function to render room info
    function renderRoomInfo(info) {
      console.log('🔍 renderRoomInfo called with:', info);

      if (!info) {
        console.error('❌ Room info is undefined');
        $content.find('.info-container').html('<div>Room information not available</div>');
        return;
      }

      console.log('🔍 Room type check:', {
        chat_type: info.chat_type,
        room_type: info.room_type,
        participants_count: info.participants ? info.participants.length : 0
      });

      if (info.chat_type === 'single' || info.room_type === 'single') {
        console.log('✅ Rendering single chat');
        var user = info.participants.find(function (user) {
          return user.email !== qiscus.user_id;
        });

        if (!user) {
          console.error('❌ User not found in participants');
          return;
        }

        $content.find('.info-container')
          .html(SingleRoomInfo(user));
        $content.find('.toolbar-title')
          .text(user.username);
        var avatarUrl = info.avatar_url || user.avatar_url;
        var placeholder = getAvatarPlaceholder(user.username);
        $content.find('.profile-avatar')
          .attr('src', avatarUrl)
          .attr('onerror', "this.onerror=null; this.src='" + placeholder + "';");
        $content.find('#input-user-name')
          .attr('value', user.username);
        $content.find('#input-user-id')
          .attr('value', user.email);
      } else if (info.chat_type === 'group' || info.room_type === 'group') {
        console.log('✅ Rendering group chat with', info.participants.length, 'participants');
        $content.find('.info-container')
          .html(GroupRoomInfo(info));
        $content.find('#input-room-name')
          .val(info.room_name || info.name);
        var placeholder = getAvatarPlaceholder(info.room_name || info.name);
        $content.find('.profile-avatar')
          .attr('src', info.avatar)
          .attr('onerror', "this.onerror=null; this.src='" + placeholder + "';");

        $content.find('.change-avatar-container')
          .children()
          .each(function () {
            $(this).removeClass('hidden');
          });
      } else {
        console.error('❌ Unknown room type:', info.chat_type, info.room_type);
        $content.find('.info-container').html('<div>Unknown room type</div>');
      }

      console.log('✅ renderRoomInfo completed');
    }

    // Try to use qiscus.selected first (if available from previous page)
    console.log('🔍 Checking qiscus.selected:', {
      exists: !!qiscus.selected,
      selectedId: qiscus.selected ? qiscus.selected.id : null,
      selectedIdType: qiscus.selected ? typeof qiscus.selected.id : null,
      hasParticipants: qiscus.selected ? !!qiscus.selected.participants : false,
      participantsCount: qiscus.selected && qiscus.selected.participants ? qiscus.selected.participants.length : 0,
      stateRoomId: state.roomId,
      stateRoomIdType: typeof state.roomId
    });

    // Use qiscus.selected if available (most common case when navigating from chat)
    if (qiscus.selected && qiscus.selected.participants) {
      console.log('✅ Using qiscus.selected (no API call needed)', qiscus.selected);
      renderRoomInfo(qiscus.selected);
      return; // Early return, no API call needed
    }

    // Fallback to API call if qiscus.selected not available
    // This happens when accessing room-info directly via URL or after page refresh
    var roomId = state.roomId || (qiscus.selected && qiscus.selected.id);

    if (!roomId) {
      console.error('❌ No room ID available');
      $content.find('.info-container').html('<div>Room ID not available</div>');
      return;
    }

    console.log('⚠️ qiscus.selected not available, fetching from API for room:', roomId);
    qiscus.getRoomsInfo({ room_ids: [`${roomId}`] })
      .then(function (resp) {
        // Check if response has valid data
        if (!resp || !resp.results || !resp.results.rooms_info || resp.results.rooms_info.length === 0) {
          console.error('No room info found');
          $content.find('.info-container').html('<div>Room information not available</div>');
          return;
        }

        var info = resp.results.rooms_info.pop();

        // Additional null check for info object
        if (!info) {
          console.error('Room info is undefined');
          $content.find('.info-container').html('<div>Room information not available</div>');
          return;
        }

        renderRoomInfo(info);
      })
      .catch(function (error) {
        console.error('Error loading room info:', error);
        $content.find('.info-container').html('<div>Error loading room information</div>');
      });
  }

  function template(state) {
    return `
      <div class="RoomInfo">
        ${ContactChooser()}
        <div class="toolbar">
          <button id="back-btn" type="button">
            <i class="icon icon-arrow-left-green"></i>
          </button>
          <div class="toolbar-title">Room Info</div>
        </div>
        <div class="avatar-container">
          <input id="input-avatar" type="file" accept="image/*" class="hidden">
          <img class="profile-avatar" src="" alt="" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27%3E%3Crect fill=%27%23e5e7eb%27 width=%27100%27 height=%27100%27/%3E%3Ctext fill=%27%236b7280%27 font-family=%27Arial%27 font-size=%2740%27 text-anchor=%27middle%27 x=%2750%27 y=%2765%27%3E?%3C/text%3E%3C/svg%3E';">
          <div class="change-avatar-container">
            <input id="input-room-name" type="text" value="" disabled class="hidden">
            <button id="edit-room-name-btn" class="edit-name hidden" type="button">
              <i class="icon icon-pencil-white"></i>
            </button>
            <button id="avatar-picker-btn" type="button" class="hidden">
              <i class="icon icon-avatar-picker"></i>
            </button>
          </div>
        </div>
        <div class="info-container">
          Loading data...
        </div>
      </div>
    `
  }

  function bindEvents($content) {
    $content
      .off('.RoomInfo')
      .on('click.RoomInfo', '.RoomInfo #open-contact-chooser-btn', function (event) {
        event.preventDefault();
        $content.find('.ContactChooser').fadeIn(200);
      })
      .on('click.RoomInfo', '.RoomInfo #back-btn', function (event) {
        event.preventDefault()
        route.go(-1)
      })
      .on('click.RoomInfo', '.RoomInfo #edit-room-name-btn', function (event) {
        event.preventDefault()
        var $inputName = $content.find('#input-room-name')
        $inputName
          .removeAttr('disabled')
          .focus()
      })
      .on('click.RoomInfo', '.RoomInfo #avatar-picker-btn', function (event) {
        event.preventDefault();
        $content.find('#input-avatar').click();
      })
      .on('keydown.RoomInfo', '.RoomInfo #input-room-name', function (event) {
        if (event.keyCode === 13) {
          event.preventDefault();
          var name = event.target.value.trim();
          if (!name) {
            toast.warning('Room name cannot be empty');
            return;
          }
          $(this).attr('disabled', true);
          qiscus.updateRoom({ id: qiscus.selected.id, room_name: name })
            .then(function () {
              toast.success('Room name updated successfully');
            })
            .catch(function (error) {
              toast.error('Failed to update room name');
              console.error('Error updating room name:', error);
            });
        }
      })
      .on('change.RoomInfo', '.RoomInfo #input-avatar', function (event) {
        var file = Array.from(event.target.files).pop()
        if (blobURL != null) URL.revokeObjectURL(blobURL)
        blobURL = URL.createObjectURL(file)
        $content.find('img.profile-avatar')
          .attr('src', blobURL)

        qiscus.upload(file, function (err, progress, url) {
          if (err) {
            toast.error('Failed to upload avatar');
            console.log('Error while uploading file', err);
            return;
          }
          if (progress) {
            // Could show progress toast here if needed
            return;
          }
          if (url) {
            qiscus.updateRoom({ id: qiscus.selected.id, avatar_url: url })
              .then(function (resp) {
                toast.success('Room avatar updated successfully');
                console.log('Success updating avatar', resp);
              })
              .catch(function (error) {
                toast.error('Failed to update room avatar');
                console.error('Error updating avatar:', error);
              });
          }
        });
      })
      .on('click.RoomInfo', '.RoomInfo #remove-participant-btn', function (event) {
        event.preventDefault();
        var $el = $(this);
        var userId = $el.attr('data-userid');
        qiscus.removeParticipantsFromGroup(qiscus.selected.id, [userId])
          .then(function () {
            $el.closest('li.participant-item').remove();
            toast.success('Participant removed successfully');
          })
          .catch(function (error) {
            toast.error('Failed to remove participant');
            console.error('Error removing participant:', error);
          });
      })
      .on('click.RoomInfo', '.RoomInfo #cancel-add-participant', function () {
        $content.find('.ContactChooser').fadeOut(200);
        $content.find('#participant-input').val(''); // Clear input
      })
      .on('click.RoomInfo', '.RoomInfo .modal-overlay', function () {
        $content.find('.ContactChooser').fadeOut(200);
        $content.find('#participant-input').val(''); // Clear input
      })
      .on('click.RoomInfo', '.RoomInfo #confirm-add-participant', function (event) {
        event.preventDefault();

        var input = $content.find('#participant-input').val().trim();
        if (!input) {
          toast.warning('Please enter at least one user ID or email');
          return;
        }

        // Split by comma and trim each
        var userIds = input.split(',').map(function (id) {
          return id.trim();
        }).filter(function (id) {
          return id.length > 0;
        });

        if (userIds.length === 0) {
          toast.warning('Please enter valid user IDs or emails');
          return;
        }

        qiscus.addParticipantsToGroup(qiscus.selected.id, userIds)
          .then(function (users) {
            var participants = users.map(function (user) {
              return ParticipantItem(user);
            }).join('');
            $content.find('.participant-list').append(participants);

            // Close modal
            $content.find('.ContactChooser').fadeOut(200);

            // Clear input
            $content.find('#participant-input').val('');

            toast.success(users.length + ' participant(s) added successfully');
          })
          .catch(function (error) {
            var errorMessage = 'Unable to add participants. Please check the user IDs/emails is exist or not';
            toast.error(errorMessage);
            console.error(errorMessage);
          });
      })
      .on('input.RoomInfo', '.RoomInfo #search', function (event) {
        var query = $(this).val();
        if (query.length === 0) searchQuery = null;
        else searchQuery = query;

        // Use participants from room instead of deprecated getUsers()
        if (!qiscus.selected || !qiscus.selected.participants) {
          return;
        }

        var participants = qiscus.selected.participants;

        // Filter by search query
        if (searchQuery) {
          var lowerQuery = searchQuery.toLowerCase();
          participants = participants.filter(function (user) {
            return user.username.toLowerCase().includes(lowerQuery) ||
              user.email.toLowerCase().includes(lowerQuery);
          });
        }

        var users = participants.map(function (user) {
          var selected = selectedIds.includes(user.email);
          return ContactItem(user, selected);
        }).join('');

        $content.find('.contact-list')
          .empty()
          .append(users)
          .append('<li class="load-more"><button>Load more</button></li>');
      })
      .on('click.RoomInfo', '.RoomInfo .load-more button', function (event) {
        event.preventDefault()
        var currentLength = $content.find('.RoomInfo .contact-list').children().length - 1
        loadContact(currentLength)
      })
  }

  return createPage({
    path: '/room-info',
    template: template,
    bindEvents: bindEvents,
    onMount: mount
  })
})
