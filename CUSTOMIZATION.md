# 🎨 Guía de Personalización - RLDental

## 📝 Personalizar Información del Negocio

### Cambiar el Teléfono de Contacto

**Archivo:** `bot/whatsapp-bot.js`

```javascript
// Línea ~19
const ADMIN_NUMBER = '593978719532';  // ← Tu número de administrador

// Línea ~22
let dentalData = {
  businessPhone: '593978719532',  // ← Número para que clientes te contacten
  ...
}
```

### Modificar Servicios Predeterminados

**Archivo:** `bot/whatsapp-bot.js` (línea ~23)

```javascript
services: [
  'Odontología General',
  'Diseño de Sonrisa',
  'Ortodoncia Invisible',
  'Implantes Dentales',
  // ← Agrega o elimina servicios aquí
],
```

### Configurar Horarios de Atención

**Archivo:** `bot/whatsapp-bot.js` (línea ~24)

```javascript
schedule: {
  'Lunes': { 
    open: '08:00', 
    close: '18:00', 
    slots: ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00']
  },
  // ← Modifica horarios para cada día
  'Martes': { ... },
  // Elimina días que no trabajes
}
```

**Formato de Slots:**
- Debe estar entre `open` y `close`
- Formato: `'HH:MM'` (24 horas)
- Ejemplo: `'09:30'`, `'14:15'`

## 🎨 Personalizar la Página Web

### Cambiar Colores

**Archivo:** `public/index.html` (línea ~22-30)

```javascript
colors: {
  dental: {
    50: '#f0f9ff',   // ← Fondo claro
    400: '#38bdf8',  // ← Acento
    500: '#0ea5e9',  // ← Color principal
    600: '#0284c7',  // ← Color hover
    900: '#0c4a6e',  // ← Color oscuro
  }
}
```

### Modificar Textos de la Web

**Título Principal** (línea ~199-206):
```html
<h1 class="...">
  Tu Sonrisa,<br>
  <span class="...">Nuestra Pasión</span>
</h1>
```

**Descripción** (línea ~207):
```html
<p class="...">
  Tu texto aquí
</p>
```

### Agregar/Quitar Secciones

La web tiene estas secciones principales:

1. **Hero** (línea ~199) - Banner principal
2. **Services** (línea ~241) - Servicios
3. **Schedule** (línea ~261) - Horarios
4. **Booking** (línea ~282) - Agendar cita
5. **Footer** (línea ~374) - Pie de página

Puedes comentar secciones completas si no las necesitas.

## 🔧 Configuración del Servidor

### Cambiar Puerto

**Opción 1 - Variable de entorno:**
```bash
PORT=8080 npm start
```

**Opción 2 - Editar código:**
```javascript
// server.js, línea ~11
const PORT = process.env.PORT || 3001; // ← Cambia 3001
```

### Habilitar HTTPS (Producción)

Instala certificados SSL y modifica `server.js`:

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private.key'),
  cert: fs.readFileSync('path/to/certificate.crt')
};

https.createServer(options, app).listen(PORT);
```

## 🤖 Personalizar Mensajes del Bot

**Archivo:** `bot/whatsapp-bot.js`

### Mensaje de Bienvenida (línea ~96)
```javascript
await sock.sendMessage(`${ADMIN_NUMBER}@s.whatsapp.net`, {
  text: '🎉 *Bot RLDental Iniciado*\n\n...'  // ← Personaliza aquí
});
```

### Menú de Comandos (línea ~151)
```javascript
text: `🦷 *PANEL DE ADMINISTRACIÓN - RLDental*\n\n...`
```

### Mensajes de Confirmación

Busca y modifica las respuestas en cada comando.

Ejemplo - Bloquear hora (línea ~239):
```javascript
text: `✅ *Hora bloqueada*\n\n...`  // ← Personaliza
```

## 📊 Agregar Nuevos Comandos

1. Abre `bot/whatsapp-bot.js`
2. Ve a la función `handleAdminCommand` (línea ~145)
3. Agrega tu comando antes del mensaje "no reconocido"

**Ejemplo - Comando "backup":**

```javascript
// Agregar después del último comando, antes de "comando no reconocido"
if (text === 'backup') {
  const backup = JSON.stringify(dentalData, null, 2);
  await sock.sendMessage(chatId, { 
    text: `📦 *BACKUP DEL SISTEMA*\n\n${backup}` 
  });
  return;
}
```

## 🎯 Agregar Nuevos Campos a las Citas

**Archivo:** `server.js` (línea ~57)

```javascript
app.post('/api/appointments', async (req, res) => {
  const { date, time, client, phone, email, notes } = req.body; // ← Agregar campos
  
  data.appointments[date].push({ 
    time, 
    client, 
    phone,
    email,    // ← Nuevo campo
    notes     // ← Nuevo campo
  });
  ...
});
```

Luego actualiza la web para enviar estos campos.

## 🌐 Cambiar URL de Producción

Cuando despliegues en un servidor:

**Archivo:** `public/index.html` (línea ~407)

```javascript
const API_URL = 'https://tu-dominio.com'; // ← Cambia a tu dominio
```

## 📱 Notificaciones Adicionales

Para recibir notificaciones en otro número además del tuyo:

```javascript
// bot/whatsapp-bot.js, después de línea ~522
await sock.sendMessage('593987654321@s.whatsapp.net', {
  text: `Nueva cita: ${client} - ${date} ${time}`
});
```

## 🔐 Seguridad Adicional

### Validar Origen de Peticiones

**Archivo:** `server.js` (después de línea ~13)

```javascript
app.use((req, res, next) => {
  const allowedOrigins = ['https://tu-dominio.com'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});
```

### Limitar Peticiones (Rate Limiting)

Instala:
```bash
npm install express-rate-limit
```

Agrega en `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 peticiones por IP
});

app.use('/api/', limiter);
```

## 💾 Backup Automático

Crea un script `backup.js`:

```javascript
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'dental-data.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

const timestamp = new Date().toISOString().replace(/:/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

fs.copyFileSync(DATA_FILE, backupFile);
console.log(`✅ Backup creado: ${backupFile}`);
```

Agrégalo en `package.json`:
```json
"scripts": {
  "backup": "node backup.js"
}
```

## 🎨 Temas Personalizados

Para cambiar completamente el diseño:

1. Modifica los colores en Tailwind (línea ~22)
2. Cambia las animaciones (línea ~32-48)
3. Personaliza los componentes glass (línea ~62-75)

---

**¿Necesitas más ayuda?** Revisa el código - está bien comentado! 🚀
