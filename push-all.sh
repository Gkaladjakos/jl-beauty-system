#!/bin/bash
# Script de vérification et push complet

echo "🔍 Vérification des fichiers modifiés..."
git status

echo ""
echo "📦 Ajout de TOUS les fichiers..."
git add -A

echo ""
echo "💾 Commit des modifications..."
git commit -m "Fix: Complete Supabase configuration with all corrections"

echo ""
echo "🚀 Push vers GitHub..."
git push

echo ""
echo "✅ Push terminé ! Attends 2-3 minutes puis teste."
echo "🔗 URL: https://gkaladjakos.github.io/jl-beauty-system/login.html"
echo "⚠️  N'oublie pas de faire Cmd+Shift+R pour vider le cache !"
