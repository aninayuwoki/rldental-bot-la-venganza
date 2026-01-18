// server.js - Servidor principal RLDental
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// Importar el bot de WhatsApp
const { initBot, getSocket, getDentalData } = require('./bot/whatsapp-bot');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// =====================================================
// RUTAS API - Conectadas con los datos del bot
// =====================================================

// Obtener configuración general
app.get('/api/config', (req, res) => {
  const data = getDentalData();
  res.json({
    businessPhone: data.businessPhone,
    services: data.services,
    schedule: data.schedule
  });
});

// Obtener disponibilidad de un día específico
app.get('/api/availability/:date', (req, res) => {
  const { date } = req.params;
  const data = getDentalData();
  
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const dayCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  
  const daySchedule = data.schedule[dayCap];
  if (!daySchedule) {
    return res.json({ availableSlots: [] });
  }
  
  const blockedTimes = data.blockedSlots[date] || [];
  const bookedTimes = (data.appointments[date] || []).map(a => a.time);
  
  const availableSlots = daySchedule.slots.filter(slot => 
    !blockedTimes.includes(slot) && !bookedTimes.includes(slot)
  );
  
  res.json({ availableSlots });
});

// Crear nueva cita
app.post('/api/appointments', async (req, res) => {
  const { date, time, client, phone } = req.body;
  const data = getDentalData();
  
  if (!data.appointments[date]) {
    data.appointments[date] = [];
  }
  
  const blockedTimes = data.blockedSlots[date] || [];
  const bookedTimes = data.appointments[date].map(a => a.time);
  
  if (blockedTimes.includes(time) || bookedTimes.includes(time)) {
    return res.status(400).json({ error: 'Horario no disponible' });
  }
  
  data.appointments[date].push({ time, client, phone });
  
  // Guardar cambios
  const { saveData, ADMIN_NUMBER } = require('./bot/whatsapp-bot');
  await saveData();
  
  // Notificar al admin por WhatsApp
  try {
    const sock = getSocket();
    if (sock) {
      await sock.sendMessage(`${ADMIN_NUMBER}@s.whatsapp.net`, {
        text: `🔔 *NUEVA CITA AGENDADA*\n\n` +
              `📅 Fecha: ${date}\n` +
              `🕐 Hora: ${time}\n` +
              `👤 Cliente: ${client}\n` +
              `📞 Teléfono: ${phone}`
      });
    }
  } catch (error) {
    console.error('Error notificando cita:', error);
  }
  
  res.json({ success: true });
});

// Ruta raíz - servir el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================
// INICIALIZACIÓN DEL SISTEMA COMPLETO
// =====================================================

async function startServer() {
  console.log('\n' + '='.repeat(70));
  console.log('🦷 SISTEMA RLDENTAL - INICIANDO');
  console.log('='.repeat(70) + '\n');
  
  // 1. Iniciar el bot de WhatsApp
  console.log('🤖 Paso 1: Iniciando bot de WhatsApp...\n');
  await initBot();
  
  // 2. Iniciar servidor web
  console.log('\n🌐 Paso 2: Iniciando servidor web...\n');
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('✅ SISTEMA COMPLETAMENTE OPERATIVO');
    console.log('='.repeat(70));
    console.log(`\n🌐 Sitio Web: http://localhost:${PORT}`);
    console.log(`📡 API REST: http://localhost:${PORT}/api`);
    console.log(`\n📋 Endpoints disponibles:`);
    console.log(`   GET  /api/config`);
    console.log(`   GET  /api/availability/:date`);
    console.log(`   POST /api/appointments`);
    console.log('\n' + '='.repeat(70));
    console.log('💬 El bot de WhatsApp está listo para recibir comandos');
    console.log('📱 Escríbete al número configurado para gestionar el sistema');
    console.log('='.repeat(70) + '\n');
  });
}

// Manejo de errores global
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando sistema RLDental...\n');
  process.exit(0);
});

// ¡Iniciar todo!
startServer();
