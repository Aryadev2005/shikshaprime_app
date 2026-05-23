# 💬 ShikshaPrime Chat System

A WhatsApp-style floating chat system for the ShikshaPrime College Management System. Built with **Node.js + TypeScript** backend and **React + TypeScript** frontend, following your existing architecture and branding.

![Chat System](https://img.shields.io/badge/Status-Ready%20for%20Integration-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)

## 🎯 Features

### ✅ **Role-Based Messaging**
- **Teachers**: Message other teachers, students, and send class broadcasts
- **Students**: Message teachers only (cannot message other students)
- **Admin**: Chat functionality disabled (as requested)

### ✅ **Chat Capabilities**
- Direct 1-on-1 messaging
- Class broadcast announcements  
- Real-time unread message counts
- Message read receipts
- WhatsApp-style floating interface
- Mobile-responsive design

### ✅ **Technical Features**
- RESTful API with rate limiting
- MySQL database with optimized queries
- Input validation and sanitization
- Error handling and logging
- Sequelize ORM integration
- Branded UI matching your theme

## 🏗️ Architecture

```
chat-system/
├── services/chat-service/          # Backend API Service
│   ├── src/
│   │   ├── models/                 # Database models
│   │   ├── controllers/            # Request handlers
│   │   ├── services/               # Business logic
│   │   ├── routes/                 # API routes
│   │   └── server.ts              # Express server
│   ├── migrations/                 # Database schema
│   └── package.json
└── college-management-system-frontend/
    └── src/components/chat/        # React components
        ├── FloatingChatWidget.tsx  # Main chat widget
        ├── ConversationList.tsx    # Chat list
        ├── MessageList.tsx         # Messages view
        └── ComposeMessage.tsx      # New message
```

## 🚀 Quick Start

### 1. **Automatic Setup (Recommended)**

```bash
# For Windows
setup-chat.bat

# For Linux/Mac
chmod +x setup-chat.sh
./setup-chat.sh
```

### 2. **Manual Setup**

#### Backend Setup:
```bash
# Install dependencies
cd services/chat-service
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migration
mysql -u your_username -p your_database_name < migrations/001_create_chat_tables.sql

# Start service
npm run dev
# Runs on http://localhost:5005
```

#### Frontend Integration:
```bash
# Add to .env.local
echo "NEXT_PUBLIC_CHAT_API_URL=http://localhost:5005/api/chat" >> .env.local
echo "NEXT_PUBLIC_CHAT_ENABLED=true" >> .env.local
```

Then integrate `FloatingChatWidget` in your layout (see [integration example](integration-example-guardWrapper.tsx)).

## 🎨 UI & Branding

The chat system uses your existing design tokens:

| Element | Color Variable | Value |
|---------|----------------|-------|
| Primary Gradient | `--bg-gradient` | `linear-gradient(90deg, #E89C05, #E95A43)` |
| Primary Color | `--primary` | `#E95A43` |
| Secondary Color | `--secondary` | `#0e2b51` |
| Text Color | `--text-dark` | `#01244E` |

## 📊 Database Schema

### Core Tables:
- **`conversations`** - Chat conversations metadata
- **`conversation_participants`** - Who's in each conversation  
- **`messages`** - All chat messages
- **`message_read_status`** - Read receipts tracking
- **`class_broadcast_recipients`** - Class broadcast delivery
- **`chat_settings`** - User preferences

### Relationships:
- Integrates with existing `college_users` and `students` tables
- Foreign key constraints ensure data integrity
- Optimized indexes for fast queries

## 🔧 API Reference

### **Messages**
```http
POST /api/chat/messages/direct
POST /api/chat/messages/class-broadcast  
GET  /api/chat/messages/unread-count
```

### **Conversations**
```http
GET /api/chat/conversations
GET /api/chat/conversations/:id/messages
PUT /api/chat/conversations/:id/read
```

### **Recipients**
```http
GET /api/chat/teachers
GET /api/chat/students/class/:classId
```

Full API documentation: `http://localhost:5005/api/chat/health`

## 🔒 Security & Permissions

### **Validation**
- Input sanitization with `express-validator`
- Message length limits (5000 chars)
- File size restrictions
- SQL injection prevention

### **Rate Limiting**
- 30 messages per minute per user
- 100 API requests per minute per IP
- Configurable limits

### **Access Control**
```javascript
// Teachers can message anyone
teacher -> teacher ✅
teacher -> student ✅  
teacher -> class   ✅

// Students can only message teachers
student -> teacher ✅
student -> student ❌
student -> class   ❌

// Admin chat disabled
admin -> * ❌
```

## 🧪 Testing

### **User Roles Testing**
1. **Teacher Account**: 
   - Send messages to other teachers
   - Send messages to students
   - Send class broadcasts

2. **Student Account**:
   - Send messages to teachers
   - Receive class broadcasts (read-only)
   - Cannot message other students

3. **Admin Account**:
   - Chat widget should not appear

### **API Testing**
```bash
# Test direct message
curl -X POST http://localhost:5005/api/chat/messages/direct \
  -H "Content-Type: application/json" \
  -d '{
    "senderUserId": 1,
    "senderUserType": "teacher", 
    "recipientUserId": 2,
    "recipientUserType": "student",
    "messageText": "Hello student!"
  }'
```

## 📱 Mobile Responsiveness

- **Desktop**: Full-featured chat window (350px × 500px)
- **Tablet**: Responsive scaling (320px × 480px)  
- **Mobile**: Optimized layout (300px × 450px)
- Touch-friendly interface with appropriate tap targets

## 🚀 Performance

### **Optimizations**
- Database query optimization with indexes
- Pagination for large conversation lists
- Lazy loading of message history
- Debounced search functionality
- Memory-efficient React components

### **Caching Strategy**
- Conversation list caching (30s TTL)
- Unread count polling (30s interval)
- Automatic refresh on window focus

## 🛠️ Development

### **Adding New Features**

#### New Message Types:
1. Update database enum in migration
2. Add type to `ChatService.ts` interfaces  
3. Update frontend rendering logic

#### New User Roles:
1. Update all database enums
2. Modify permission logic in `ChatService.canSendDirectMessage()`
3. Update frontend role checks

### **Customization**
- **Colors**: Modify CSS variables in `globals.css`
- **Layout**: Update component CSS files
- **API**: Extend controllers and services
- **Database**: Add migration scripts

## 📈 Scalability

### **Current Capacity**
- Supports thousands of concurrent users
- Optimized MySQL queries with proper indexing
- Connection pooling for database efficiency

### **Future Enhancements**
- **Real-time messaging**: Socket.IO integration ready
- **File attachments**: Database schema prepared
- **Message threading**: Parent-child relationships supported
- **Push notifications**: API endpoints ready
- **Message search**: Full-text search enabled

## 🐛 Troubleshooting

### **Common Issues**

#### Chat widget not appearing:
- ✅ Check `NEXT_PUBLIC_CHAT_ENABLED=true` 
- ✅ Verify user is logged in
- ✅ Ensure user role is not 'admin'
- ✅ Check browser console for errors

#### API connection errors:
- ✅ Verify chat service running on port 5005
- ✅ Check `NEXT_PUBLIC_CHAT_API_URL` variable
- ✅ Confirm CORS configuration

#### Database errors:
- ✅ Run migration script
- ✅ Verify database credentials
- ✅ Check if user tables exist

#### Permission denied:
- ✅ Verify user roles match expected values
- ✅ Check chat service logs for details

## 📝 License

This chat system is part of the ShikshaPrime College Management System.

---

## 🎉 Ready to Go!

Your chat system is now ready for integration. The floating widget will appear automatically for authenticated teachers and students, providing seamless communication across your college management platform.

**Need help?** Check the [integration guide](CHAT_INTEGRATION_GUIDE.md) or review the [example integration](integration-example-guardWrapper.tsx).

---

*Built with ❤️ for ShikshaPrime Education Platform*