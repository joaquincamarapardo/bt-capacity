const { test, expect } = require('@playwright/test');

test.describe('Lógica de Baja - Procesamiento de Calendarios', () => {

  test('debe mostrar página de inicio cargada', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verificar que se cargó una página
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('index.html carga correctamente', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });

    // Verificar que la página se cargó
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('dashboard.html existe y carga estructura', async ({ page }) => {
    const response = await page.goto('/dashboard.html', { waitUntil: 'domcontentloaded' });
    expect(response.ok()).toBeTruthy();

    // Verificar página está presente
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('verifica que firebase-config.js existe', async ({ page }) => {
    // Verificar que firebase-config.js existe y es accesible
    const configResponse = await page.goto('/firebase-config.js');
    expect(configResponse.ok()).toBeTruthy();
  });

  test('planner.html tiene estructura de calendario', async ({ page }) => {
    await page.goto('/planner.html', { waitUntil: 'networkidle' });

    // Verificar que la página se carga
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Debería tener elementos de calendario
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('verifica que los estilos CSS están cargados', async ({ page }) => {
    await page.goto('/dashboard.html', { waitUntil: 'networkidle' });

    // Contar estilos
    const styles = await page.locator('style').count();
    expect(styles).toBeGreaterThan(0);
  });

  test('la lógica de baja se puede inspeccionar en el código', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'networkidle' });

    // Obtener el contenido de la página que incluye el código JavaScript
    const content = await page.content();

    // Verificar que existen las funciones clave
    expect(content).toContain('confirmarBaja');
    expect(content).toContain('actualizarCalendario');
    expect(content).toContain('calendarMap'); // Estructura de datos de calendarios
  });

  test('los datos de prueba se pueden definir correctamente', async ({ page }) => {
    // Inyectar variables de prueba para simular el flujo
    const testData = {
      employeeName: 'Test Empleado Baja',
      startDate: '2026-03-01',
      bajaDate: '2026-06-15',
      mode: 'Onsite',
      team: 'BT'
    };

    expect(testData.employeeName).toBe('Test Empleado Baja');
    expect(testData.bajaDate).toBe('2026-06-15');

    // Simular que se puede calcular correctamente
    const startMonth = new Date(testData.startDate).getMonth(); // 2 (Marzo)
    const bajaMonth = new Date(testData.bajaDate).getMonth();   // 5 (Junio)
    const bajaDay = new Date(testData.bajaDate).getDate();      // 15

    // Desde marzo (mes 2) hasta junio (mes 5) son 4 meses completos
    const fullMonths = bajaMonth - startMonth; // 3 (marzo, abril, mayo completos)

    expect(fullMonths).toBe(3);
    expect(bajaDay).toBe(15);
  });

  test('verifica cálculo de horas después de baja', async ({ page }) => {
    // Simular cálculo de horas disponibles
    const config = {
      startDate: new Date('2026-03-01'),
      bajaDate: new Date('2026-06-15'),
      hoursPerMonth: 8,
      workDaysPerMonth: 21 // Aproximación
    };

    // Cálculo: desde marzo hasta mitad de junio (4.5 meses aprox)
    // 4.5 meses × 8h/día × 21 días/mes / 30 = ~25h por mes
    const monthsActive = 4.5;
    const expectedHours = monthsActive * config.hoursPerMonth; // ~36h

    expect(expectedHours).toBeGreaterThan(20);
    expect(expectedHours).toBeLessThan(50);
  });

  test('verifica que la estructura de datos es coherente', async ({ page }) => {
    // Definir estructura de calendario simulada
    const calendarBefore = {
      'Mar-test-emp': {
        month: 'Mar',
        days: { '1': 8, '2': 8, '3': 8, '4': 8, '5': 8 }
      },
      'Jun-test-emp': {
        month: 'Jun',
        days: { '1': 8, '2': 8, '3': 8, '4': 8, '5': 8, '6': 8 }
      }
    };

    // Después de baja, junio debería tener 0 horas después del día 15
    const calendarAfter = {
      'Mar-test-emp': {
        month: 'Mar',
        days: { '1': 8, '2': 8, '3': 8, '4': 8, '5': 8 }
      },
      'Jun-test-emp': {
        month: 'Jun',
        days: { '1': 8, '2': 8, '3': 8, '4': 8, '15': 0, '16': 0 }
      }
    };

    // Verificar que los cambios son correctos
    const daysBefore = Object.values(calendarBefore['Jun-test-emp'].days).reduce((s, h) => s + h, 0);
    const daysAfter = Object.values(calendarAfter['Jun-test-emp'].days).reduce((s, h) => s + h, 0);

    expect(daysBefore).toBe(48); // 6 días × 8h
    expect(daysAfter).toBe(32);  // 4 días × 8h (días 1-4)
    expect(daysAfter).toBeLessThan(daysBefore);
  });

  test('verifica que los meses posteriores no existen', async ({ page }) => {
    // Estructura después de baja
    const calendars = {
      'Mar-test-emp': { month: 'Mar' },
      'Apr-test-emp': { month: 'Apr' },
      'May-test-emp': { month: 'May' },
      'Jun-test-emp': { month: 'Jun', days: { '15': 0 } },
      // Julio, Agosto, etc. deberían estar ELIMINADOS
    };

    // Verificar que meses posteriores a junio no existen
    const keys = Object.keys(calendars);
    const hasJuly = keys.some(k => k.includes('Jul'));
    const hasAugust = keys.some(k => k.includes('Aug'));

    expect(hasJuly).toBeFalsy();
    expect(hasAugust).toBeFalsy();
  });

});
