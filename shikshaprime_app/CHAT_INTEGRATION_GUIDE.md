# Chat System Integration Guide

## Quick Integration Steps

### 1. Install Chat Service Dependencies

```bash
cd services/chat-service
npm install
```

### 2. Setup Chat Service Database

```bash
# Run the database migration
mysql -u your_username -p your_database_name < migrations/001_create_chat_tables.sql
```

### 3. Configure Environment Variables

Create `.env` file in `services/chat-service/`:
```bash
# Copy from .env.example
cp .env.example .env

# Edit with your database credentials
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=college_management
CHAT_SERVICE_PORT=5005
```

### 4. Start Chat Service

```bash
cd services/chat-service
npm run dev
# Chat service will run on http://localhost:5005
```

### 5. Add Frontend Environment Variables

Add to `college-management-system-frontend/.env.local`:
```bash
NEXT_PUBLIC_CHAT_API_URL=http://localhost:5005/api/chat
NEXT_PUBLIC_CHAT_ENABLED=true
```

### 6. Integrate FloatingChatWidget

Update `src/components/global/guardWrapper.tsx`:

```tsx
"use client";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import Header from "./header";
import Sidebar from "./sidebar";
import { FooterPage } from "@/components/ui/FooterPage";
import { cn } from "@/src/lib/utils";
// ADD THIS IMPORT
import FloatingChatWidget from "@/src/components/chat/FloatingChatWidget";

// ... existing code ...

// Modify the DashboardLayout component:
const DashboardLayout = ({ children, role }: { children: ReactNode; role?: string }) => (
  <div className="min-h-screen bg-gray-50 font-sans">
    <Sidebar
      forcedRole={role}
      isMobileOpen={isMobileOpen}
      setIsMobileOpen={setIsMobileOpen}
      isCollapsed={isCollapsed}
    />

    <div className={cn(
      "flex flex-col transition-all duration-300 min-h-screen",
      isCollapsed ? "md:ml-20" : "md:ml-64"
    )}>
      <Header onMenuClick={handleMenuClick} />
      <main className="flex-1 p-2 md:p-4 overflow-x-hidden bg-[var(--color-background)]">
        {children}
        <FooterPage />
      </main>
    </div>

    {/* ADD FLOATING CHAT WIDGET HERE */}
    {user && process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true' && (
      <FloatingChatWidget currentUser={user} />
    )}
  </div>
);
```

### 7. Test the Integration

1. Start the chat service: `cd services/chat-service && npm run dev`
2. Start the frontend: `cd college-management-system-frontend && npm run dev`  
3. Login as a teacher or student
4. Look for the floating chat icon in the bottom-right corner

## Chat Permissions Summary

### Teachers Can:
- Send direct messages to other teachers
- Send direct messages to students  
- Send class broadcasts to all students in a class
- View all conversations and messages

### Students Can:
- Send direct messages to teachers only
- View messages from teachers
- Receive class broadcasts (read-only)
- **Cannot** message other students
- **Cannot** send class broadcasts

### Admin:
- Chat functionality is **disabled** for admin users (as requested)

## API Endpoints Available

### Messages
- `POST /api/chat/messages/direct` - Send direct message
- `POST /api/chat/messages/class-broadcast` - Send class broadcast
- `GET /api/chat/messages/unread-count` - Get unread count

### Conversations  
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversations/:id/messages` - Get messages in conversation
- `PUT /api/chat/conversations/:id/read` - Mark conversation as read

### Recipients
- `GET /api/chat/teachers` - Get available teachers
- `GET /api/chat/students/class/:classId` - Get students in class

## Customization

### Colors and Branding
The chat system uses your existing CSS variables:
- `--bg-gradient` - Primary gradient (orange to red)
- `--primary` - Primary color (#E95A43) 
- `--secondary` - Secondary color (#0e2b51)
- `--text-dark` - Dark text color

### Real-time Updates
Currently updates every 30 seconds. For real-time messaging, Socket.IO integration can be added.

### File Attachments
Database schema supports file attachments. Implementation can be added with multer middleware.

## Troubleshooting

### Chat widget not appearing:
- Check `NEXT_PUBLIC_CHAT_ENABLED=true` in .env.local
- Ensure user is logged in and role is not 'admin'
- Check browser console for errors

### API connection errors:
- Verify chat service is running on port 5005
- Check `NEXT_PUBLIC_CHAT_API_URL` environment variable
- Ensure CORS is configured correctly

### Database errors:
- Run migration script: `mysql ... < migrations/001_create_chat_tables.sql`
- Verify database credentials in chat service .env file
- Check if existing user tables (college_users, students) exist

### Permission denied errors:
- Verify user roles match the expected values ('teacher', 'student', etc.)
- Check chat service logs for detailed error messages

## Development

### Adding new message types:
1. Update database enum in migration
2. Add type to ChatService.ts interfaces
3. Update frontend message rendering

### Adding new user types:
1. Update database enums
2. Update permission logic in ChatService.canSendDirectMessage()
3. Update frontend user type checks

### Modifying UI:
- Colors: Update CSS variables in globals.css
- Layout: Modify FloatingChatWidget.css
- Components: Update individual component files in /components/chat/