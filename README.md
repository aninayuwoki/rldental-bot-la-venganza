# 🦷 Sistema RLDental - WhatsApp Bot + Web en Tiempo Real

Sistema completo de gestión dental que integra un bot de WhatsApp para administración y una página web para que los clientes agenden citas en tiempo real.

## 📁 Estructura del Proyecto

```
rldental-system/
├── server.js                 # Servidor principal (inicia todo automáticamente)
├── package.json              # Dependencias y scripts
├── bot/
│   └── whatsapp-bot.js      # Bot de WhatsApp con Baileys
├── public/
│   └── index.html           # Página web para clientes
└── data/
    ├── dental-data.json     # Base de datos (se crea automáticamente)
    └── auth_baileys/        # Sesión de WhatsApp (se crea automáticamente)
```

## 🚀 Instalación Rápida

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar tu número de WhatsApp

Edita el archivo `bot/whatsapp-bot.js` y cambia esta línea:

```javascript
const ADMIN_NUMBER = '593978719532';  // ← CAMBIA ESTO por tu número
```

**Formato:** Sin símbolos `+`, espacios ni guiones. Solo números.
- ✅ Correcto: `593978719532`
- ❌ Incorrecto: `+593 97 871 9532`

### 3. Iniciar el sistema

```bash
npm start
```

## 📱 Conectar WhatsApp (Primera vez)

1. Ejecuta `npm start`
2. Aparecerá un código QR en la terminal
3. Abre WhatsApp en tu teléfono
4. Ve a **Dispositivos vinculados** → **Vincular dispositivo**
5. Escanea el código QR
6. ¡Listo! El bot está conectado

## 💻 Acceder al Sistema

Una vez iniciado, tendrás acceso a:

- **🌐 Sitio Web:** http://localhost:3001
- **📡 API REST:** http://localhost:3001/api
- **💬 Bot WhatsApp:** Escríbete al número configurado

## 🤖 Comandos del Bot de WhatsApp

Escríbete a TI MISMO en WhatsApp con estos comandos:

### Menú Principal
```
menu
```

### Gestión de Horarios
```
ver horarios
bloquear 2026-01-20 09:00
desbloquear 2026-01-20 09:00
bloquear dia 2026-01-20
desbloquear dia 2026-01-20
```

### Gestión de Citas
```
ver citas
citas hoy
```

### Gestión de Servicios
```
ver servicios
agregar servicio Blanqueamiento Dental
eliminar servicio Blanqueamiento Dental
```

### Estado del Sistema
```
estado
```

## 🌐 Funcionalidades de la Web

Los clientes pueden:
- ✅ Ver horarios disponibles en tiempo real
- ✅ Seleccionar fecha y hora
- ✅ Confirmar cita por WhatsApp
- ✅ Ver servicios actualizados desde el bot

## 🔄 Sincronización en Tiempo Real

Todo lo que cambies desde WhatsApp se refleja **instantáneamente** en la web:

- Bloqueas un horario → Desaparece de la web
- Agregas un servicio → Aparece en la web
- Desbloqueas un día → Los horarios vuelven a estar disponibles

## 📊 API Endpoints

### GET /api/config
Obtiene la configuración general (servicios, horarios, teléfono)

### GET /api/availability/:date
Obtiene horarios disponibles para una fecha específica

Ejemplo: `/api/availability/2026-01-20`

### POST /api/appointments
Crea una nueva cita

Body:
```json
{
  "date": "2026-01-20",
  "time": "09:00",
  "client": "Juan Pérez",
  "phone": "593987654321"
}
```

## 🛠️ Scripts Disponibles

```bash
# Iniciar en producción
npm start

# Iniciar en desarrollo (auto-reinicia con cambios)
npm run dev

# Limpiar datos y sesión de WhatsApp
npm run clean
```

## ⚙️ Personalización

### Cambiar Puerto
Edita `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // ← Cambia el 3001
```

O usa variable de entorno:
```bash
PORT=8080 npm start
```

### Modificar Horarios
Edita `bot/whatsapp-bot.js` en la sección `dentalData.schedule`

### Cambiar Servicios
Usa los comandos del bot o edita directamente `data/dental-data.json`

## 🔒 Seguridad

- Solo el número configurado como `ADMIN_NUMBER` puede usar comandos
- La sesión de WhatsApp se guarda localmente
- Los datos se persisten en `data/dental-data.json`

## 🐛 Solución de Problemas

### El bot no responde
1. Verifica que tu número está correctamente configurado
2. Asegúrate de escribirte a TI MISMO
3. Revisa la consola para ver si hay errores

### No aparece el código QR
1. Cierra todas las instancias del bot
2. Ejecuta `npm run clean`
3. Ejecuta `npm start` nuevamente

### La web no carga
1. Verifica que el servidor esté corriendo
2. Asegúrate de acceder a http://localhost:3001
3. Revisa la consola del navegador (F12)

## 📝 Notas Importantes

- **Primera Conexión:** El código QR solo aparece la primera vez o después de limpiar la sesión
- **Persistencia:** Los datos se guardan automáticamente en `data/dental-data.json`
- **Múltiples Instancias:** No ejecutes el bot en múltiples terminales simultáneamente

## 🎯 Flujo de Trabajo Típico

1. **Inicio del día:** Ejecuta `npm start`
2. **Revisar citas:** Escribe `citas hoy` en WhatsApp
3. **Bloquear hora:** Si tienes una emergencia, usa `bloquear 2026-01-20 14:00`
4. **Agregar servicio:** Si ofreces algo nuevo, usa `agregar servicio [nombre]`
5. **Los clientes:** Entran a tu web, seleccionan hora, y te contactan por WhatsApp

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de tener Node.js v16 o superior

## 📄 Licencia

MIT - Libre para usar y modificar

---

**Desarrollado para RLDental - Reigosa León Dental** 🦷
