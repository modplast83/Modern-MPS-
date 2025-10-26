#!/bin/bash

# Fix imports for nested component directories
for dir in client/src/components/*/; do
  if [ -d "$dir" ] && [ "$(basename "$dir")" != "ui" ]; then
    echo "Fixing imports in $dir"
    find "$dir" -name "*.tsx" -o -name "*.ts" | while read file; do
      # Fix ui component imports (go up one level, then into ui)
      sed -i 's|from "@/components/ui/|from "../ui/|g' "$file"
      sed -i "s|from '@/components/ui/|from '../ui/|g" "$file"
      
      # Fix other component imports (go up one level, then into specific component dir)
      sed -i 's|from "@/components/\([^"]*\)"|from "../\1"|g' "$file"
      sed -i "s|from '@/components/\([^']*\)'|from '../\1'|g" "$file"
      
      # Fix lib imports (go up two levels, then into lib)
      sed -i 's|from "@/lib/|from "../../lib/|g' "$file"
      sed -i "s|from '@/lib/|from '../../lib/|g" "$file"
      
      # Fix hooks imports (go up two levels, then into hooks)
      sed -i 's|from "@/hooks/|from "../../hooks/|g' "$file"
      sed -i "s|from '@/hooks/|from '../../hooks/|g" "$file"
      
      # Fix shared imports (go up three levels, then into shared)
      sed -i 's|from "@shared/|from "../../../shared/|g' "$file"
      sed -i "s|from '@shared/|from '../../../shared/|g" "$file"
      
      # Fix assets imports
      sed -i 's|from "@assets/|from "../../../attached_assets/|g' "$file"
      sed -i "s|from '@assets/|from '../../../attached_assets/|g" "$file"
    done
  fi
done

echo "Nested import fixes completed!"
