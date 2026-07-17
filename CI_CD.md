# CI/CD Pipeline - BT Team Capacity

Este proyecto está configurado con **GitHub Actions** para ejecutar pruebas automáticas y desplegar cambios.

## 🔄 Cómo funciona

### 1. **Haces un cambio en el código**
```bash
git commit -m "Fix: actualizar dashboard"
git push origin main
```

### 2. **GitHub Actions automáticamente:**
- ✅ Ejecuta las 22 pruebas de Playwright
- 📊 Genera un reporte de resultados
- 🚀 Si todo pasa → Despliega a GitHub Pages
- ❌ Si algo falla → Te notifica en GitHub

### 3. **Resultado**
```
✅ Pruebas pasadas (22/22)
🌐 App desplegada automáticamente
📝 Cambios en vivo en: https://joaquincamarapardo.github.io/bt-capacity/
```

## 📋 Archivo de Configuración

**Ubicación:** `.github/workflows/test-and-deploy.yml`

Este archivo define:
- **Trigger:** Se ejecuta en cada `push` a `main`
- **Ambiente:** Ubuntu Linux (gratuito en GitHub)
- **Steps:**
  1. Descarga el código
  2. Instala Node.js 18
  3. Instala dependencias (`npm install`)
  4. Instala navegadores de Playwright
  5. Ejecuta todas las pruebas (`npm test`)
  6. Sube un reporte con los resultados
  7. Si pasa → despliega a GitHub Pages

## 📊 Ver resultados

### En GitHub
1. Ve a tu repositorio en GitHub
2. Click en **"Actions"** en la barra superior
3. Verás cada ejecución de CI/CD con:
   - ✅/❌ Estado (pasó o falló)
   - ⏱️ Tiempo de ejecución
   - 📝 Logs detallados

### Descargar reporte de pruebas
1. En Actions, haz click en el workflow que pasó
2. Scroll hacia abajo → "Artifacts"
3. Descarga `playwright-report`
4. Abre `index.html` en el navegador para ver reporte interactivo

## 🔧 Configurar notificaciones

### Email
GitHub automáticamente te notifica si algo falla (usa tu email de GitHub)

### Slack (opcional)
Puedo configurar notificaciones en Slack si lo necesitas

## ❌ Si una prueba falla

1. **GitHub te notifica** en el PR o push
2. **Revisa los logs** en Actions → workflow fallido
3. **Corrige el código** localmente
4. **Haz push nuevamente**
5. Las pruebas se ejecutan automáticamente de nuevo

## 🚀 Ventajas

✅ **Confiabilidad:** Cada cambio es probado automáticamente  
✅ **Velocidad:** No esperas a desplegar manualmente  
✅ **Trazabilidad:** Historial completo de qué se desplegó  
✅ **Seguridad:** Los cambios se validan antes de ir a producción  
✅ **Gratis:** GitHub Actions es gratuito para repos públicos  

## 📝 Próximos pasos (opcional)

- Agregar más pruebas específicas de funcionalidad
- Configurar notificaciones en Slack
- Agregar checks de seguridad (SAST)
- Agregar análisis de cobertura de código

## ❓ Preguntas frecuentes

**¿Qué pasa si fuerzo un push sin pasar pruebas?**
- No puedes desplegar. El workflow falla y GitHub impide el merge a `main` (si está configurado).

**¿Cuánto cuesta?**
- Nada. GitHub Actions es gratuito para repos públicos.

**¿Se ejecuta en la nube?**
- Sí. GitHub proporciona máquinas virtuales gratuitas (ubuntu-latest).

**¿Puedo ver histórico de despliegues?**
- Sí. En GitHub Actions → ver todos los workflows ejecutados.
