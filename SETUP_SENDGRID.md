# Configuración de SendGrid y Firebase Functions

Esta guía explica cómo configurar SendGrid para enviar correos de bienvenida a nuevos usuarios.

## 1. Obtener API Key de SendGrid

1. Ve a https://sendgrid.com/
2. Crea una cuenta gratuita (si no tienes)
3. Ve a **Settings > API Keys**
4. Click en **Create API Key**
5. Nombre: `firebase-bt-capacity`
6. Selecciona permisos: solo **Mail Send**
7. Copia la clave API

## 2. Configurar Variable de Entorno en Firebase

Guarda la clave API en Firebase Functions:

```bash
firebase functions:config:set sendgrid.api_key="TU_CLAVE_API_AQUI"
```

O usa la consola Firebase:
- Ve a https://console.firebase.google.com/project/bt-capacity/functions/config
- Agrega la variable `SENDGRID_API_KEY` con tu clave

## 3. Instalar Dependencias

```bash
cd functions
npm install
```

## 4. Desplegar Functions

```bash
firebase deploy --only functions
```

## 5. Configurar Sender Email

En `functions/index.js` línea 67, está configurado:
```javascript
from: 'noreply@btcapacity.app',
```

**Importante:** Debes verificar este email en SendGrid:
1. Ve a https://app.sendgrid.com/settings/sender_auth/domain
2. Verifica `noreply@btcapacity.app` (o usa tu propio email)
3. O reemplaza en `functions/index.js` con un email verificado

## 6. Testear en Desarrollo

Ejecuta el emulador:
```bash
firebase emulators:start --only functions
```

## Cómo Funciona

Cuando un admin crea una cuenta para un usuario:
1. Se crea la cuenta en Firebase Auth
2. Se llama automáticamente la función `sendWelcomeEmail`
3. Se envía un correo con:
   - Usuario
   - Contraseña temporal
   - Link a la app
   - Instrucción de cambiar contraseña

## Troubleshooting

- **Error: "SendGrid not configured"** → Falta configurar `SENDGRID_API_KEY`
- **Email no enviado** → Verifica que el sender email esté validado en SendGrid
- **Logs** → `firebase functions:log`
