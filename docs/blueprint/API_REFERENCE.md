# Qiscus Multichannel Widget - API Reference

## Quick Reference Guide

This document provides a quick reference for all public APIs in the Qiscus Multichannel Widget.

---

## Table of Contents
1. [Widget Setup](#widget-setup)
2. [User Management](#user-management)
3. [Chat Operations](#chat-operations)
4. [Configuration](#configuration)
5. [Color Customization](#color-customization)
6. [Notifications](#notifications)
7. [Callbacks & Listeners](#callbacks--listeners)

---

## Widget Setup

### `setup()`
Initialize the widget instance.

**Signature:**
```
QiscusMultichannelWidget.setup(
  application: Application,
  coreSDK: QiscusCore,
  appId: String,
  localPrefKey: String
) → QiscusMultichannelWidget

QiscusMultichannelWidget.setup(
  application: Application,
  coreSDK: QiscusCore,
  appId: String,
  config: QiscusMultichannelWidgetConfig,
  localPrefKey: String
) → QiscusMultichannelWidget

QiscusMultichannelWidget.setup(
  application: Application,
  coreSDK: QiscusCore,
  appId: String,
  config: QiscusMultichannelWidgetConfig,
  color: QiscusMultichannelWidgetColor,
  localPrefKey: String
) → QiscusMultichannelWidget
```

**Parameters:**
- `application`: Application context
- `coreSDK`: QiscusCore instance
- `appId`: Your Qiscus app ID
- `config`: (Optional) Configuration object
- `color`: (Optional) Color theme object
- `localPrefKey`: Local storage identifier

**Returns:** Widget instance

**Example:**
```kotlin
val widget = QiscusMultichannelWidget.setup(
  application,
  qiscusCore,
  "YOUR_APP_ID",
  "qiscus_pref"
)
```

---

### `getInstance()`
Get the singleton widget instance.

**Signature:**
```
QiscusMultichannelWidget.getInstance() → QiscusMultichannelWidget
```

**Returns:** Widget instance

**Throws:** RuntimeException if widget not initialized

**Example:**
```kotlin
val widget = QiscusMultichannelWidget.instance
```

---

## User Management

### `setUser()`
Set the current user information.

**Signature:**
```
setUser(
  userId: String,
  name: String,
  avatar: String,
  userProperties: Map<String, String>? = null,
  extras: JSONObject = JSONObject()
)
```

**Parameters:**
- `userId`: Unique user identifier (required)
- `name`: Display name (required)
- `avatar`: Avatar URL (required)
- `userProperties`: Custom user attributes (optional)
- `extras`: Additional JSON data (optional)

**Example:**
```kotlin
widget.setUser(
  "user123",
  "John Doe",
  "https://example.com/avatar.jpg",
  mapOf("city" to "New York", "plan" to "premium")
)
```

---

### `isLoggedIn()`
Check if user is authenticated.

**Signature:**
```
isLoggedIn() → Boolean
```

**Returns:** `true` if user is logged in, `false` otherwise

**Example:**
```kotlin
if (widget.isLoggedIn()) {
  // User is authenticated
}
```

---

### `hasSetupUser()`
Check if user data is configured.

**Signature:**
```
hasSetupUser() → Boolean
```

**Returns:** `true` if user is set up, `false` otherwise

**Example:**
```kotlin
if (widget.hasSetupUser()) {
  // User data is configured
}
```

---

### `clearUser()`
Clear user session and local data.

**Signature:**
```
clearUser()
```

**Example:**
```kotlin
widget.clearUser()
```

---

## Chat Operations

### `initiateChat()`
Create a chat room builder to configure and start chat.

**Signature:**
```
initiateChat() → QiscusChatRoomBuilder
```

**Returns:** ChatRoomBuilder instance for fluent configuration

**Example:**
```kotlin
widget.initiateChat()
  .setRoomTitle("Support")
  .startChat(context)
```

---

### `openChatRoom()`
Open existing chat room.

**Signature:**
```
openChatRoom(context: Context)
openChatRoom(context: Context, clearTaskActivity: Boolean)
```

**Parameters:**
- `context`: Android context
- `clearTaskActivity`: Clear activity stack (default: false)

**Example:**
```kotlin
widget.openChatRoom(context, true)
```

---

### `openChatRoomById()`
Open specific chat room by ID.

**Signature:**
```
openChatRoomById(
  roomId: Long,
  onSuccess: (QChatRoom) -> Unit,
  onError: (Throwable) -> Unit
)

openChatRoomById(
  context: Context,
  roomId: Long,
  clearTaskActivity: Boolean,
  onError: (Throwable) -> Unit
)
```

**Parameters:**
- `roomId`: Chat room ID
- `context`: Android context
- `clearTaskActivity`: Clear activity stack
- `onSuccess`: Success callback
- `onError`: Error callback

**Example:**
```kotlin
widget.openChatRoomById(12345,
  { chatRoom -> 
    // Success
  },
  { error ->
    // Handle error
  }
)
```

---

## Chat Room Builder

### `setRoomTitle()`
Set custom room title.

**Signature:**
```
setRoomTitle(title: String?) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.setRoomTitle("Customer Support")
```

---

### `setRoomSubtitle()`
Configure room subtitle.

**Signature:**
```
setRoomSubtitle(
  type: RoomSubtitle,
  subtitle: String?
) → QiscusChatRoomBuilder

setRoomSubtitle(type: RoomSubtitle) → QiscusChatRoomBuilder
```

**Parameters:**
- `type`: ENABLE, DISABLE, or EDITABLE
- `subtitle`: Custom subtitle text (for EDITABLE type)

**Example:**
```kotlin
builder.setRoomSubtitle(
  RoomSubtitle.EDITABLE,
  "We're here to help"
)
```

---

### `setAvatar()`
Enable/disable avatar display.

**Signature:**
```
setAvatar(config: Avatar) → QiscusChatRoomBuilder
```

**Parameters:**
- `config`: ENABLE or DISABLE

**Example:**
```kotlin
builder.setAvatar(Avatar.ENABLE)
```

---

### `setShowSystemMessage()`
Toggle system message visibility.

**Signature:**
```
setShowSystemMessage(show: Boolean) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.setShowSystemMessage(true)
```

---

### `setSessional()`
Enable sessional chat mode.

**Signature:**
```
setSessional(isSessional: Boolean) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.setSessional(true)
```

---

### `setChannelId()`
Set specific channel for routing.

**Signature:**
```
setChannelId(channelId: Int) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.setChannelId(123)
```

---

### `automaticSendMessage()`
Queue message to send automatically.

**Signature:**
```
automaticSendMessage(message: String) → QiscusChatRoomBuilder
automaticSendMessage(message: QMessage) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.automaticSendMessage("Hello, I need help")
```

---

### `manualSendMessage()`
Pre-fill input field without sending.

**Signature:**
```
manualSendMessage(message: String) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.manualSendMessage("Type your question here")
```

---

### `showLoadingWhenInitiate()`
Display loading screen during initialization.

**Signature:**
```
showLoadingWhenInitiate(show: Boolean) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.showLoadingWhenInitiate(true)
```

---

### `onCompleted()`
Register callback for initialization completion.

**Signature:**
```
onCompleted(listener: SessionCompleteListener) → QiscusChatRoomBuilder
```

**Example:**
```kotlin
builder.onCompleted(object : SessionCompleteListener {
  override fun onCompleted() {
    // Initialization completed
  }
})
```

---

### `startChat()`
Execute chat initialization and open UI.

**Signature:**
```
startChat(context: Context)
```

**Example:**
```kotlin
builder.startChat(context)
```

---

## Configuration

### `setEnableLog()`
Enable/disable debug logging.

**Signature:**
```
setEnableLog(enable: Boolean) → QiscusMultichannelWidgetConfig
```

**Example:**
```kotlin
config.setEnableLog(true)
```

---

### `setEnableNotification()`
Enable/disable push notifications.

**Signature:**
```
setEnableNotification(enable: Boolean) → QiscusMultichannelWidgetConfig
```

**Example:**
```kotlin
config.setEnableNotification(true)
```

---

### `setNotificationIcon()`
Set custom notification icon.

**Signature:**
```
setNotificationIcon(iconId: Int) → QiscusMultichannelWidgetConfig
```

**Example:**
```kotlin
config.setNotificationIcon(R.drawable.ic_notification)
```

---

### `setNotificationListener()`
Set custom notification handler.

**Signature:**
```
setNotificationListener(
  listener: MultichannelNotificationListener
) → QiscusMultichannelWidgetConfig
```

**Example:**
```kotlin
config.setNotificationListener(object : MultichannelNotificationListener {
  override fun handleMultichannelListener(
    context: Context?,
    message: QMessage?
  ) {
    // Custom notification handling
  }
})
```

---

## Color Customization

### Navigation Colors
```
setNavigationColor(color: Int)
setNavigationTitleColor(color: Int)
```

### Chat Bubble Colors
```
setLeftBubbleColor(color: Int)
setRightBubbleColor(color: Int)
setLeftBubbleTextColor(color: Int)
setRightBubbleTextColor(color: Int)
```

### Input Area Colors
```
setSendContainerColor(color: Int)
setSendContainerBackgroundColor(color: Int)
setFieldChatBorderColor(color: Int)
```

### System Element Colors
```
setSystemEventTextColor(color: Int)
setTimeLabelTextColor(color: Int)
setTimeBackgroundColor(color: Int)
setBaseColor(color: Int)
```

### Empty State Colors
```
setEmptyTextColor(color: Int)
setEmptyBackgroundColor(color: Int)
```

**Example:**
```kotlin
val color = QiscusMultichannelWidgetColor()
  .setNavigationColor(Color.parseColor("#FF5722"))
  .setLeftBubbleColor(Color.parseColor("#E0E0E0"))
  .setRightBubbleColor(Color.parseColor("#4CAF50"))
```

---

## Notifications

### `registerDeviceToken()`
Register device for push notifications.

**Signature:**
```
registerDeviceToken(coreSDK: QiscusCore, token: String)
```

**Parameters:**
- `coreSDK`: QiscusCore instance
- `token`: FCM/APNs device token

**Example:**
```kotlin
widget.registerDeviceToken(qiscusCore, fcmToken)
```

---

### `isMultichannelMessage()`
Check if notification belongs to this widget.

**Signature:**
```
isMultichannelMessage(
  remoteMessage: RemoteMessage,
  qiscusCores: MutableList<QiscusCore>
) → Boolean
```

**Returns:** `true` if message is for this widget

**Example:**
```kotlin
if (widget.isMultichannelMessage(remoteMessage, listOf(qiscusCore))) {
  // Handle notification
}
```

---

## Callbacks & Listeners

### SessionCompleteListener
Called when chat initialization completes.

**Interface:**
```kotlin
interface SessionCompleteListener {
  fun onCompleted()
}
```

---

### MultichannelNotificationListener
Custom notification handler.

**Interface:**
```kotlin
interface MultichannelNotificationListener {
  fun handleMultichannelListener(
    context: Context?,
    message: QMessage?
  )
}
```

---

## Enums

### RoomSubtitle
```
ENABLE    - Show system-generated subtitle
DISABLE   - Hide subtitle
EDITABLE  - Show custom subtitle
```

### Avatar
```
ENABLE   - Show avatar and name
DISABLE  - Hide avatar and name
```

---

## Complete Example

```kotlin
// 1. Setup widget
val config = QiscusMultichannelWidgetConfig()
  .setEnableLog(true)
  .setEnableNotification(true)

val color = QiscusMultichannelWidgetColor()
  .setNavigationColor(Color.parseColor("#FF5722"))
  .setLeftBubbleColor(Color.parseColor("#E0E0E0"))
  .setRightBubbleColor(Color.parseColor("#4CAF50"))

val widget = QiscusMultichannelWidget.setup(
  application,
  qiscusCore,
  "YOUR_APP_ID",
  config,
  color,
  "qiscus_pref"
)

// 2. Set user
widget.setUser(
  "user123",
  "John Doe",
  "https://example.com/avatar.jpg",
  mapOf("city" to "New York")
)

// 3. Start chat
widget.initiateChat()
  .setRoomTitle("Customer Support")
  .setRoomSubtitle(RoomSubtitle.EDITABLE, "We're here to help")
  .setAvatar(Avatar.ENABLE)
  .setShowSystemMessage(true)
  .automaticSendMessage("Hello, I need help")
  .onCompleted(object : SessionCompleteListener {
    override fun onCompleted() {
      widget.registerDeviceToken(qiscusCore, fcmToken)
    }
  })
  .startChat(context)
```

---

## Error Handling

All async operations provide error callbacks:

```kotlin
widget.openChatRoomById(roomId,
  onSuccess = { chatRoom ->
    // Handle success
  },
  onError = { error ->
    when (error) {
      is NetworkException -> // Handle network error
      is AuthException -> // Handle auth error
      else -> // Handle other errors
    }
  }
)
```

---

## Best Practices

1. **Always check user setup** before starting chat
2. **Handle errors gracefully** with user-friendly messages
3. **Register device token** after successful chat initiation
4. **Clear user data** on logout
5. **Use configuration** for consistent theming
6. **Test notifications** on real devices
7. **Enable logging** during development only

---

## Migration Notes

When upgrading versions, check:
- Breaking changes in CHANGELOG
- Deprecated methods
- New configuration options
- Updated dependencies

---

## Support

- Documentation: [Link to docs]
- GitHub Issues: [Link to issues]
- Email: support@qiscus.com

---

**Last Updated:** Based on Android v2.4.2
