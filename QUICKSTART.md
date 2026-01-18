# 🚀 Guía de Inicio Rápido - RLDental

## ⚡ 3 Pasos para Comenzar

### 1️⃣ Instalar
```bash
npm install
```

### 2️⃣ Configurar tu número
Abre `bot/whatsapp-bot.js` y cambia:
```javascript
const ADMIN_NUMBER = '593978719532';  // ← TU NÚMERO AQUÍ (sin + ni espacios)
```

### 3️⃣ Iniciar
```bash
npm start
```

## 📱 Primera Conexión

1. Verás un código QR en la terminal
2. Abre WhatsApp → **Dispositivos vinculados**
3. Toca **Vincular dispositivo**
4. Escanea el código QR
5. ¡Listo! El bot está conectado

## 💬 Probar el Bot

Escríbete a TI MISMO en WhatsApp:
```
menu
```

Verás todos los comandos disponibles.

## 🌐 Abrir la Web

Abre tu navegador en:
```
http://localhost:3001
```

## 🎯 Ejemplo de Uso

1. Escribe en WhatsApp: `bloquear dia 2026-01-20`
2. Abre la web y selecciona esa fecha
3. ¡Verás que no hay horarios disponibles!
4. Escribe: `desbloquear dia 2026-01-20`
5. Refresca la web y los horarios vuelven

## 📚 Más Información

Lee el `README.md` completo para:
- Lista completa de comandos
- Configuración avanzada
- Solución de problemas
- API endpoints

---

**¿Problemas?** Ejecuta `npm run clean` y luego `npm start`
