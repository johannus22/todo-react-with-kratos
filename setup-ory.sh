#!/bin/bash

# Setup script for Ory Kratos with Docker

echo "🚀 Setting up Ory Kratos with Docker..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    echo "VITE_ORY_URL=http://localhost:4433" > .env
    echo "✅ Created .env file with VITE_ORY_URL=http://localhost:4433"
else
    echo "⚠️  .env file already exists. Make sure it contains:"
    echo "   VITE_ORY_URL=http://localhost:4433"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Docker Compose
echo "🐳 Starting Ory Kratos with Docker Compose..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "kratos.*Up"; then
    echo "✅ Ory Kratos is running!"
    echo ""
    echo "📍 Services:"
    echo "   - Public API: http://localhost:4433"
    echo "   - Admin API: http://localhost:4434"
    echo "   - Database: localhost:5432"
    echo ""
    echo "🧪 Test the setup:"
    echo "   curl http://localhost:4433/health/ready"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Make sure VITE_ORY_URL=http://localhost:4433 is in your .env file"
    echo "   2. Start your React app: npm run dev"
    echo "   3. Open http://localhost:5173 and try registering a user"
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
