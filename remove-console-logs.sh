#!/bin/bash

# Remove all console.log, console.warn, console.error statements
# from TypeScript files for production build

echo "🧹 Removing console statements from TypeScript files..."

# Find all .ts files and remove console statements
find src/app -name "*.ts" -type f ! -name "*.spec.ts" | while read file; do
    # Remove console.log statements
    sed -i '' '/^[[:space:]]*console\.log(/d' "$file"
    # Remove console.warn statements  
    sed -i '' '/^[[:space:]]*console\.warn(/d' "$file"
    # Remove console.error statements
    sed -i '' '/^[[:space:]]*console\.error(/d' "$file"
    # Remove console.info statements
    sed -i '' '/^[[:space:]]*console\.info(/d' "$file"
    # Remove console.debug statements
    sed -i '' '/^[[:space:]]*console\.debug(/d' "$file"
done

echo "✅ Console statements removed!"
echo "📊 Files cleaned: $(find src/app -name "*.ts" -type f ! -name "*.spec.ts" | wc -l)"

