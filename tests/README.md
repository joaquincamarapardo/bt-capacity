# BT Capacity Automated Tests

Este directorio contiene pruebas automatizadas para la app BT Team Capacity usando Playwright.

## Archivos de prueba

- **smoke.spec.js** — Pruebas básicas de carga y disponibilidad
  - Verificar que la página se carga correctamente
  - Verificar elementos visibles del formulario de login
  - Verificar responsividad en mobile

- **navigation.spec.js** — Pruebas de navegación entre páginas
  - Verificar enlaces entre páginas
  - Verificar que todas las páginas se cargan correctamente
  - Verificar clicks en botones de navegación

- **firebase-config.spec.js** — Pruebas de configuración de Firebase
  - Verificar que Firebase está inicializado
  - Verificar que el proyecto ID es correcto
  - Verificar que Auth y Database están configurados

## Ejecutar las pruebas

### Todas las pruebas
```bash
npm test
```

### Una suite específica
```bash
npx playwright test tests/smoke.spec.js
```

### En modo interactivo (debug)
```bash
npx playwright test --debug
```

### Ver el reporte HTML
```bash
npx playwright show-report
```

### Pruebas en paralelo vs secuencial
```bash
npx playwright test --workers=1  # Secuencial
npx playwright test --workers=4  # 4 workers en paralelo
```

## Configuración

La configuración de Playwright está en `playwright.config.js`:
- Base URL: https://joaquincamarapardo.github.io/bt-capacity/
- Browser: Chromium
- Screenshots: Solo si fallan
- Traces: En primer reintento

## Agregar más pruebas

1. Crear nuevo archivo `tests/nombre.spec.js`
2. Usar el mismo formato que los archivos existentes
3. Las pruebas se ejecutarán automáticamente con `npm test`

Ejemplo:
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Mi Suite', () => {
  test('mi prueba', async ({ page }) => {
    await page.goto('/');
    // ... tu código aquí
  });
});
```
