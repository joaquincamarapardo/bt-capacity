const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Configurar SendGrid con clave API desde params
const { defineString } = require('firebase-functions/params');

const sendgridApiKey = defineString('SENDGRID_API_KEY');

// Configurar SendGrid cuando se use la función
function ensureSendgridConfigured() {
  if (!sendgridApiKey.value()) {
    throw new Error('SENDGRID_API_KEY no está configurada');
  }
  sgMail.setApiKey(sendgridApiKey.value());
}

/**
 * Envía correo de bienvenida a nuevo usuario con credenciales
 * Se llama automáticamente cuando se crea una cuenta desde admin.html
 */
exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  // Verificar autenticación (solo admin puede llamar)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario no está autenticado'
    );
  }

  // Verificar rol admin
  const callerDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo admins pueden enviar correos de bienvenida'
    );
  }

  // Validar datos requeridos
  const { email, username, password, name } = data;
  if (!email || !username || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: email, username, password'
    );
  }

  try {
    // Configurar SendGrid
    ensureSendgridConfigured();

    const msg = {
      to: email,
      from: 'noreply@btcapacity.app',
      subject: '🎯 Bienvenido a BT Capacity Planner',
      html: generateWelcomeEmail(name || username, username, password),
    };

    await sgMail.send(msg);

    return {
      success: true,
      message: `Correo de bienvenida enviado a ${email}`,
    };
  } catch (error) {
    console.error('Error enviando correo:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al enviar correo de bienvenida: ' + error.message
    );
  }
});

/**
 * Genera HTML del correo de bienvenida
 */
function generateWelcomeEmail(displayName, username, password) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0D1B4B; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px 20px; border: 1px solid #e0e0e0; }
    .credentials { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin: 20px 0; font-family: monospace; }
    .credentials p { margin: 8px 0; }
    .label { color: #666; font-size: 12px; text-transform: uppercase; }
    .value { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-weight: bold; }
    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning strong { color: #92400E; }
    .footer { background: #f0f0f0; padding: 15px 20px; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; text-align: center; }
    .button { display: inline-block; background: #0D1B4B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 BT Capacity Planner</h1>
      <p>¡Bienvenido al equipo!</p>
    </div>

    <div class="content">
      <p>Hola <strong>${displayName}</strong>,</p>

      <p>Se ha creado tu cuenta en <strong>BT Capacity Planner</strong>. Usa los datos de abajo para acceder:</p>

      <div class="credentials">
        <p>
          <div class="label">Usuario:</div>
          <div class="value">${username}</div>
        </p>
        <p>
          <div class="label">Contraseña temporal:</div>
          <div class="value">${password}</div>
        </p>
      </div>

      <a href="https://joaquincamarapardo.github.io/bt-capacity/" class="button">Acceder a BT Capacity</a>

      <div class="warning">
        <strong>⚠️ Por favor cambia tu contraseña:</strong>
        <p>Es muy importante que cambies esta contraseña temporal en tu primer acceso. No compartas esta contraseña con nadie.</p>
      </div>

      <p>Si tienes problemas para acceder, contacta al administrador del sistema.</p>
    </div>

    <div class="footer">
      <p>BT Capacity Planner © 2026</p>
      <p>Este correo ha sido enviado automáticamente. No respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}
