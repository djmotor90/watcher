#!/bin/bash
# Development setup script

echo "Setting up Watcher development environment..."

# Install server dependencies
echo ""
echo "Installing server dependencies..."
cd server
npm install
cp .env.example .env
cd ..

# Install agent dependencies
echo ""
echo "Installing agent dependencies..."
cd agent
npm install
cp .env.example .env
cd ..

# Install dashboard dependencies
echo ""
echo "Installing dashboard dependencies..."
cd dashboard
npm install
cd ..

echo ""
echo "✓ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure server/.env with your PostgreSQL database URL"
echo "2. Configure agent/.env with server details and applications"
echo "3. Run migrations: cd server && npm run prisma:migrate"
echo ""
echo "Then in separate terminals:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd agent && npm run dev"
echo "  Terminal 3: cd dashboard && npm start"
