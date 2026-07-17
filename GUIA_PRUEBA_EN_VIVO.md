# 🎯 Guía de Prueba en Vivo - Funcionalidad de Alta y Baja

## 🚀 Paso 0: Acceder a la aplicación

**URL:** https://joaquincamarapardo.github.io/bt-capacity/

Verás la pantalla de login de BT Team Capacity:
- 🔐 Opción 1: "Acceder con Google"
- 🔐 Opción 2: "Acceder con email y contraseña"

### ¿Tienes cuenta de admin?
Si SÍ → Continúa con **Paso 1**  
Si NO → Deberá crear una cuenta o pedir acceso

---

## 📝 Paso 1: Hacer Login como Admin

1. Click en **"Acceder con email y contraseña"** (o Google si lo prefieres)
2. Usa tu email de admin (joaquin.camara@dxc.com)
3. Ingresa tu contraseña
4. ✅ Deberías ver el Dashboard principal

**Esperado:**
- Dashboard carga con datos de empleados
- Ves la tabla "Tabla por persona"
- Puedes ver totales de horas

---

## ➕ Paso 2: Crear un Empleado Ficticio (ALTA)

### Ubicación: Gestión de Equipo → Pestaña "Alta"

**Llena el formulario con estos datos:**

```
Nombre completo:     Test Baja 2026
Usuario (ID):        TEST-BAJA-2026
Email:               test-baja-2026@dxc.test
Equipo:              BT
Modalidad:           Onsite
Ciudad:              Barcelona
Fecha de alta:       2026-03-01  ← Marzo (importante)
Fecha de baja:       (Dejar vacío)
Horas/mes:           8 (por defecto)
```

**Haz clic:** "Confirmar alta"

**Resultado esperado:**
```
✅ Alta registrada correctamente. Calendario creado para 10 meses.
```

**Verificación:**
- Ve a **👥 Team Roster**
- Busca "Test Baja 2026" en la tabla
- Debería estar con estado ACTIVO

---

## 📊 Paso 3: Verificar Horas en Dashboard ANTES de la Baja

### Ubicación: Dashboard de Capacidad

1. Click en **"← Inicio"** para volver al Dashboard
2. Busca **"Test Baja 2026"** en la tabla "Tabla por persona"
3. **ANOTA las horas totales** que ves

**Ejemplo esperado:**
```
Persona:           Test Baja 2026
Horas disponibles: 80h    ← ANOTA ESTE NÚMERO
Horas ausencia:    0h
```

**¿Por qué 80h?**
- Trabaja de marzo a diciembre = 10 meses
- 8 horas/mes × 10 meses = 80h

---

## ➖ Paso 4: Registrar la Baja del Empleado

### Ubicación: Gestión de Equipo → Pestaña "Baja"

**Llena el formulario:**

```
Nombre:           (Selecciona) Test Baja 2026
Fecha de baja:    2026-06-15   ← Mitad de junio (IMPORTANTE)
Motivo:           (Elige cualquiera)
```

**Haz clic:** "Confirmar baja"

**Resultado esperado:**
```
✅ Baja registrada, calendarios actualizados y acceso revocado.
```

### 🔍 ¿Qué acaba de pasar internamente?

```
1. Roster: Ahora tiene fecha de fin = 2026-06-15
2. Calendarios:
   - Junio 1-15: Mantienen 8h
   - Junio 16-30: CAMBIAN A 0h (corrección implementada)
   - Julio, Agosto... : ELIMINADOS (corrección implementada)
3. Acceso: Usuario sin acceso a la app
```

---

## ✅ Paso 5: VERIFICAR CAMBIOS en Dashboard

### La parte más importante: ¡Ver que funciona!

1. Ve a **Dashboard de Capacidad**
2. Click en **"↻ Actualizar"** (arriba a la derecha)
3. Espera 2-3 segundos
4. Busca **"Test Baja 2026"** en la tabla nuevamente

### 📊 COMPARA LOS NÚMEROS:

| Métrica | ANTES | DESPUÉS | ✓ Esperado |
|---------|-------|---------|-----------|
| **Horas disp.** | 80h | **36h** | ✅ BAJÓ |
| **Horas aus.** | 0h | 0h | ✅ Igual |
| **% disponible** | 100% | **100%** | ✅ Igual |

**¿Qué pasó?**
```
ANTES:  10 meses × 8h = 80h
DESPUÉS: 3.5 meses × 8h = 28h
         (Marzo, Abril, Mayo, Junio 1-15)

RESULTADO: 80h → 36h ✅ CORRECCIÓN ACTIVA
```

---

## 🔄 Paso 6: Verificación Adicional (Capacity Planner)

**Para confirmar que todo está sincronizado:**

1. Ve a **Capacity Planner** (desde el menú principal)
2. Busca el empleado "Test Baja 2026"
3. Verifica que:
   - Marzo a junio 15: Tiene horas (8h/día)
   - Junio 16 en adelante: **SIN HORAS** ← Esto es la corrección

**Resultado esperado:**
```
Calendario visual del empleado:
[████] Marzo   - 8h/día ✓
[████] Abril   - 8h/día ✓
[████] Mayo    - 8h/día ✓
[████] Junio   - 8h/día hasta día 15 ✓
[    ] Junio   - 0h después del 15 ✓
[    ] Julio   - SIN DATOS (eliminado) ✓
```

---

## 🎯 Checklist Final

| Paso | Verificación | ✓/✗ |
|------|-------------|-----|
| 1 | Conseguí login como admin | ☐ |
| 2 | Creé empleado "Test Baja 2026" | ☐ |
| 3 | Verifiqué 80h en Dashboard | ☐ |
| 4 | Registré baja para 2026-06-15 | ☐ |
| 5 | Dashboard muestra 36h después | ☐ |
| 6 | Capacity Planner sin horas después de baja | ☐ |
| **TOTAL** | **TODOS LOS PASOS COMPLETADOS** | ☐ |

---

## 🎉 ¿Si todo funcionó?

**¡Excelente! La corrección está ACTIVA y FUNCIONANDO.**

Significa que:
- ✅ Las horas después de la baja se ponen a 0
- ✅ Los calendarios posteriores se eliminan
- ✅ Dashboard refleja correctamente los totales
- ✅ Capacity Planner sincronizado

---

## ❌ Si algo no funciona

### Síntoma: Las horas NO bajaron (siguen siendo 80h)

**Soluciones:**
1. Haz clic en **"↻ Actualizar"** en Dashboard (podría estar en caché)
2. Recarga la página: **F5**
3. Cierra sesión y vuelve a entrar
4. Verifica que la baja se registró (ve a Team Roster)

### Síntoma: El empleado desapareció del Dashboard

**Verificación:**
1. Ve a **Team Roster**
2. Busca el empleado → Debe tener "Fecha de baja: 2026-06-15"
3. Si NO está → La baja no se registró correctamente

### Síntoma: En Capacity Planner sigue viendo horas después del 15/06

**Significa:** La corrección aún no se aplicó  
**Acción:**
1. Vuelve a Dashboard
2. Click en "Actualizar"
3. Recarga Planner (F5)

---

## 📱 Pruebas Adicionales (Opcionales)

### Test 2: Revertir la Baja

Para confirmar que todo es reversible:

1. Ve a **Team Roster**
2. Click en **"✏️ Editar"** sobre el empleado
3. **Borra** el contenido de "Fecha de baja"
4. Click **"Guardar cambios"**
5. Ve a Dashboard → "↻ Actualizar"
6. Verifica que las horas vuelven a **80h** ✅

### Test 3: Baja en Diferentes Meses

Repite el proceso pero con fechas diferentes:
- Baja en enero: Debería mostrar 0h
- Baja a final de año: Debería mostrar ~71h

---

## 📸 Screenshots de Referencia

**Pantalla de Login (Paso 0):**
- Has visto una captura aquí

**Dashboard Después de Baja (Paso 5):**
- Deberías ver "Test Baja 2026" con **36h** en lugar de 80h

---

## 💡 Preguntas Frecuentes

**P: ¿Necesito ser admin?**  
R: Sí, solo admins pueden hacer altas y bajas.

**P: ¿Se puede deshacer una baja?**  
R: Sí, edita el empleado y borra la fecha de fin.

**P: ¿Se borran los datos del empleado?**  
R: No, solo se actualizan los calendarios. Los datos están en Firestore.

**P: ¿Cuánto tarda en actualizarse?**  
R: Inmediato. Si no lo ves, recarga (F5).

---

## 🏁 Conclusión

Si completaste todos los pasos y viste que:
- ✅ Las horas bajaron de 80h a 36h
- ✅ Capacity Planner sincronizado
- ✅ Dashboard se actualizó automáticamente

## 🎊 **¡LA CORRECCIÓN ESTÁ FUNCIONANDO PERFECTAMENTE!**

---

**¿Necesitas ayuda?**  
Revisa `RESUMEN_MEJORAS.md` para entender qué cambió internamente.

