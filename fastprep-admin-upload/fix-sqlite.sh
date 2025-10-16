#!/bin/bash

# Quick fix for SQLite compatibility
echo "🔧 Fixing models for SQLite compatibility..."

# Replace UUID with STRING in all model files
find /Users/maratrubin/fastprep-admin-panel/backend/models -name "*.js" -not -name "sequelize.js" -not -name "index.js" -exec sed -i '' 's/DataTypes\.UUID/DataTypes.STRING/g' {} \;

# Replace ARRAY with TEXT for SQLite
find /Users/maratrubin/fastprep-admin-panel/backend/models -name "*.js" -not -name "sequelize.js" -not -name "index.js" -exec sed -i '' 's/DataTypes\.ARRAY(DataTypes\.STRING)/DataTypes.TEXT/g' {} \;

# Replace JSONB with TEXT for SQLite
find /Users/maratrubin/fastprep-admin-panel/backend/models -name "*.js" -not -name "sequelize.js" -not -name "index.js" -exec sed -i '' 's/DataTypes\.JSONB/DataTypes.TEXT/g' {} \;

# Replace DECIMAL with REAL for SQLite
find /Users/maratrubin/fastprep-admin-panel/backend/models -name "*.js" -not -name "sequelize.js" -not -name "index.js" -exec sed -i '' 's/DataTypes\.DECIMAL/DataTypes.REAL/g' {} \;

# Remove PostgreSQL specific defaults
find /Users/maratrubin/fastprep-admin-panel/backend/models -name "*.js" -not -name "sequelize.js" -not -name "index.js" -exec sed -i '' 's/DEFAULT ARRAY\[\]::VARCHAR(255)\[\]//g' {} \;

echo "✅ Models fixed for SQLite compatibility!"
