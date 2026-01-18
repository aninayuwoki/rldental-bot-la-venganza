#!/bin/bash

# Script de inicio para RLDental System
# Este script verifica dependencias e inicia el sistema

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🦷 SISTEMA RLDENTAL - INICIANDO                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js v16 o superior desde https://nodejs.org"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Se requiere Node.js v16 o superior"
    echo "Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"
echo ""

# Verificar si existen las dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Crear carpeta de datos si no existe
if [ ! -d "data" ]; then
    echo "📁 Creando carpeta de datos..."
    mkdir -p data
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🚀 INICIANDO SERVIDOR                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Iniciar el servidor
node server.js
