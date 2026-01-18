// bot/whatsapp-bot.js - Bot de WhatsApp modularizado
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');

// ⚠️ IMPORTANTE: Configura tu número de WhatsApp aquí
// Ejemplo: si tu número es +593 97 871 9532, pon: 593978719532
const ADMIN_NUMBER = '593978719532';

const DATA_FILE = path.join(__dirname, '..', 'data', 'dental-data.json');

// Datos del sistema (compartidos con el servidor)
let dentalData = {
  businessPhone: '593978719532',
  services: ['Odontología General', 'Diseño de Sonrisa', 'Ortodoncia Invisible', 'Implantes Dentales'],
  schedule: {
    'Lunes': { open: '08:00', close: '18:00', slots: ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00'] },
    'Martes': { open: '08:00', close: '18:00', slots: ['08:00', '10:00', '12:00', '14:00', '16:00'] },
    'Miércoles': { open: '08:00', close: '18:00', slots: ['09:00', '11:00', '13:00', '15:00'] },
    'Jueves': { open: '08:00', close: '18:00', slots: ['08:00', '10:00', '12:00', '14:00', '16:00'] },
    'Viernes': { open: '08:00', close: '18:00', slots: ['08:00', '10:00', '12:00', '14:00', '16:00'] },
    'Sábado': { open: '08:00', close: '14:00', slots: ['08:00', '10:00', '12:00'] }
  },
  blockedSlots: {},
  appointments: {}
};

let sock; // Socket de WhatsApp

// =====================================================
// FUNCIONES DE DATOS
// =====================================================

async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    dentalData = JSON.parse(data);
    console.log('✅ Datos cargados desde archivo');
  } catch (error) {
    console.log('📝 Creando archivo de datos inicial...');
    await saveData();
  }
}

async function saveData() {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(dentalData, null, 2));
    console.log('💾 Datos guardados correctamente');
  } catch (error) {
    console.error('❌ Error guardando datos:', error);
  }
}

// =====================================================
// CONEXIÓN A WHATSAPP
// =====================================================

async function connectToWhatsApp() {
  const authPath = path.join(__dirname, '..', 'data', 'auth_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  
  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['RLDental Admin', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n' + '='.repeat(70));
      console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP:');
      console.log('='.repeat(70) + '\n');
      qrcode.generate(qr, { small: true });
      console.log('\n📱 Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo\n');
      console.log('='.repeat(70) + '\n');
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexión cerrada. Reconectando...', shouldReconnect);
      if (shouldReconnect) {
        await delay(3000);
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('\n' + '='.repeat(70));
      console.log('✅ BOT DE WHATSAPP CONECTADO EXITOSAMENTE!');
      console.log('='.repeat(70));
      console.log('📱 Número administrador:', ADMIN_NUMBER);
      console.log('💬 Escríbete a TI MISMO para gestionar tu sistema');
      console.log('📋 Escribe "menu" para ver todos los comandos');
      console.log('='.repeat(70) + '\n');
      
      // Mensaje de bienvenida
      try {
        await sock.sendMessage(`${ADMIN_NUMBER}@s.whatsapp.net`, {
          text: '🎉 *Bot RLDental Iniciado*\n\n✅ Sistema operativo\n💻 Listo para recibir comandos\n\nEscribe *menu* para comenzar'
        });
      } catch (error) {
        console.log('⚠️  No se pudo enviar mensaje de bienvenida (normal si es primera vez)');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    const msg = messages[0];
    if (!msg.message) return;
    
    const from = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;
    
    const text = msg.message.conversation 
      || msg.message.extendedTextMessage?.text 
      || '';
    
    if (!text) return;
    
    const phoneNumber = from.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    console.log('\n' + '█'.repeat(70));
    console.log('📨 NUEVO MENSAJE');
    console.log('█'.repeat(70));
    console.log('De:', phoneNumber);
    console.log('Enviado por mí?', isFromMe ? 'SÍ ✅' : 'NO ❌');
    console.log('Texto:', text);
    console.log('█'.repeat(70) + '\n');
    
    const isAdmin = phoneNumber.includes(ADMIN_NUMBER) || isFromMe;
    
    if (!isAdmin) {
      console.log('⚠️  Este número NO es administrador. Ignorado.\n');
      return;
    }
    
    console.log('✅ Mensaje de ADMIN detectado. Procesando...\n');
    await handleAdminCommand(from, text.toLowerCase().trim(), msg);
  });
}

// =====================================================
// MANEJO DE COMANDOS
// =====================================================

async function handleAdminCommand(chatId, text, originalMsg) {
  try {
    console.log('🎯 Ejecutando comando:', text);
    
    // MENU
    if (text === 'menu' || text === 'ayuda' || text === 'comandos') {
      await sock.sendMessage(chatId, {
        text: `🦷 *PANEL DE ADMINISTRACIÓN - RLDental*\n\n` +
              `📋 *COMANDOS DISPONIBLES:*\n\n` +
              `*HORARIOS:*\n` +
              `• ver horarios\n` +
              `• bloquear 2026-01-20 09:00\n` +
              `• desbloquear 2026-01-20 09:00\n` +
              `• bloquear dia 2026-01-20\n` +
              `• desbloquear dia 2026-01-20\n\n` +
              `*CITAS:*\n` +
              `• ver citas\n` +
              `• citas hoy\n\n` +
              `*SERVICIOS:*\n` +
              `• ver servicios\n` +
              `• agregar servicio [nombre]\n` +
              `• eliminar servicio [nombre]\n\n` +
              `*SISTEMA:*\n` +
              `• estado\n\n` +
              `_Todo se actualiza en la web en tiempo real_ 🌐`
      });
      console.log('✅ Menú enviado\n');
      return;
    }
    
    // ESTADO
    if (text === 'estado') {
      const totalApps = Object.values(dentalData.appointments).flat().length;
      const totalBlocked = Object.values(dentalData.blockedSlots).flat().length;
      
      await sock.sendMessage(chatId, {
        text: `📊 *ESTADO DEL SISTEMA*\n\n` +
              `✅ Sistema: *Operativo*\n` +
              `📅 Citas totales: *${totalApps}*\n` +
              `🚫 Horarios bloqueados: *${totalBlocked}*\n` +
              `💼 Servicios activos: *${dentalData.services.length}*\n` +
              `🌐 Web: *Sincronizada*\n\n` +
              `_Última actualización: ${new Date().toLocaleString('es-ES')}_`
      });
      console.log('✅ Estado enviado\n');
      return;
    }
    
    // VER HORARIOS
    if (text === 'ver horarios') {
      let response = '📅 *CONFIGURACIÓN DE HORARIOS*\n\n';
      Object.entries(dentalData.schedule).forEach(([day, hours]) => {
        response += `*${day}:* ${hours.open} - ${hours.close}\n`;
        response += `_Slots: ${hours.slots.join(', ')}_\n\n`;
      });
      await sock.sendMessage(chatId, { text: response });
      console.log('✅ Horarios enviados\n');
      return;
    }
    
    // VER SERVICIOS
    if (text === 'ver servicios') {
      let response = '💼 *SERVICIOS ACTIVOS*\n\n';
      dentalData.services.forEach((s, i) => {
        response += `${i + 1}. ${s}\n`;
      });
      response += `\n_Total: ${dentalData.services.length} servicios_`;
      await sock.sendMessage(chatId, { text: response });
      console.log('✅ Servicios enviados\n');
      return;
    }
    
    // BLOQUEAR HORA ESPECÍFICA
    if (text.startsWith('bloquear ') && !text.includes('dia')) {
      const parts = text.split(' ');
      if (parts.length < 3) {
        await sock.sendMessage(chatId, { 
          text: '❌ Formato incorrecto\n\nUsa: *bloquear 2026-01-20 09:00*' 
        });
        return;
      }
      
      const date = parts[1];
      const time = parts[2];
      
      if (!dentalData.blockedSlots[date]) {
        dentalData.blockedSlots[date] = [];
      }
      
      if (!dentalData.blockedSlots[date].includes(time)) {
        dentalData.blockedSlots[date].push(time);
        await saveData();
        
        await sock.sendMessage(chatId, {
          text: `✅ *Hora bloqueada*\n\n📅 ${date} a las ${time}\n\n🌐 _Los usuarios ya no verán este horario en la web_`
        });
        console.log('✅ Hora bloqueada:', date, time, '\n');
      } else {
        await sock.sendMessage(chatId, { text: `⚠️ Esa hora ya estaba bloqueada` });
      }
      return;
    }
    
    // BLOQUEAR DÍA COMPLETO
    if (text.startsWith('bloquear dia ')) {
      const date = text.split(' ')[2];
      
      if (!date) {
        await sock.sendMessage(chatId, { 
          text: '❌ Formato incorrecto\n\nUsa: *bloquear dia 2026-01-20*' 
        });
        return;
      }
      
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      const dayCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      
      const daySchedule = dentalData.schedule[dayCap];
      if (!daySchedule) {
        await sock.sendMessage(chatId, { 
          text: `⚠️ No hay horarios configurados para ${dayCap}` 
        });
        return;
      }
      
      dentalData.blockedSlots[date] = [...daySchedule.slots];
      await saveData();
      
      await sock.sendMessage(chatId, {
        text: `✅ *Día completo bloqueado*\n\n📅 ${date} (${dayCap})\n🚫 ${daySchedule.slots.length} horarios bloqueados\n\n🌐 _Actualizado en la web_`
      });
      console.log('✅ Día completo bloqueado:', date, '\n');
      return;
    }
    
    // DESBLOQUEAR DÍA COMPLETO
    if (text.startsWith('desbloquear dia ')) {
      const date = text.split(' ')[2];
      
      if (dentalData.blockedSlots[date]) {
        delete dentalData.blockedSlots[date];
        await saveData();
        
        await sock.sendMessage(chatId, {
          text: `✅ *Día desbloqueado*\n\n📅 ${date}\n\n🌐 _Todos los horarios disponibles nuevamente_`
        });
        console.log('✅ Día desbloqueado:', date, '\n');
      } else {
        await sock.sendMessage(chatId, { 
          text: `⚠️ Ese día no estaba bloqueado` 
        });
      }
      return;
    }
    
    // DESBLOQUEAR HORA ESPECÍFICA
    if (text.startsWith('desbloquear ') && !text.includes('dia')) {
      const parts = text.split(' ');
      if (parts.length < 3) {
        await sock.sendMessage(chatId, { 
          text: '❌ Formato incorrecto\n\nUsa: *desbloquear 2026-01-20 09:00*' 
        });
        return;
      }
      
      const date = parts[1];
      const time = parts[2];
      
      if (dentalData.blockedSlots[date]) {
        const existiaBloqueado = dentalData.blockedSlots[date].includes(time);
        dentalData.blockedSlots[date] = dentalData.blockedSlots[date].filter(t => t !== time);
        
        if (dentalData.blockedSlots[date].length === 0) {
          delete dentalData.blockedSlots[date];
        }
        await saveData();
        
        if (existiaBloqueado) {
          await sock.sendMessage(chatId, { 
            text: `✅ *Desbloqueado*\n\n📅 ${date} a las ${time}\n\n🌐 _Cambio aplicado en la web_` 
          });
          console.log('✅ Hora desbloqueada:', date, time, '\n');
        } else {
          await sock.sendMessage(chatId, { 
            text: `⚠️ Esa hora específica (${time}) no estaba bloqueada` 
          });
        }
      } else {
        await sock.sendMessage(chatId, { 
          text: `⚠️ No había bloqueos para esa fecha (${date})` 
        });
      }
      return;
    }
    
    // VER CITAS
    if (text === 'ver citas') {
      if (Object.keys(dentalData.appointments).length === 0) {
        await sock.sendMessage(chatId, { text: '📅 No hay citas agendadas aún' });
        return;
      }
      
      let response = '📅 *CITAS AGENDADAS*\n\n';
      Object.entries(dentalData.appointments).forEach(([date, apps]) => {
        response += `*${date}:*\n`;
        apps.forEach(app => {
          response += `• ${app.time} - ${app.client} (${app.phone})\n`;
        });
        response += '\n';
      });
      await sock.sendMessage(chatId, { text: response });
      console.log('✅ Lista de citas enviada\n');
      return;
    }
    
    // CITAS HOY
    if (text === 'citas hoy') {
      const today = new Date().toISOString().split('T')[0];
      const todayApps = dentalData.appointments[today] || [];
      
      if (todayApps.length === 0) {
        await sock.sendMessage(chatId, { 
          text: `📅 No hay citas para hoy (${today})` 
        });
        return;
      }
      
      let response = `📅 *CITAS DE HOY*\n_${today}_\n\n`;
      todayApps.forEach(app => {
        response += `🕐 *${app.time}*\n`;
        response += `👤 ${app.client}\n`;
        response += `📞 ${app.phone}\n\n`;
      });
      await sock.sendMessage(chatId, { text: response });
      console.log('✅ Citas de hoy enviadas\n');
      return;
    }
    
    // AGREGAR SERVICIO
    if (text.startsWith('agregar servicio ')) {
      const service = text.substring(17).trim();
      
      if (!service) {
        await sock.sendMessage(chatId, { 
          text: '❌ Debes especificar el nombre del servicio\n\nEjemplo: *agregar servicio Blanqueamiento Dental*' 
        });
        return;
      }
      
      if (!dentalData.services.includes(service)) {
        dentalData.services.push(service);
        await saveData();
        await sock.sendMessage(chatId, { 
          text: `✅ *Servicio agregado*\n\n💼 "${service}"\n\n🌐 _Ya está visible en tu web_` 
        });
        console.log('✅ Servicio agregado:', service, '\n');
      } else {
        await sock.sendMessage(chatId, { text: `⚠️ Ese servicio ya existe` });
      }
      return;
    }
    
    // ELIMINAR SERVICIO
    if (text.startsWith('eliminar servicio ')) {
      const service = text.substring(18).trim();
      const index = dentalData.services.indexOf(service);
      
      if (index > -1) {
        dentalData.services.splice(index, 1);
        await saveData();
        await sock.sendMessage(chatId, { 
          text: `✅ *Servicio eliminado*\n\n❌ "${service}"\n\n🌐 _Actualizado en la web_` 
        });
        console.log('✅ Servicio eliminado:', service, '\n');
      } else {
        await sock.sendMessage(chatId, { 
          text: `⚠️ Servicio no encontrado\n\nEscribe *ver servicios* para ver la lista actual` 
        });
      }
      return;
    }
    
    // TEST
    if (text === 'test' || text === 'hola' || text === 'prueba') {
      await sock.sendMessage(chatId, { 
        text: '🎉 *¡Bot funcionando perfectamente!*\n\nEscribe *menu* para ver todos los comandos disponibles.' 
      });
      console.log('✅ Test respondido\n');
      return;
    }
    
    // Comando no reconocido
    await sock.sendMessage(chatId, { 
      text: `❓ Comando no reconocido: "${text}"\n\nEscribe *menu* para ver todos los comandos disponibles.` 
    });
    console.log('⚠️  Comando no reconocido\n');
    
  } catch (error) {
    console.error('❌ ERROR procesando comando:', error);
    try {
      await sock.sendMessage(chatId, { 
        text: '❌ Ocurrió un error procesando tu comando. Intenta de nuevo.' 
      });
    } catch (e) {
      console.error('Error enviando mensaje de error:', e);
    }
  }
}

// =====================================================
// FUNCIONES EXPORTADAS
// =====================================================

async function initBot() {
  await loadData();
  await connectToWhatsApp();
}

function getDentalData() {
  return dentalData;
}

function getSocket() {
  return sock;
}

module.exports = {
  initBot,
  getDentalData,
  getSocket,
  saveData,
  ADMIN_NUMBER
};
