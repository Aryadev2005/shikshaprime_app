#!/bin/bash

# Chat System Setup Script
# Run this script from the project root directory

echo "🚀 Setting up ShikshaPrime Chat System..."
echo "=================================="

# Check if we're in the right directory
if [ ! -d "services" ] || [ ! -d "college-management-system-frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Expected structure: services/ and college-management-system-frontend/"
    exit 1
fi

# Step 1: Install Chat Service Dependencies
echo "📦 Installing chat service dependencies..."
cd services/chat-service
if [ ! -f "package.json" ]; then
    echo "❌ Error: Chat service package.json not found"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install chat service dependencies"
    exit 1
fi

echo "✅ Chat service dependencies installed"

# Step 2: Setup Environment Variables
echo "⚙️ Setting up environment variables..."

# Copy chat service environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
    echo "⚠️  Please edit services/chat-service/.env with your database credentials"
else
    echo "📝 .env file already exists"
fi

cd ../../

# Copy frontend environment variables
cd college-management-system-frontend
if [ ! -f ".env.local" ]; then
    echo "# Chat System Configuration" >> .env.local
    echo "NEXT_PUBLIC_CHAT_API_URL=http://localhost:5005/api/chat" >> .env.local
    echo "NEXT_PUBLIC_CHAT_ENABLED=true" >> .env.local
    echo "NEXT_PUBLIC_CHAT_REFRESH_INTERVAL=30000" >> .env.local
    echo "📝 Added chat configuration to .env.local"
else
    # Check if chat config already exists
    if ! grep -q "NEXT_PUBLIC_CHAT_API_URL" .env.local; then
        echo "" >> .env.local
        echo "# Chat System Configuration" >> .env.local
        echo "NEXT_PUBLIC_CHAT_API_URL=http://localhost:5005/api/chat" >> .env.local
        echo "NEXT_PUBLIC_CHAT_ENABLED=true" >> .env.local
        echo "NEXT_PUBLIC_CHAT_REFRESH_INTERVAL=30000" >> .env.local
        echo "📝 Added chat configuration to existing .env.local"
    else
        echo "📝 Chat configuration already exists in .env.local"
    fi
fi

cd ../

# Step 3: Database Setup Instructions
echo ""
echo "🗄️ Database Setup Required:"
echo "=================================="
echo "1. Make sure your MySQL database is running"
echo "2. Run the following command to create chat tables:"
echo "   mysql -u your_username -p your_database_name < services/chat-service/migrations/001_create_chat_tables.sql"
echo ""
echo "Replace 'your_username' and 'your_database_name' with your actual values"

# Step 4: Integration Instructions  
echo ""
echo "🔧 Integration Steps:"
echo "=================================="
echo "1. Edit services/chat-service/.env with your database credentials"
echo "2. Run the database migration command shown above"
echo "3. Add FloatingChatWidget to your layout (see integration-example-guardWrapper.tsx)"
echo "4. Start the chat service: cd services/chat-service && npm run dev"
echo "5. Start your frontend application as usual"

# Step 5: Testing Instructions
echo ""
echo "🧪 Testing the Chat System:"
echo "=================================="
echo "1. Login as a teacher account"
echo "2. Look for the floating chat icon in the bottom-right corner"
echo "3. Click to open and test messaging functionality"
echo "4. Login as a student account to test student-teacher messaging"

echo ""
echo "✅ Chat system setup complete!"
echo ""
echo "📚 Documentation:"
echo "- Full integration guide: CHAT_INTEGRATION_GUIDE.md"
echo "- Integration example: college-management-system-frontend/integration-example-guardWrapper.tsx"
echo "- API documentation available at: http://localhost:5005/api/chat/health"

echo ""
echo "🚨 Next Steps:"
echo "1. Configure database credentials"
echo "2. Run database migration"
echo "3. Integrate FloatingChatWidget component"
echo "4. Start services and test"

# Make the script executable
chmod +x setup-chat.sh