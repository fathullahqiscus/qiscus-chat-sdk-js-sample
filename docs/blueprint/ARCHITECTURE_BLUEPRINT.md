# Qiscus Multichannel Widget - Architecture Blueprint

## Overview
This document provides a language-agnostic blueprint for implementing the Qiscus Multichannel Widget in any programming language or platform. The architecture follows a modular design with clear separation of concerns.

---

## 1. Core Architecture

### 1.1 Main Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Widget Entry Point                        │
│              (QiscusMultichannelWidget)                      │
├─────────────────────────────────────────────────────────────┤
│  - Singleton Instance Management                             │
│  - Initialization & Configuration                            │
│  - User Session Management                                   │
│  - Chat Room Builder Factory                                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Configuration│   │    Color     │   │  Component   │
│    Module    │   │   Theming    │   │   Factory    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
        ┌───────────────────────────────────────┐
        │         Core Services Layer            │
        ├───────────────────────────────────────┤
        │  - Session Management                  │
        │  - Authentication Service              │
        │  - Chat Room Service                   │
        │  - Notification Service                │
        │  - Storage Service                     │
        └───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     Data     │   │      UI      │   │   Network    │
│     Layer    │   │    Layer     │   │    Layer     │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 2. Module Specifications

### 2.1 Widget Entry Point Module

**Purpose**: Main SDK interface and lifecycle management

**Key Responsibilities**:
- SDK initialization with app credentials
- Singleton pattern implementation
- Configuration management
- User authentication state
- Factory for chat room builder

**Public API Methods**:

```
setup(application, coreSDK, appId, config, color, localPrefKey)
  → Returns: Widget Instance
  → Initializes the widget with configuration

setUser(userId, displayName, avatarUrl, userProperties, extras)
  → Sets current user information
  → userProperties: Map<String, String> for custom attributes
  → extras: JSON object for additional data

isLoggedIn()
  → Returns: Boolean
  → Checks if user is authenticated

hasSetupUser()
  → Returns: Boolean
  → Checks if user data is configured

clearUser()
  → Clears user session and local data

initiateChat()
  → Returns: ChatRoomBuilder
  → Factory method to build and start chat

registerDeviceToken(coreSDK, token)
  → Registers push notification token

isMultichannelMessage(remoteMessage, coreSDKList)
  → Returns: Boolean
  → Validates if push notification belongs to this widget

getNonce(onSuccess, onError)
  → Retrieves JWT nonce for authentication

updateUser(username, avatarUrl, extras, onSuccess, onError)
  → Updates user profile information

openChatRoom(context, clearTaskActivity)
  → Opens existing chat room

openChatRoomById(roomId, onSuccess, onError)
  → Opens specific chat room by ID
```

**Internal State**:
- Application context reference
- Core SDK instance
- Configuration object
- Color theme object
- Component factory
- Session manager
- Current user data

---

### 2.2 Configuration Module

**Purpose**: Widget behavior and feature configuration

**Configuration Properties**:

```
Notification Settings:
  - enableNotification: Boolean (default: true)
  - notificationIcon: Resource ID
  - notificationListener: Custom notification handler

Logging:
  - enableLog: Boolean (default: false)

Room Display:
  - roomTitle: String (nullable)
  - roomSubtitle: String (nullable)
  - subtitleType: Enum [ENABLE, DISABLE, EDITABLE]

UI Features:
  - avatarConfig: Enum [ENABLE, DISABLE]
  - showSystemMessage: Boolean (default: false)

Session:
  - isSessional: Boolean (default: false)
  - channelId: Integer (optional)
```

**Storage**:
- Uses local persistent storage (SharedPreferences/UserDefaults/LocalStorage)
- Key-value pairs for configuration persistence
- Namespace: "qiscus_multichannel_config"

---

### 2.3 Color Theming Module

**Purpose**: UI customization and branding

**Customizable Colors**:

```
Navigation:
  - navigationColor
  - navigationTitleColor

Chat Bubbles:
  - leftBubbleColor (agent messages)
  - rightBubbleColor (customer messages)
  - leftBubbleTextColor
  - rightBubbleTextColor

Input Area:
  - sendContainerColor
  - sendContainerBackgroundColor
  - fieldChatBorderColor

System Elements:
  - systemEventTextColor
  - timeLabelTextColor
  - timeBackgroundColor
  - baseColor (background)

Empty State:
  - emptyTextColor
  - emptyBackgroundColor
```

---

### 2.4 Chat Room Builder Module

**Purpose**: Fluent API for configuring and launching chat

**Builder Pattern Methods**:

```
setRoomTitle(title: String)
  → Sets custom room title

setRoomSubtitle(type: SubtitleType, subtitle: String)
  → Configures room subtitle display

setAvatar(config: AvatarConfig)
  → Enable/disable avatar display

setShowSystemMessage(show: Boolean)
  → Toggle system message visibility

setSessional(isSessional: Boolean)
  → Enable sessional chat mode

setChannelId(channelId: Integer)
  → Set specific channel for routing

automaticSendMessage(message: String)
  → Queue message to send automatically on room open

automaticSendMessage(messageObject: Message)
  → Queue structured message to send automatically

manualSendMessage(message: String)
  → Pre-fill input field without sending

showLoadingWhenInitiate(show: Boolean)
  → Display loading screen during initialization

onCompleted(callback: SessionCompleteListener)
  → Register callback for initialization completion

startChat(context)
  → Execute chat initialization and open UI

startChat(context, initiateCallback)
  → Execute with custom callback handling
```

**Execution Flow**:
1. Validate user is set
2. Save configuration to persistent storage
3. Clear previous session if needed
4. Initiate chat session with backend
5. Retrieve or create chat room
6. Open chat UI with configured options

---

## 3. Data Layer

### 3.1 Data Models

**User Model**:
```
User {
  userId: String (required)
  name: String (required)
  avatar: String (URL)
  sessionId: String (nullable)
  userProperties: Map<String, String> (nullable)
  extras: JSON Object
}
```

**UserProperties Model**:
```
UserProperties {
  key: String
  value: String
}
```

**Message Model**:
```
Message {
  id: Long
  roomId: Long
  text: String
  type: MessageType (text, image, file, etc.)
  timestamp: Long
  sender: User
  status: MessageStatus (sending, sent, delivered, read)
  extras: JSON Object
}
```

**ChatRoom Model**:
```
ChatRoom {
  id: Long
  name: String
  subtitle: String
  avatarUrl: String
  lastMessage: Message
  unreadCount: Integer
  participants: List<User>
  options: JSON Object
}
```

**InitialChatData Model**:
```
InitialChatData {
  appId: String
  userId: String
  name: String
  avatar: String
  sessionId: String (nullable)
  deviceId: String
  channelId: Integer (nullable)
  userProperties: List<UserProperties>
  extras: JSON Object
}
```

### 3.2 Repository Layer

**ChatRepository Interface**:
```
initiateChat(data: InitialChatData)
  → Returns: ChatSession
  → POST /api/v2/qiscus/initiate_chat

getCustomerRoomById(roomId: Long)
  → Returns: ChatRoom
  → GET /api/v2/customer_rooms/{room_id}

sessionalCheck(appCode: String)
  → Returns: SessionStatus
  → GET /{appCode}/get_session
```

**LocalStorage Interface**:
```
saveUser(user: User)
getUserId() → String
getUsername() → String
getAvatar() → String
getExtras() → JSON Object
getUserProps() → List<UserProperties>
getRoomId() → Long
saveRoomId(roomId: Long)
clearPreferences()
```

**SessionStorage Interface**:
```
getSessionId(userId: String) → String
isInitiate() → Boolean
setInitiate(value: Boolean)
clearSession()
```

---

## 4. Network Layer

### 4.1 API Endpoints

**Base URL**: Configurable (default: Qiscus Multichannel API)

**Authentication**:
- Uses JWT token from core SDK
- Nonce-based authentication flow

**Endpoints**:

```
POST /api/v2/qiscus/initiate_chat
  Headers: 
    - Content-Type: application/json
  Body: InitialChatData
  Response: {
    customer_room: ChatRoom,
    identity_token: String,
    is_sessional: Boolean
  }

GET /{appCode}/get_session
  Response: SessionStatus

GET /api/v2/customer_rooms/{room_id}
  Response: ChatRoom details
```

### 4.2 Network Client Requirements

- HTTP client with interceptor support
- Request/response logging (configurable)
- Error handling and retry logic
- Timeout configuration
- JSON serialization/deserialization

---

## 5. UI Layer

### 5.1 Screen Components

**Loading Screen**:
- Display during chat initialization
- Progress indicator
- Cancellable (optional)

**Chat Room Screen**:
- Navigation bar with title and subtitle
- Message list (scrollable)
- Input field with send button
- Attachment options
- System message display
- Typing indicators
- Read receipts

**Message Types**:
- Text messages
- Images
- Files/Documents
- Audio messages
- Video messages
- Location
- Carousel/Cards (structured messages)
- System events

### 5.2 UI State Management

**Chat Room States**:
- Loading
- Empty (no messages)
- Active (with messages)
- Error
- Offline

**Message States**:
- Sending
- Sent
- Delivered
- Read
- Failed

---

## 6. Service Layer

### 6.1 Session Management Service

**Responsibilities**:
- User authentication flow
- Session persistence
- Token management
- Session validation

**Key Methods**:
```
initiateChat(name, userId, avatar, sessionId, extras, userProps, onSuccess, onError)
  → Authenticates user and creates/retrieves chat session

goToChatroom(roomId, onSuccess, onError)
  → Validates session and retrieves chat room

setCompleteListener(listener)
  → Registers callback for session completion
```

### 6.2 Notification Service

**Responsibilities**:
- Push notification registration
- Notification display
- Notification routing
- Deep linking to chat

**Key Methods**:
```
registerDeviceToken(token)
  → Registers device for push notifications

handleNotification(notification)
  → Processes incoming notification

isMultichannelMessage(notification)
  → Validates notification source

showNotification(context, message)
  → Displays notification to user
```

### 6.3 Media Service

**Responsibilities**:
- Image compression
- File upload
- Media preview
- Audio recording
- Video handling

**Key Methods**:
```
compressImage(imagePath, quality)
  → Returns: Compressed image path

uploadFile(file, onProgress, onSuccess, onError)
  → Uploads file to server

recordAudio(onRecordingUpdate)
  → Handles audio recording

previewMedia(mediaUrl, type)
  → Opens media preview
```

---

## 7. Utility Modules

### 7.1 Date/Time Utilities
- Message timestamp formatting
- Relative time display (e.g., "2 hours ago")
- Date grouping for messages

### 7.2 Permission Utilities
- Camera permission
- Storage permission
- Microphone permission
- Location permission

### 7.3 Image Utilities
- Image compression
- Thumbnail generation
- Image rotation correction
- Format conversion

### 7.4 Audio Utilities
- Audio recording
- Audio playback
- Waveform visualization
- Duration calculation

---

## 8. Platform-Specific Considerations

### 8.1 Android Implementation
- Use Kotlin/Java
- Activity/Fragment for UI
- SharedPreferences for storage
- Retrofit for networking
- Firebase Cloud Messaging for push
- Glide/Picasso for image loading
- ExoPlayer for media playback

### 8.2 iOS Implementation
- Use Swift/Objective-C
- UIViewController for UI
- UserDefaults for storage
- URLSession/Alamofire for networking
- APNs for push notifications
- SDWebImage for image loading
- AVPlayer for media playback

### 8.3 Web Implementation
- Use JavaScript/TypeScript
- React/Vue/Angular for UI
- LocalStorage/IndexedDB for storage
- Fetch/Axios for networking
- Web Push API for notifications
- HTML5 for media playback

### 8.4 Flutter Implementation
- Use Dart
- Widget-based UI
- SharedPreferences plugin for storage
- Dio/HTTP for networking
- Firebase Messaging for push
- Cached Network Image for images
- Video Player plugin for media

---

## 9. Security Considerations

### 9.1 Authentication
- JWT token-based authentication
- Nonce validation
- Secure token storage
- Token refresh mechanism

### 9.2 Data Protection
- Encrypt sensitive data in local storage
- Secure API communication (HTTPS)
- Validate server certificates
- Sanitize user inputs

### 9.3 Privacy
- User data anonymization options
- GDPR compliance support
- Data retention policies
- Clear user data on logout

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Configuration module
- Data models
- Utility functions
- Business logic

### 10.2 Integration Tests
- API communication
- Session management
- Notification handling
- Storage operations

### 10.3 UI Tests
- Chat room interactions
- Message sending/receiving
- Media attachments
- Navigation flows

---

## 11. Error Handling

### 11.1 Error Categories

**Network Errors**:
- Connection timeout
- No internet connection
- Server errors (5xx)
- Client errors (4xx)

**Authentication Errors**:
- Invalid credentials
- Expired session
- Token refresh failure

**Validation Errors**:
- Missing required fields
- Invalid data format
- User not set

**Media Errors**:
- Upload failure
- Unsupported format
- File size exceeded

### 11.2 Error Handling Strategy

```
try {
  // Operation
} catch (error) {
  if (error is NetworkError) {
    // Show retry option
    // Cache operation for later
  } else if (error is AuthError) {
    // Re-authenticate user
    // Clear invalid session
  } else if (error is ValidationError) {
    // Show user-friendly message
    // Guide user to fix input
  } else {
    // Log error
    // Show generic error message
    // Provide support contact
  }
}
```

---

## 12. Performance Optimization

### 12.1 Message Loading
- Pagination (load messages in chunks)
- Virtual scrolling for large lists
- Image lazy loading
- Thumbnail generation

### 12.2 Caching Strategy
- Cache user data locally
- Cache chat room metadata
- Cache media files
- Implement cache expiration

### 12.3 Network Optimization
- Request batching
- Response compression
- Connection pooling
- Retry with exponential backoff

---

## 13. Localization Support

### 13.1 Localizable Strings
- UI labels and buttons
- Error messages
- System messages
- Date/time formats

### 13.2 RTL Support
- Right-to-left layout
- Text alignment
- Icon mirroring

---

## 14. Accessibility

### 14.1 Requirements
- Screen reader support
- Keyboard navigation
- Color contrast compliance
- Font scaling support
- Alternative text for images

---

## 15. Analytics & Monitoring

### 15.1 Events to Track
- Widget initialization
- User authentication
- Chat session start
- Message sent/received
- Media upload
- Errors and crashes

### 15.2 Metrics
- Session duration
- Message delivery time
- API response time
- Error rates
- User engagement

---

## 16. Migration Guide

### 16.1 Version Compatibility
- Maintain backward compatibility
- Provide migration scripts
- Document breaking changes
- Deprecation warnings

### 16.2 Data Migration
- User session migration
- Message history migration
- Configuration migration
- Cache invalidation strategy

---

## 17. Deployment Checklist

### 17.1 Pre-deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Version number incremented
- [ ] Changelog updated

### 17.2 Deployment
- [ ] Build artifacts generated
- [ ] Published to package repository
- [ ] Release notes published
- [ ] Migration guide available

### 17.3 Post-deployment
- [ ] Monitor error rates
- [ ] Check analytics
- [ ] Gather user feedback
- [ ] Plan next iteration

---

## 18. API Reference Summary

### 18.1 Initialization
```
Widget.setup(config) → WidgetInstance
```

### 18.2 User Management
```
widget.setUser(userId, name, avatar, properties, extras)
widget.isLoggedIn() → Boolean
widget.clearUser()
```

### 18.3 Chat Operations
```
widget.initiateChat()
  .setRoomTitle(title)
  .setRoomSubtitle(type, subtitle)
  .automaticSendMessage(message)
  .startChat(context)
```

### 18.4 Notifications
```
widget.registerDeviceToken(token)
widget.isMultichannelMessage(notification) → Boolean
```

### 18.5 Customization
```
config.setNavigationColor(color)
config.setLeftBubbleColor(color)
config.setRightBubbleColor(color)
// ... more color configurations
```

---

## 19. Dependencies

### 19.1 Core Dependencies
- HTTP client library
- JSON parser
- Image loading library
- Local storage library
- Push notification service

### 19.2 Optional Dependencies
- Media player library
- Image compression library
- Audio recording library
- Analytics SDK

---

## 20. Support & Resources

### 20.1 Documentation
- API documentation
- Integration guides
- Code examples
- FAQ

### 20.2 Community
- GitHub repository
- Issue tracker
- Discussion forum
- Stack Overflow tag

### 20.3 Support Channels
- Email support
- Chat support
- Documentation portal
- Video tutorials

---

## Appendix A: Configuration Examples

### Example 1: Basic Setup
```
widget = Widget.setup(
  application: app,
  coreSDK: qiscusCore,
  appId: "YOUR_APP_ID",
  localPrefKey: "qiscus_pref"
)

widget.setUser(
  userId: "user123",
  name: "John Doe",
  avatar: "https://example.com/avatar.jpg"
)

widget.initiateChat().startChat(context)
```

### Example 2: Advanced Configuration
```
config = WidgetConfig()
  .setEnableLog(true)
  .setEnableNotification(true)
  .setNotificationListener(customListener)

color = WidgetColor()
  .setNavigationColor("#FF5722")
  .setLeftBubbleColor("#E0E0E0")
  .setRightBubbleColor("#4CAF50")

widget = Widget.setup(
  application: app,
  coreSDK: qiscusCore,
  appId: "YOUR_APP_ID",
  config: config,
  color: color,
  localPrefKey: "qiscus_pref"
)

widget.setUser(
  userId: "user123",
  name: "John Doe",
  avatar: "https://example.com/avatar.jpg",
  userProperties: {
    "city": "New York",
    "plan": "premium"
  }
)

widget.initiateChat()
  .setRoomTitle("Customer Support")
  .setRoomSubtitle(SubtitleType.EDITABLE, "We're here to help")
  .setAvatar(AvatarConfig.ENABLE)
  .setShowSystemMessage(true)
  .automaticSendMessage("Hello, I need help")
  .onCompleted(() => {
    // Register push notification
    widget.registerDeviceToken(fcmToken)
  })
  .startChat(context)
```

---

## Appendix B: State Diagrams

### User Session State
```
[Not Initialized] → setup() → [Initialized]
[Initialized] → setUser() → [User Set]
[User Set] → initiateChat() → [Authenticating]
[Authenticating] → success → [Active Session]
[Authenticating] → failure → [User Set]
[Active Session] → clearUser() → [Initialized]
```

### Message State
```
[Composing] → send() → [Sending]
[Sending] → success → [Sent]
[Sent] → delivered → [Delivered]
[Delivered] → read → [Read]
[Sending] → failure → [Failed]
[Failed] → retry() → [Sending]
```

---

## Appendix C: Sequence Diagrams

### Chat Initialization Flow
```
User → Widget: initiateChat()
Widget → Builder: create ChatRoomBuilder
User → Builder: configure options
User → Builder: startChat()
Builder → Widget: validate user
Widget → SessionManager: initiateChat()
SessionManager → API: POST /initiate_chat
API → SessionManager: return session data
SessionManager → LocalStorage: save session
SessionManager → Widget: session ready
Widget → UI: open chat room
UI → User: display chat interface
```

### Message Sending Flow
```
User → UI: type message
User → UI: click send
UI → ChatRoom: sendMessage()
ChatRoom → LocalStorage: save pending message
ChatRoom → API: POST /send_message
ChatRoom → UI: update message status (sending)
API → ChatRoom: message sent confirmation
ChatRoom → LocalStorage: update message status
ChatRoom → UI: update message status (sent)
PushService → OtherUser: notify new message
```

---

## Version History

- **v1.0.0** - Initial blueprint based on Android implementation
  - Core architecture defined
  - API specifications documented
  - Platform considerations outlined

---

## License

This blueprint is provided as documentation for implementing the Qiscus Multichannel Widget across different platforms. Refer to the main project license for usage terms.

---

## Contributing

When implementing this blueprint in a new language:
1. Follow the architecture patterns defined
2. Maintain API compatibility
3. Document platform-specific adaptations
4. Submit implementation guide as PR
5. Add platform to supported list

---

**End of Blueprint Document**
