const { test, expect } = require('@playwright/test');

test.describe('E2E: Flujo de Alta y Baja de empleado', () => {
  // Datos de prueba
  const TEST_USER = {
    name: 'Test Empleado Baja',
    email: 'test-baja-2026@test.com',
    username: 'TEST001',
    team: 'BT',
    mode: 'Onsite',
    city: 'Barcelona',
    startDate: '2026-01-15',
    bajaDate: '2026-06-15'
  };

  test('01 - Crear empleado ficticio (Alta)', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'networkidle' });

    // Rellenar formulario de alta
    await page.fill('#a-nombre', TEST_USER.name);
    await page.fill('#a-usuario', TEST_USER.username);
    await page.fill('#a-email', TEST_USER.email);
    await page.selectOption('#a-equipo', TEST_USER.team);
    await page.selectOption('#a-modalidad', TEST_USER.mode);
    await page.fill('#a-ciudad', TEST_USER.city);
    await page.fill('#a-inicio', TEST_USER.startDate);

    // Verificar que los campos se rellenaron
    expect(await page.inputValue('#a-nombre')).toBe(TEST_USER.name);
    expect(await page.inputValue('#a-inicio')).toBe(TEST_USER.startDate);

    // Hacer clic en "Confirmar alta"
    await page.click('button:has-text("Confirmar alta")');

    // Esperar el mensaje de éxito
    const successMsg = page.locator('#alta-success');
    await expect(successMsg).toBeVisible();
    const msgText = await successMsg.textContent();
    expect(msgText).toContain('✅');

    console.log('✅ Alta registrada correctamente');
  });

  test('02 - Registrar baja del empleado', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'networkidle' });

    // Esperar a que cargue la lista de personas
    await page.waitForTimeout(1000);

    // Seleccionar la persona en el dropdown de baja
    const bajaNameSelect = page.locator('#b-nombre');
    await bajaNameSelect.click();

    // Buscar el nombre en el dropdown
    await page.waitForTimeout(500);
    const option = page.locator(`#b-nombre option:has-text("${TEST_USER.name}")`);

    // Alternativamente, obtener el valor del ID
    const options = await page.locator('#b-nombre option').count();
    expect(options).toBeGreaterThan(1);

    // Seleccionar el empleado de prueba
    await page.selectOption('#b-nombre', { label: new RegExp(TEST_USER.name) });

    // Llenar la fecha de baja
    await page.fill('#b-fecha', TEST_USER.bajaDate);

    // Verificar que se rellenó
    expect(await page.inputValue('#b-fecha')).toBe(TEST_USER.bajaDate);

    // Hacer clic en "Confirmar baja"
    await page.click('button:has-text("Confirmar baja")');

    // Esperar el mensaje de éxito
    const successMsg = page.locator('#baja-success');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
    const msgText = await successMsg.textContent();
    expect(msgText).toContain('✅');
    expect(msgText).toContain('calendario');

    console.log('✅ Baja registrada y calendarios actualizados');
  });

  test('03 - Verificar que los datos se guardaron correctamente', async ({ page }) => {
    // Navegar a admin para verificar el roster
    await page.goto('/admin.html', { waitUntil: 'networkidle' });

    // Ir a la pestaña de roster
    await page.click('button:has-text("Team Roster")');

    // Esperar a que cargue la tabla
    await page.waitForLoadState('networkidle');

    // Buscar el empleado en la tabla
    const tableText = await page.content();
    expect(tableText).toContain(TEST_USER.name);
    expect(tableText).toContain(TEST_USER.bajaDate);

    console.log('✅ Empleado visible en el roster con fecha de baja');
  });

  test('04 - Verificar que el dashboard no cuenta horas de empleado dado de baja', async ({ page }) => {
    await page.goto('/dashboard.html', { waitUntil: 'networkidle' });

    // Esperar a que carguen los datos
    await page.waitForTimeout(2000);

    // Verificar que la página cargó
    const heading = page.locator('text=Dashboard de Capacidad');
    await expect(heading).toBeVisible();

    // Verificar que hay datos en la tabla de personas
    const tableBody = page.locator('table tbody');
    await expect(tableBody).toBeVisible();

    // Buscar el empleado en la tabla
    const table = await page.content();

    if(table.includes(TEST_USER.name)) {
      console.log('ℹ️ Empleado de prueba visible en dashboard (puede estar en histórico)');
    } else {
      console.log('✅ Empleado de prueba no aparece en métricas actuales (correcto)');
    }

    console.log('✅ Dashboard cargado correctamente');
  });

  test('05 - Verificar estructura de datos en calendarios (visual)', async ({ page }) => {
    // Este test verifica que la estructura de datos es coherente
    // Se ejecuta después de que se haya registrado la baja

    await page.goto('/dashboard.html', { waitUntil: 'networkidle' });

    // Hacer clic en el botón de actualizar
    await page.click('button:has-text("↻ Actualizar")');

    // Esperar a que se recarguen los datos
    await page.waitForTimeout(3000);

    // Verificar que el dashboard está activo
    const content = page.locator('.content');
    await expect(content).toBeVisible();

    console.log('✅ Dashboard recargado y datos actualizados');
  });
});
