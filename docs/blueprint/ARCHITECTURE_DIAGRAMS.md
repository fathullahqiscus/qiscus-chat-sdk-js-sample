# Qiscus Multichannel Widget - Architecture Diagrams

## Visual Architecture Reference

This document provides visual representations of the widget architecture.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Qiscus Multichannel Widget SDK                      │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Widget     │  │    Config    │  │    Color     │     │ │
│  │  │   Instance   │  │   Manager    │  │   Theme      │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │         │                  │                  │             │ │
│  │         └──────────────────┴──────────────────┘             │ │
│  │                            │                                 │ │
│  │         ┌──────────────────┴──────────────────┐             │ │
│  │         │                                      │             │ │
│  │    ┌────▼────┐                           ┌────▼────┐        │ │
│  │    │ Session │                           │  Chat   │        │ │
│  │    │ Manager │                           │ Builder │        │ │
│  │    └────┬────┘                           └────┬────┘        │ │
│  │         │                                      │             │ │
│  │    ┌────▼──────────────────────────────────────▼────┐       │ │
│  │    │            Service Layer                        │       │ │
│  │    │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │       │ │
│  │    │  │  Auth    │  │  Chat    │  │  Media   │     │       │ │
│  │    │  │ Service  │  │ Service  │  │ Service  │     │       │ │
│  │    │  └──────────┘  └──────────┘  └──────────┘     │       │ │
│  │    └─────────────────────┬───────────────────────────┘       │ │
│  │                          │                                    │ │
│  │    ┌─────────────────────┴───────────────────────┐           │ │
│  │    │                                              │           │ │
│  │  ┌─▼──────────┐  ┌──────────────┐  ┌───────────▼─┐         │ │
│  │  │    Data    │  │   Network    │  │     UI      │         │ │
│  │  │   Layer    │  │    Layer     │  │   Layer     │         │ │
│  │  └────────────┘  └──────────────┘  └─────────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Qiscus Backend Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     API      │  │   WebSocket  │  │    Media     │          │
│  │   Gateway    │  │    Server    │  │   Storage    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

```
QiscusMultichannelWidget (Singleton)
│
├── Configuration
│   ├── QiscusMultichannelWidgetConfig
│   │   ├── Notification Settings
│   │   ├── Logging Settings
│   │   ├── Room Display Settings
│   │   ├── UI Feature Flags
│   │   └── Session Settings
│   │
│   └── QiscusMultichannelWidgetColor
│       ├── Navigation Colors
│       ├── Bubble Colors
│       ├── Input Colors
│       ├── System Colors
│       └── Empty State Colors
│
├── Core Services
│   ├── SessionManager
│   │   ├── Authentication
│   │   ├── Session Persistence
│   │   └── Token Management
│   │
│   ├── NotificationService
│   │   ├── Token Registration
│   │   ├── Message Handling
│   │   └── Deep Linking
│   │
│   └── MediaService
│       ├── Image Processing
│       ├── File Upload
│       ├── Audio Recording
│       └── Video Handling
│
├── Data Layer
│   ├── Models
│   │   ├── User
│   │   ├── Message
│   │   ├── ChatRoom
│   │   └── UserProperties
│   │
│   ├── Repository
│   │   ├── ChatRepository
│   │   └── MediaRepository
│   │
│   └── Storage
│       ├── LocalStorage (User, Room, Config)
│       └── SessionStorage (Session, Auth)
│
├── Network Layer
│   ├── ApiClient
│   ├── ApiService
│   ├── Interceptors
│   │   ├── AuthInterceptor
│   │   └── LoggingInterceptor
│   └── WebSocket
│
└── UI Layer
    ├── ChatRoomActivity/View
    │   ├── Toolbar
    │   ├── MessageList
    │   └── InputField
    │
    ├── Adapters
    │   ├── MessageAdapter
    │   └── CarouselAdapter
    │
    └── ViewHolders
        ├── LeftMessageViewHolder
        ├── RightMessageViewHolder
        ├── SystemMessageViewHolder
        └── MediaMessageViewHolder
```

---

## 3. Data Flow Diagram

### Chat Initialization Flow

```
User Action
    │
    ▼
┌─────────────────┐
│ initiateChat()  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  ChatRoomBuilder    │
│  - setRoomTitle()   │
│  - setAvatar()      │
│  - startChat()      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Validate User      │
│  - hasSetupUser()   │
│  - userCheck()      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  SessionManager     │
│  - initiateChat()   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  ChatRepository     │
│  - POST /initiate   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  API Response       │
│  - customer_room    │
│  - identity_token   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Save Session       │
│  - LocalStorage     │
│  - SessionStorage   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Load ChatRoom      │
│  - goToChatroom()   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Open UI            │
│  - ChatRoomView     │
└─────────────────────┘
```

---

### Message Sending Flow

```
User Types Message
    │
    ▼
┌─────────────────┐
│  Input Field    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Click Send     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Create Message     │
│  - generateMessage()│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Save to Local DB   │
│  - status: SENDING  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Update UI          │
│  - Add to list      │
│  - Show sending     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Send to Server     │
│  - POST /message    │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
Success    Failure
    │         │
    ▼         ▼
┌───────┐  ┌────────┐
│ SENT  │  │ FAILED │
└───┬───┘  └───┬────┘
    │          │
    ▼          ▼
┌─────────────────────┐
│  Update Local DB    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Update UI          │
│  - Show status      │
└─────────────────────┘
```

---

### Message Receiving Flow

```
Server Push (WebSocket/FCM)
    │
    ▼
┌─────────────────────┐
│  Receive Message    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Parse Payload      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Validate Message   │
│  - Check app_code   │
│  - Check room_id    │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
  Valid    Invalid
    │         │
    ▼         ▼
┌───────┐  ┌────────┐
│Process│  │ Ignore │
└───┬───┘  └────────┘
    │
    ▼
┌─────────────────────┐
│  Save to Local DB   │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
App Open  App Closed
    │         │
    ▼         ▼
┌───────┐  ┌──────────┐
│Update │  │  Show    │
│  UI   │  │  Notif   │
└───────┘  └──────────┘
```

---

## 4. State Diagram

### User Session States

```
┌─────────────────┐
│  NOT_INITIALIZED│
└────────┬────────┘
         │ setup()
         ▼
┌─────────────────┐
│   INITIALIZED   │
└────────┬────────┘
         │ setUser()
         ▼
┌─────────────────┐
│    USER_SET     │
└────────┬────────┘
         │ initiateChat()
         ▼
┌─────────────────┐
│ AUTHENTICATING  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Success    Failure
    │         │
    ▼         ▼
┌───────┐  ┌──────────┐
│ACTIVE │  │USER_SET  │
│SESSION│  │(retry)   │
└───┬───┘  └──────────┘
    │
    │ clearUser()
    ▼
┌─────────────────┐
│   INITIALIZED   │
└─────────────────┘
```

---

### Message States

```
┌─────────────┐
│  COMPOSING  │
└──────┬──────┘
       │ send()
       ▼
┌─────────────┐
│   SENDING   │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
Success  Failure
  │         │
  ▼         ▼
┌────┐   ┌────────┐
│SENT│   │ FAILED │
└─┬──┘   └───┬────┘
  │          │ retry()
  │          └────────┐
  │                   │
  │ delivered         ▼
  ▼              ┌─────────┐
┌──────────┐    │ SENDING │
│DELIVERED │    └─────────┘
└────┬─────┘
     │ read
     ▼
┌─────────┐
│  READ   │
└─────────┘
```

---

## 5. Sequence Diagrams

### Complete Chat Flow

```
User    Widget    Builder    Session    Repository    API    Storage    UI
 │        │         │          │            │          │       │        │
 │ setup()│         │          │            │          │       │        │
 ├───────>│         │          │            │          │       │        │
 │        │ init    │          │            │          │       │        │
 │        ├────────────────────────────────────────────>│      │        │
 │        │         │          │            │          │       │        │
 │setUser()│        │          │            │          │       │        │
 ├───────>│         │          │            │          │       │        │
 │        │ save    │          │            │          │       │        │
 │        ├────────────────────────────────────────────>│      │        │
 │        │         │          │            │          │       │        │
 │initiateChat()    │          │            │          │       │        │
 ├───────>│         │          │            │          │       │        │
 │        │ create  │          │            │          │       │        │
 │        ├────────>│          │            │          │       │        │
 │        │         │          │            │          │       │        │
 │        │ configure│         │            │          │       │        │
 │        │<────────┤          │            │          │       │        │
 │        │         │          │            │          │       │        │
 │        │    startChat()     │            │          │       │        │
 │        │         ├─────────>│            │          │       │        │
 │        │         │          │ initiate   │          │       │        │
 │        │         │          ├───────────>│          │       │        │
 │        │         │          │            │ POST     │       │        │
 │        │         │          │            ├─────────>│       │        │
 │        │         │          │            │          │       │        │
 │        │         │          │            │ response │       │        │
 │        │         │          │            │<─────────┤       │        │
 │        │         │          │            │          │       │        │
 │        │         │          │ save session          │       │        │
 │        │         │          ├──────────────────────>│       │        │
 │        │         │          │                       │       │        │
 │        │         │          │ getChatRoom           │       │        │
 │        │         │          ├───────────>│          │       │        │
 │        │         │          │            │ GET      │       │        │
 │        │         │          │            ├─────────>│       │        │
 │        │         │          │            │          │       │        │
 │        │         │          │            │ response │       │        │
 │        │         │          │            │<─────────┤       │        │
 │        │         │          │            │          │       │        │
 │        │         │          │ openUI                │       │        │
 │        │         │          ├──────────────────────────────>│        │
 │        │         │          │                       │       │        │
 │        │         │          │                       │       │ render │
 │        │         │          │                       │       │<───────┤
 │        │         │          │                       │       │        │
 │<───────────────────────────────────────────────────────────────────┤
 │                                                                      │
 │                         Chat UI Displayed                            │
```

---

## 6. Class Diagram

```
┌─────────────────────────────────┐
│  QiscusMultichannelWidget       │
├─────────────────────────────────┤
│ - instance: Widget (static)     │
│ - config: Config                │
│ - color: Color                  │
│ - sessionManager: SessionManager│
│ - chatRoomBuilder: Builder      │
│ - user: User                    │
├─────────────────────────────────┤
│ + setup(): Widget (static)      │
│ + getInstance(): Widget (static)│
│ + setUser()                     │
│ + isLoggedIn(): Boolean         │
│ + clearUser()                   │
│ + initiateChat(): Builder       │
│ + openChatRoom()                │
│ + registerDeviceToken()         │
└─────────────────────────────────┘
            │
            │ has
            ▼
┌─────────────────────────────────┐
│  QiscusChatRoomBuilder          │
├─────────────────────────────────┤
│ - widget: Widget                │
│ - sessionManager: SessionManager│
│ - roomTitle: String             │
│ - roomSubtitle: String          │
│ - qMessage: Message             │
├─────────────────────────────────┤
│ + setRoomTitle(): Builder       │
│ + setRoomSubtitle(): Builder    │
│ + setAvatar(): Builder          │
│ + automaticSendMessage(): Builder│
│ + onCompleted(): Builder        │
│ + startChat()                   │
└─────────────────────────────────┘
            │
            │ uses
            ▼
┌─────────────────────────────────┐
│  SessionManager                 │
├─────────────────────────────────┤
│ - repository: ChatRepository    │
│ - completeListener: Listener    │
├─────────────────────────────────┤
│ + initiateChat()                │
│ + goToChatroom()                │
│ + setCompleteListener()         │
└─────────────────────────────────┘
            │
            │ uses
            ▼
┌─────────────────────────────────┐
│  ChatRepository                 │
├─────────────────────────────────┤
│ - apiService: ApiService        │
│ - localStorage: LocalStorage    │
├─────────────────────────────────┤
│ + initiateChat()                │
│ + getChatRoom()                 │
└─────────────────────────────────┘
```

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile/Web Application                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Qiscus Multichannel Widget SDK                  │ │
│  │              (Embedded Library)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            │ HTTPS/WSS                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
└────────────────────────────┬─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  API Server  │    │  API Server  │    │  API Server  │
│   Instance   │    │   Instance   │    │   Instance   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Database   │  │   WebSocket  │  │    Media     │
│   (Primary)  │  │    Server    │  │   Storage    │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐
│   Database   │
│  (Replica)   │
└──────────────┘
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Widget SDK                              │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Secure Storage (Encrypted)                      │  │ │
│  │  │  - User credentials                               │  │ │
│  │  │  - Session tokens                                 │  │ │
│  │  │  - API keys                                       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Network Layer                                    │  │ │
│  │  │  - TLS 1.2+ encryption                            │  │ │
│  │  │  - Certificate pinning                            │  │ │
│  │  │  - Request signing                                │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS (TLS 1.2+)
                             │ JWT Token
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Security Middleware                                    │ │
│  │  - Rate limiting                                        │ │
│  │  - DDoS protection                                      │ │
│  │  - Input validation                                     │ │
│  │  - JWT verification                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Services                            │
│  - Encrypted data at rest                                    │
│  - Audit logging                                             │
│  - Access control (RBAC)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Module Dependencies

```
┌─────────────────────┐
│   Application       │
│   (Client Code)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Widget SDK        │
│   (Public API)      │
└──────────┬──────────┘
           │
     ┌─────┴─────┬─────────────┬──────────┐
     │           │             │          │
     ▼           ▼             ▼          ▼
┌────────┐  ┌────────┐  ┌─────────┐  ┌──────┐
│  Core  │  │   UI   │  │ Service │  │ Data │
│ Module │  │ Module │  │  Module │  │Module│
└────┬───┘  └───┬────┘  └────┬────┘  └───┬──┘
     │          │             │           │
     └──────────┴─────────────┴───────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  Network Module  │
           └──────────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  Platform APIs   │
           │  - HTTP Client   │
           │  - Storage       │
           │  - Notifications │
           └──────────────────┘
```

---

**End of Architecture Diagrams**
