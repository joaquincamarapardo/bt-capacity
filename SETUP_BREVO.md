# Configuración de Brevo para Emails (Gratuito)

Esta guía explica cómo configurar **Brevo** para enviar correos de bienvenida a nuevos usuarios. Es **completamente gratuito** (300 emails/día).

## 1. Crear cuenta en Brevo

1. Ve a https://www.brevo.com/
2. Click en **Sign Up** (gratuito)
3. Completa el formulario
4. Verifica tu email
5. Inicia sesión

## 2. Obtener tu API Key

1. Una vez en Brevo, ve a **Settings → SMTP & API**
   - Link directo: https://app.brevo.com/settings/keys/api
2. En la sección "API Keys", copia tu clave
3. Se verá algo como: `xkeysib-1234567890abcdefghij...`

## 3. Guardar API Key en BT Capacity

1. Abre **admin.html**
2. Ve a la pestaña **"⚙️ CONFIGURACIÓN"**
3. Busca la sección "⚙️ Configuración de Emails (Brevo)"
4. Pega tu API Key en el campo
5. Click en **"💾 Guardar API Key"**
6. Verifica con el botón **"✓ Verificar Conexión"**

## 4. ¿Cómo funciona?

Cuando un admin crea una nueva cuenta:
1. Click en **"🔑 Crear / Restablecer contraseña"**
2. Se crea la cuenta en Firebase
3. **Automáticamente** se envía un email con:
   - Usuario
   - Contraseña temporal
   - Link a la app
   - Instrucción de cambiar contraseña

## 5. Límites Gratuitos

- **300 emails/día** (gratis)
- **300 emails/mes** (gratis con cuenta básica)
- Después puedes upgradearse a plan de pago si necesitas más

## Troubleshooting

**❌ "Configura tu API Key de Brevo"**
- La API Key no está guardada
- Vuelve a la sección de Configuración y guárdala

**❌ "API Key inválida o expirada"**
- Tu clave no es válida
- Ve a https://app.brevo.com/settings/keys/api y genera una nueva
- Guárdala nuevamente

**❌ El correo no se envía**
- Verifica que hayas guardado correctamente la API Key
- Verifica la conexión con el botón "✓ Verificar Conexión"
- Revisa la consola del navegador (F12 → Console) para errores

**❌ Correo llega a SPAM**
- Brevo es servicio legítimo, debería ir a bandeja normal
- Si llega a SPAM, marca como "No es SPAM" en tu email
