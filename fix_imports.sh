#!/bin/bash

# Fix @/ imports to relative paths based on file location
# For files in client/src/components/ui/ - fix imports to other ui components
find client/src/components/ui -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@/components/ui/|from "./|g' "$file"
  sed -i "s|from '@/components/ui/|from './|g" "$file"
  sed -i 's|from "@/lib/|from "../../lib/|g' "$file"
  sed -i "s|from '@/lib/|from '../../lib/|g" "$file"
  sed -i 's|from "@/hooks/|from "../../hooks/|g' "$file"
  sed -i "s|from '@/hooks/|from '../../hooks/|g" "$file"
done

# For files in client/src/components/ (but not ui subdirectory)
find client/src/components -maxdepth 1 -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@/components/ui/|from "./ui/|g' "$file"
  sed -i "s|from '@/components/ui/|from './ui/|g" "$file"
  sed -i 's|from "@/lib/|from "../lib/|g' "$file"
  sed -i "s|from '@/lib/|from '../lib/|g" "$file"
  sed -i 's|from "@/hooks/|from "../hooks/|g' "$file"
  sed -i "s|from '@/hooks/|from '../hooks/|g" "$file"
done

# For files in client/src/pages/
find client/src/pages -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@/components/ui/|from "../components/ui/|g' "$file"
  sed -i "s|from '@/components/ui/|from '../components/ui/|g" "$file"
  sed -i 's|from "@/components/|from "../components/|g' "$file"
  sed -i "s|from '@/components/|from '../components/|g" "$file"
  sed -i 's|from "@/lib/|from "../lib/|g' "$file"
  sed -i "s|from '@/lib/|from '../lib/|g" "$file"
  sed -i 's|from "@/hooks/|from "../hooks/|g' "$file"
  sed -i "s|from '@/hooks/|from '../hooks/|g" "$file"
done

# For files in client/src/hooks/
find client/src/hooks -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@/components/ui/|from "../components/ui/|g' "$file"
  sed -i "s|from '@/components/ui/|from '../components/ui/|g" "$file"
  sed -i 's|from "@/lib/|from "../lib/|g' "$file"
  sed -i "s|from '@/lib/|from '../lib/|g" "$file"
done

# For files in client/src/lib/
find client/src/lib -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@/components/ui/|from "../components/ui/|g' "$file"
  sed -i "s|from '@/components/ui/|from '../components/ui/|g" "$file"
  sed -i 's|from "@/hooks/|from "../hooks/|g' "$file"
  sed -i "s|from '@/hooks/|from '../hooks/|g" "$file"
done

# Fix @shared imports for all files
find client/src -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@shared/|from "../../shared/|g' "$file"
  sed -i "s|from '@shared/|from '../../shared/|g" "$file"
done

# Fix @assets imports for all files
find client/src -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's|from "@assets/|from "../../attached_assets/|g' "$file"
  sed -i "s|from '@assets/|from '../../attached_assets/|g" "$file"
done

echo "Import fixes completed!"
