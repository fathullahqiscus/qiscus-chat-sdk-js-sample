define([
  'dateFns',
  'jquery',
  'lodash',
  'service/page',
  'service/content',
  'service/route',
  'service/qiscus',
  'service/emitter',
], function (dateFns, $, _, createPage, $content, route, qiscus, emitter) {
  window.$ = $;
  var isAbleToScroll = false;
  var attachmentPreviewURL = null;
  var typingTimeoutId = -1;
  var lastTypingValue = null;
  var isLoadingComments = false; // Prevent spam clicking Load more

  function Toolbar(name, avatar) {
    var selected = qiscus.selected || { participants: [], room_type: 'single' };
    var isGroup = selected.room_type === 'group';
    var participants = (function () {
      var limit = 2; // Show max 2 names
      var allParticipants = selected.participants || [];
      var overflowCount = allParticipants.length - limit;

      var participantNames = allParticipants
        .slice(0, limit)
        .map(function (it) {
          return it.username; // Use full username
        });

      if (allParticipants.length <= limit) {
        return participantNames.join(', ');
      }

      return participantNames.join(', ') + ', and ' + overflowCount + ' more...';
    })();

    return `
      <div class="ToolbarChatRoom">
        <button type="button" class="btn-icon" id="chat-toolbar-btn">
          <i class="icon icon-arrow-back"></i>
        </button>
        <img class="avatar" 
             src="${avatar || '/img/img-default-avatar-picker.svg'}" 
             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2240%22 text-anchor=%22middle%22 x=%2250%22 y=%2265%22%3E${(name || 'C').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E';">
        <button class="room-meta">
          <div class="room-name">${name || 'Chat Room'}</div>
          ${isGroup
        ? `<small class="online-status participant-list">${participants}</small>`
        : `<small class="online-status">Last Online Few Moments Ago</small>`
      }
        </button>
      </div>
    `;
  }

  function Empty() {
    return `
      <div class="comment-list-container --empty">
        <img src="/img/img-empty-message.svg">
        <div class="empty-title">Send a message!</div>
        <p class="empty-description">
          Great discussion start from greeting
          each others first
        </p>
      </div>
    `;
  }

  function AttachmentCaptioning(file) {
    return `
      <div class="AttachmentCaptioning" style="display:none">
        <div class="toolbar">
          <button type="button" class="btn-icon" id="attachment-toolbar-btn">
            <i class="icon icon-arrow-back"></i>
          </button>
          <div class="file-name">${file.name}</div>
        </div>
        <div class="image-preview-container">
          <img class="attachment-preview" src="${file.url}">
        </div>
        <form class="caption-form-container">
          <input type="text" id="caption-input" name="caption-input" placeholder="Add caption to your image">
          <button type="submit" id="caption-submit-btn">
            <i class="icon icon-send"></i>
          </button>
        </form>
      </div>
    `;
  }

  function CommentItem(comment) {
    var content = comment.message;
    var type = comment.type;
    var isMe = comment.email === qiscus.user_id;

    if (type === 'reply') {
      content = `
        <div class="replied-message-container">
        ${comment.payload.replied_comment_message}
        </div>
        <div class="replied-original-message">
        ${comment.message}
        </div>
      `;
    }

    if (type === 'upload') {
      var thumbnailURL = URL.createObjectURL(comment.file);
      var caption = comment.caption;
      content = `
        <a href="#" style="position:relative; ${caption ? 'height:80%;' : ''}" target="_blank">
          <div class="upload-overlay">
            <div class="progress">
              <div class="progress-inner"></div>
            </div>
          </div>
          <img class="image-preview" src="${thumbnailURL}" alt="preview">
        </a>
        <div class="image-caption ${caption ? '' : 'hidden'}">
          ${caption}
        </div>
      `;
    }
    if (type === 'upload-file') {
      var filename = comment.file.name;
      content = `
        <a href="#" style="position:relative;" target="_blank">
          <div class="upload-overlay">
            <div class="progress">
              <div class="progress-inner"></div>
            </div>
          </div>
          <div class="comment-file">
            <i class="icon icon-attachment-file"></i><div class="filename">${filename}</div>
          </div>
        </a>
      `;
    }
    if (
      type === 'custom' &&
      comment.payload.type === 'image' &&
      typeof comment.payload.content !== 'string'
    ) {
      var fileURL = comment.payload.content.url;
      var thumbnailURL = getAttachmentURL(fileURL).thumbnailURL;
      var caption = comment.payload.content.caption;
      caption = caption.length === 0 ? null : caption;
      content = `
        <a href="${fileURL}" target="_blank" style="${caption ? 'height:80%' : ''}">
          <img class="image-preview" src="${thumbnailURL}" alt="preview">
        </a>
        <div class="image-caption ${caption ? '' : 'hidden'}">
          ${caption}
        </div>
      `;
    } else if (
      type === 'custom' &&
      comment.payload.type === 'file' &&
      typeof comment.payload.content !== 'string'
    ) {
      var fileURL = comment.payload.content.url;
      var filename = comment.payload.content.file_name;
      type = 'file';
      content = `
        <a href="${fileURL}" target="_blank">
          <div class="comment-file">
            <i class="icon icon-attachment-file"></i><div class="filename">${filename}</div>
          </div>
        </a>
      `;
    } else if (type === 'file_attachment') {
      var fileURL = comment.payload.url;
      var filename = comment.payload.file_name;
      var attachmentURL = getAttachmentURL(fileURL);
      var thumbnailURL = attachmentURL.thumbnailURL;
      var isImage = attachmentURL.isImage;
      var caption = comment.payload.caption;
      caption = caption.length === 0 ? null : caption;
      type = 'file';
      content = `
        <a href="${fileURL}" target="_blank"
          style="${caption ? 'height:80%' : ''}">
          ${!isImage
          ? `<div class="comment-file">
              <i class="icon icon-attachment-file"></i><div class="filename">${filename}</div>
            </div>`
          : ''
        }
          ${isImage
          ? `<img class="image-preview" src="${thumbnailURL}" alt="preview">`
          : ''
        }
        </a>
        ${isImage
          ? `<div class="image-caption ${caption ? '' : 'hidden'}">
            ${caption}
          </div>`
          : ''
        }
      `;
    }
    if (type === 'date') {
      return `
        <li class="comment-item date"
          data-comment-id="${comment.id}"
          data-last-comment-id="${comment.comment_before_id}"
          data-unique-id="${comment.unique_temp_id}"
          data-comment-timestamp="${comment.unix_timestamp}"
          data-comment-type="${type}">
          <div class="message-container date">${content}</div>
        </li>
      `;
    }
    return `
        <li class="comment-item ${isMe ? 'me' : ''}"
          data-comment-id="${comment.id}"
          data-last-comment-id="${comment.comment_before_id}"
          data-unique-id="${comment.unique_temp_id}"
          data-comment-timestamp="${comment.unix_timestamp}"
          data-comment-type="${type}">
          <div class="message-container ${type}">
            ${content}
          </div>
          <div class="message-meta">
            <div class="message-time">
              ${dateFns.format(comment.timestamp, 'HH:mm')}
            </div>
            <i class="icon icon-message-${comment.status}"></i>
          </div>
          ${isMe
        ? `<div class="message-deleter">
            <button type="button" data-action="delete" data-comment-id="${comment.unique_temp_id}">
              Delete
            </button>
            <button type="button" data-action="reply" data-comment-id="${comment.id}">
              Reply
            </button>
          </div>`
        : `
              <div class="message-deleter">
            <button type="button" data-action="reply" data-comment-id="${comment.id}">
              Reply
            </button>
              </div>
              `
      }
        </li>
      `;
  }

  function getAttachmentURL(fileURL) {
    var thumbnailURL = fileURL.replace('upload', 'upload/w_320,h_320,c_limit');
    var reImage = /\S+(jpe?g|gif|png|svg)/gi;
    return {
      origin: fileURL,
      thumbnailURL: thumbnailURL,
      isImage: reImage.test(thumbnailURL),
    };
  }

  function commentListFormatter(comments) {
    var _comments = [];
    for (var i = 0; i < comments.length; i++) {
      var comment = comments[i];
      var lastComment = comments[i - 1];
      var commentDate = new Date(comment.timestamp);
      comment.date = commentDate;
      var lastCommentDate =
        lastComment == null ? null : new Date(lastComment.timestamp);
      var isSameDay = dateFns.isSameDay(commentDate, lastCommentDate);
      var showDate = lastComment != null && !isSameDay;

      var dateComment = Object.assign({}, comment);
      dateComment.type = 'date';
      dateComment.message = dateFns.format(
        dateComment.timestamp,
        'DD MMM YYYY'
      );
      if (i === 0 || showDate) _comments.push(dateComment);
      _comments.push(comment);
    }
    return _comments.sort(function (a, b) {
      return a.date - b.date;
    });
  }

  function CommentList(comments) {
    return `
      <ul>
        <li class="load-more">
          <button type="button" class="load-more-btn">Load more</button>
        </li>
        ${commentListFormatter(comments).map(CommentItem).join('')}
      </ul>
    `;
  }

  function openAttachment(event) {
    if (event != null) event.preventDefault();
    $content.find('.attachment-overlay').show();
    $content.find('ul.attachment-picker-container').slideDown(200);
  }

  function closeAttachment(event) {
    if (event != null) event.preventDefault();
    $content.find('.attachment-overlay').hide();
    $content.find('ul.attachment-picker-container').slideUp(200);
  }

  function loadComment(lastCommentId) {
    // Prevent spam clicking
    if (isLoadingComments) {
      console.log('Already loading comments, please wait...');
      return Promise.resolve();
    }

    isLoadingComments = true;
    var $loadMoreBtn = $content.find('.load-more-btn');
    var originalText = $loadMoreBtn.text();

    // Disable button and show loading state
    $loadMoreBtn
      .prop('disabled', true)
      .text('Loading...')
      .css('opacity', '0.6');

    return qiscus
      .loadComments(qiscus.selected.id, {
        last_comment_id: lastCommentId,
      })
      .then(function (data) {
        // Check if data is empty
        if (!data || data.length === 0) {
          $content.find('.load-more').addClass('hidden');
          return;
        }

        var comments = commentListFormatter(data);
        var $comments = $(comments.map(CommentItem).join(''));
        $comments.insertAfter('.load-more');

        var lastCommentId = data[0].comment_before_id;
        if (lastCommentId === 0) {
          $content.find('.load-more').addClass('hidden');
        }
      })
      .catch(function (error) {
        console.error('Error loading comments:', error);
        // Show user-friendly error message for rate limiting
        if (error.message && error.message.includes('429')) {
          toast.warning('Too many requests. Please wait a moment before loading more.', 4000);
        }
        $content.find('.load-more').addClass('hidden');
      })
      .finally(function () {
        // Re-enable button and restore state
        isLoadingComments = false;
        $loadMoreBtn
          .prop('disabled', false)
          .text(originalText)
          .css('opacity', '1');
      });
  }

  function renderReplyForm(repliedMessage) {
    return `
      <div class="reply-form-container" data-comment-unique-id="${repliedMessage.unique_temp_id}">
        <div>${repliedMessage.message}</div>
        <button id="close-reply" type="button" class="close-reply-btn">x</button>
      </div>
    `;
  }

  function ensureCommentList() {
    var $commentList = $content.find('.comment-list-container ul');
    if ($commentList.length === 0) {
      $content.find('.comment-list-container').html(CommentList([]));
      $commentList = $content.find('.comment-list-container ul');
    }
    return $commentList;
  }

  function handleIncomingMessage(comment) {
    if (qiscus.selected != null && comment.room_id !== qiscus.selected.id)
      return;

    if (
      $content.find('.comment-item[data-unique-id="' + comment.unique_temp_id + '"]')
        .length !== 0
    )
      return;

    var $comment = $(CommentItem(comment));
    $content.find('.comment-list-container ul').append($comment);
    if (isAbleToScroll) {
      $comment.get(0).scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleOnlinePresence(data) {
    var $onlineStatus = $content.find('small.online-status');
    var lastOnline = dateFns.isSameDay(data.lastOnline, new Date())
      ? dateFns.format(data.lastOnline, 'hh:mm')
      : dateFns.format(data.lastOnline, 'D/M/YY');

    if (data.isOnline) {
      $onlineStatus.removeClass('--offline').text('Online');
    } else {
      $onlineStatus.addClass('--offline').text('Last online on ' + lastOnline);
    }
  }

  function handleCommentRead(data) {
    var commentTimestamp = data.comment.unix_timestamp;
    var commentId = data.comment.id;

    $content
      .find('.comment-item[data-comment-id="' + commentId + '"]')
      .find('i.icon')
      .removeClass('icon-message-sent')
      .addClass('icon-message-read');

    $content.find('.comment-item').each(function () {
      var $el = $(this);
      var timestamp = Number($el.attr('data-comment-timestamp'));
      if (timestamp <= commentTimestamp) {
        $el
          .find('i.icon')
          .removeClass('icon-message-sent')
          .removeClass('icon-message-delivered')
          .addClass('icon-message-read');
      }
    });
  }

  function handleCommentDeleted(data) {
    var uniqueCommentId = data.commentUniqueIds[0];
    $content
      .find('.comment-item[data-unique-id="' + uniqueCommentId + '"]')
      .addClass('hidden');
  }

  function handleTyping(event) {
    var roomId = event.room_id;
    if (qiscus.selected == null) return;
    if (Number(roomId) !== qiscus.selected.id) return;
    if (qiscus.selected.room_type !== 'single') return;
    var $onlineStatus = $content.find('.room-meta .online-status');
    lastTypingValue = $onlineStatus.text();
    $onlineStatus.text('Typing ...');

    if (typingTimeoutId !== -1) clearTimeout(typingTimeoutId);
    typingTimeoutId = setTimeout(function () {
      $onlineStatus.text(lastTypingValue);
      clearTimeout(typingTimeoutId);
      typingTimeoutId = -1;
    }, 1000);
  }

  function handleDelivered(event) {
    var commentId = event.comment.id;
    var commentTimestamp = event.comment.unix_timestamp;

    $content
      .find('.comment-item[data-comment-id="' + commentId + '"]')
      .find('i.icon')
      .removeClass('icon-message-sent')
      .addClass('icon-message-delivered');
    $content.find('.comment-item').each(function () {
      var $el = $(this);
      var timestamp = Number($el.attr('data-comment-timestamp'));
      if (timestamp <= commentTimestamp) {
        $el
          .find('i.icon')
          .removeClass('icon-message-sent')
          .addClass('icon-message-delivered');
      }
    });
  }

  function bindEmitterEvents() {
    emitter.off('qiscus::new-message', handleIncomingMessage);
    emitter.off('qiscus::online-presence', handleOnlinePresence);
    emitter.off('qiscus::comment-read', handleCommentRead);
    emitter.off('qiscus::comment-deleted', handleCommentDeleted);
    emitter.off('qiscus::typing', handleTyping);
    emitter.off('qiscus::comment-delivered', handleDelivered);

    emitter.on('qiscus::new-message', handleIncomingMessage);
    emitter.on('qiscus::online-presence', handleOnlinePresence);
    emitter.on('qiscus::comment-read', handleCommentRead);
    emitter.on('qiscus::comment-deleted', handleCommentDeleted);
    emitter.on('qiscus::typing', handleTyping);
    emitter.on('qiscus::comment-delivered', handleDelivered);
  }

  function handleBack(event) {
    event.preventDefault();
    qiscus.exitChatRoom();
    route.push('/chat');
  }

  function handleMessageSubmit(event) {
    event.preventDefault();
    var $form = $(event.currentTarget);
    var message = event.currentTarget['message'].value;
    if (message == null || message.length === 0) return;

    var $reply = $form.prev();
    var isReply = $reply.hasClass('reply-form-container');
    var replyCommentUniqueId = $reply.data('comment-unique-id');
    var replyComment = (qiscus.selected && qiscus.selected.comments || []).find(function (c) {
      return c.unique_temp_id === String(replyCommentUniqueId);
    });
    var comment = isReply
      ? qiscus.generateReplyMessage({
        roomId: qiscus.selected.id,
        text: message,
        repliedMessage: replyComment,
      })
      : qiscus.generateMessage({ roomId: qiscus.selected.id, text: message });

    var commentId = comment.id;
    var uniqueId = comment.unique_temp_id;

    var $commentList = ensureCommentList();

    var $commentItem = CommentItem(comment);
    $commentList.append($commentItem);
    var $comment = $content.find(
      '.comment-item[data-comment-id="' + commentId + '"]'
    );
    $comment.attr('data-unique-id', uniqueId);
    if (isAbleToScroll) {
      $comment.get(0).scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
    $content.find('#message-form input[name="message"]').val('');

    qiscus
      .sendComment(
        qiscus.selected.id,
        comment.message,
        comment.unique_temp_id,
        comment.type,
        JSON.stringify(comment.payload),
        comment.extras
      )
      .then(function (resp) {
        $comment.attr('data-comment-id', resp.id);
        $comment.attr('data-last-comment-id', resp.comment_before_id);
        $comment.attr('data-comment-timestamp', resp.unix_timestamp);
        $comment
          .find('i.icon')
          .removeClass('icon-message-sending')
          .addClass('icon-message-sent');
        if ($reply.hasClass('reply-form-container')) {
          $reply.remove();
        }
      })
      .catch(function () {
        $comment
          .find('i.icon')
          .removeClass('icon-message-sending')
          .addClass('icon-message-failed');
      });
  }

  function handleCaptionSubmit(event) {
    event.preventDefault();
    closeAttachment();
    $content.find('.AttachmentCaptioning').slideUp();

    var file = Array.from($('#input-image').get(0).files).pop();
    var caption = event.currentTarget['caption-input'].value.trim();

    var timestamp = new Date();
    var uniqueId = timestamp.getTime();
    var commentId = timestamp.getTime();
    var comment = {
      id: commentId,
      uniqueId: uniqueId,
      unique_temp_id: uniqueId,
      message: 'Send Attachment',
      type: 'upload',
      email: qiscus.user_id,
      timestamp: timestamp,
      status: 'sending',
      file: file,
      caption: caption,
    };
    var $commentList = ensureCommentList();
    $commentList.append(CommentItem(comment));
    var $comment = $commentList.find('.comment-item[data-unique-id="' + uniqueId + '"]');
    var $progress = $comment.find('.progress-inner');
    $comment.get(0).scrollIntoView({
      behavior: 'smooth',
    });

    qiscus.upload(file, function (error, progress, fileURL) {
      if (error) return console.log('failed uploading image', error);
      if (progress) {
        $progress.css({
          width: progress.percent + '%',
        });
      }
      if (fileURL) {
        var roomId = qiscus.selected.id;
        var text = '[file] ' + fileURL + ' [/file]';
        var type = 'file_attachment';
        var payload = JSON.stringify({
          url: fileURL,
          caption: caption,
          file_name: file.name,
          size: file.size,
        });
        qiscus
          .sendComment(roomId, text, uniqueId, type, payload)
          .then(function (resp) {
            $comment
              .attr('data-comment-id', resp.id)
              .attr('data-comment-type', 'image')
              .find('i.icon')
              .removeClass('icon-message-sending')
              .addClass('icon-message-sent');
            $comment.find('.upload-overlay').remove();
            var url = getAttachmentURL(resp.payload.url);
            $comment.find('a').attr('href', url.origin);
            var objectURL = $comment.find('img').attr('src');
            URL.revokeObjectURL(objectURL);
            $comment.find('img').attr('src', url.thumbnailURL);
          });
      }
    });
  }

  function handleFileUpload(event) {
    closeAttachment();

    var file = Array.from(event.currentTarget.files).pop();
    var timestamp = new Date();
    var uniqueId = timestamp.getTime();
    var commentId = timestamp.getTime();
    var comment = {
      id: commentId,
      uniqueId: uniqueId,
      unique_temp_id: uniqueId,
      message: 'Send Attachment',
      type: 'upload-file',
      email: qiscus.user_id,
      timestamp: timestamp,
      status: 'sending',
      file: file,
    };

    var $commentList = ensureCommentList();
    $commentList.append(CommentItem(comment));
    var $comment = $commentList.find('.comment-item[data-unique-id=' + uniqueId + ']');
    var $progress = $comment.find('.progress-inner');
    $comment.get(0).scrollIntoView({
      behavior: 'smooth',
    });

    qiscus.upload(file, function (error, progress, fileURL) {
      if (error) return console.log('failed uploading file', error);
      if (progress) {
        $progress.css({
          width: progress.percent + '%',
        });
      }
      if (fileURL) {
        var roomId = qiscus.selected.id;
        var text = 'Send Attachment';
        var type = 'file_attachment';
        var payload = JSON.stringify({
          url: fileURL,
          caption: '',
          file_name: file.name,
          size: file.size,
        });
        qiscus
          .sendComment(roomId, text, uniqueId, type, payload)
          .then(function (resp) {
            $comment
              .attr('data-comment-id', resp.id)
              .attr('data-comment-type', 'file')
              .find('i.icon.icon-message-sending')
              .removeClass('icon-message-sending')
              .addClass('icon-message-sent');
            $comment.find('.upload-overlay').remove();
            var url = getAttachmentURL(resp.payload.url);
            $comment.find('a').attr('href', url.origin);
          })
          .catch(function (error) {
            console.log('failed sending comment', error);
          });
      }
    });
  }

  function bindEvents($content) {
    var $widget = $('#qiscus-widget');
    $widget.off('.Chat');
    $content.off('.Chat');

    $widget
      .on('click.Chat', '.Chat #chat-toolbar-btn', handleBack)
      .on('submit.Chat', '.Chat #message-form', handleMessageSubmit)
      .on('click.Chat', '.Chat #attachment-cancel', closeAttachment)
      .on('click.Chat', '.Chat #attachment-btn', openAttachment)
      .on('click.Chat', '.Chat #attachment-image', function (event) {
        event.preventDefault();
        $('#qiscus-widget').find('#input-image').click();
      })
      .on('click.Chat', '.Chat #attachment-file', function (event) {
        event.preventDefault();
        $('#qiscus-widget').find('#input-file').click();
      })
      .on('change.Chat', '#input-image', function (event) {
        var file = Array.from(event.currentTarget.files).pop();
        if (attachmentPreviewURL != null)
          URL.revokeObjectURL(attachmentPreviewURL);
        attachmentPreviewURL = URL.createObjectURL(file);
        closeAttachment();
        var $attachmentCaptioning = $content.find('.AttachmentCaptioning');
        $attachmentCaptioning.slideDown();
        $attachmentCaptioning
          .find('.attachment-preview')
          .attr('src', attachmentPreviewURL);
        $content.find('.file-name').text(file.name);
      })
      .on('submit.Chat', '.Chat .caption-form-container', handleCaptionSubmit)
      .on('change.Chat', '#input-file', handleFileUpload)
      .on('click.Chat', '.Chat #attachment-toolbar-btn', function (event) {
        event.preventDefault();
        closeAttachment();
      })
      .on('click.Chat', '.Chat .load-more-btn', function (event) {
        event.preventDefault();
        var $commentList = $content.find('.comment-list-container ul');
        var lastCommentId = $commentList.children().get(1).dataset['lastCommentId'];
        loadComment(lastCommentId);
      })
      .on('click.Chat', '.Chat .room-meta', function (event) {
        event.preventDefault();
        // Pass complete room data to avoid API call
        route.push('/room-info', {
          roomId: qiscus.selected.id,
          roomData: qiscus.selected  // Pass entire room object
        });
        console.log('✅ Using room data from state (no API call needed)', qiscus.selected);
      })
      .on(
        'keydown.Chat',
        '.Chat input#message',
        _.throttle(function () {
          qiscus.publishTyping(1);
        }, 300)
      )
      .on(
        'click.Chat',
        '.Chat .message-deleter button[data-action="delete"]',
        function (event) {
          event.preventDefault();
          var $el = $(this);
          var commentId = $(this).attr('data-comment-id');
          var $comment = $el.closest('.comment-item');
          qiscus
            .deleteComment(qiscus.selected.id, [commentId])
            .then(function () {
              $comment.remove();
            })
            .catch(function (err) {
              console.error('failed deleting comment', err);
            });
        }
      )
      .on(
        'click.Chat',
        '.Chat .message-deleter button[data-action="reply"]',
        function (event) {
          event.preventDefault();
          var uniqueId = $(event.currentTarget)
            .parents('.comment-item')
            .data('unique-id');
          var comment = (qiscus.selected.comments || []).find(function (it) {
            return it.unique_temp_id === String(uniqueId);
          });
          if (comment == null) {
            return false;
          }
          var dom = renderReplyForm(comment);
          $(dom).insertBefore('#message-form');
          $('#message-form input').focus();
        }
      )
      .on('click.Chat', '.Chat button#close-reply', function (event) {
        event.stopPropagation();
        $(event.currentTarget).parent().remove();
      });

    bindEmitterEvents();
  }

  function mountChat() {
    if (qiscus.selected == null) return;
    qiscus.loadComments(qiscus.selected.id).then(function (comments) {
      $content
        .find('.comment-list-container')
        .removeClass('--empty')
        .html(CommentList(comments));

      var $commentList = $content.find('.comment-list-container ul');
      var element = $commentList.children().last();
      element.get(0).scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      var firstComment = $commentList.children().get(1);
      if (firstComment == null) {
        $content.find('.load-more').addClass('hidden');
      } else {
        var lastCommentId = firstComment.dataset.lastCommentId;
        if (Number(lastCommentId) === 0) {
          $content.find('.load-more').addClass('hidden');
        }
      }

      $('.comment-list-container ul').on(
        'scroll',
        _.debounce(function () {
          var $root = $(this);
          var $$root = $root.get(0);

          var total = Math.ceil($root.scrollTop() + $root.height());
          var required = $$root.scrollHeight;

          var offset = 50;
          isAbleToScroll = !(required - offset >= total);
        }, 300)
      );
    });
  }

  function template(state) {
    return `
      <div class="Chat">
        ${Toolbar(state.roomName, state.roomAvatar)}
        ${Empty()}
        ${AttachmentCaptioning({ url: '#', name: '' })}
        <form id="message-form" class="message-form">
          <button type="button" id="attachment-btn">
            <i class="icon icon-attachment"></i>
          </button>
          <input autocomplete="off" type="text" placeholder="Type your message" id="message" name="message">
          <button type="submit">
            <i class="icon icon-send"></i>
          </button>
        </form>
        <div class="attachment-overlay" style="display:none"></div>
        <ul class="attachment-picker-container" style="display:none">
          <li>
            <button type="button" class="attachment-btn" id="attachment-image">
              <i class="icon icon-attachment-image"></i> Image from Gallery
            </button>
          </li>
          <li>
            <button type="button" class="attachment-btn" id="attachment-file">
              <i class="icon icon-attachment-file"></i> File / Document
            </button>
          </li>
          <li>
            <button type="button" class="attachment-btn" id="attachment-cancel">
              <i class="icon icon-attachment-cancel"></i> Cancel
            </button>
          </li>
        </ul>
      </div>
    `;
  }

  return createPage({
    path: '/chat-room',
    template: template,
    bindEvents: bindEvents,
    onMount: mountChat,
  });
});
