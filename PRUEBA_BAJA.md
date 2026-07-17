# 📋 Guía de Prueba: Funcionalidad de Alta y Baja

Esta guía te permite probar manualmente que la corrección de baja funciona correctamente.

## ✅ Requisitos previos
- Estar logueado como admin en la app
- Acceso a https://joaquincamarapardo.github.io/bt-capacity/

## 🔄 Flujo de Prueba Completo

### **Paso 1: Crear un empleado ficticio (Alta)**
1. Ve a **Gestión de equipo** → Pestaña **➕ Alta**
2. Rellena el formulario:
   - **Nombre:** `Test Baja 2026` (o similar)
   - **Usuario:** `TEST-BAJA-001`
   - **Email:** `test-baja-2026@dxc.test`
   - **Equipo:** BT
   - **Modalidad:** Onsite
   - **Ciudad:** Barcelona
   - **Fecha de alta:** `2026-03-01` (marzo)
   - **Horas/mes:** Dejar por defecto (8h)
3. Click **Confirmar alta**
4. ✅ Esperar mensaje: "✅ Alta registrada correctamente"

**Verificación:**
- El empleado aparece en la tabla de **Team Roster**
- Los calendarios se crean automáticamente

### **Paso 2: Verificar datos iniciales en Dashboard**
1. Ve a **Dashboard de Capacidad**
2. Busca al empleado en la tabla "Tabla por persona"
3. **Anota las horas totales del empleado** (debe sumar todos los meses de marzo a diciembre)
   - Ej: si son 8h/mes y trabaja de marzo a diciembre = 10 meses × 8h = 80h

**Verificación:**
- El empleado aparece en las métricas
- Sus horas se suman al total

### **Paso 3: Registrar baja del empleado**
1. Ve a **Gestión de equipo** → Pestaña **➖ Baja**
2. Rellena el formulario:
   - **Nombre:** Selecciona el empleado de prueba
   - **Fecha de baja:** `2026-06-15` (a mitad de junio)
   - **Motivo:** "Prueba - Rotación interna"
3. Click **Confirmar baja**
4. ✅ Esperar mensaje: "✅ Baja registrada, calendarios actualizados..."

**Verificación:**
- El mensaje menciona "calendarios actualizados"
- El empleado sigue visible en Team Roster pero con fecha de fin

### **Paso 4: Verificar cambios en el Dashboard**
1. Ve a **Dashboard de Capacidad**
2. Click **↻ Actualizar** para forzar recalcular
3. Busca nuevamente al empleado
4. **Verifica sus horas totales:**

**Lo que DEBERÍA pasar (corrección implementada):**
```
ANTES de la baja:  80 horas (8h × 10 meses)
DESPUÉS de la baja: 
  - Marzo a junio 15: 4.5 meses × 8h = 36h
  - Junio 16 a diciembre: 0h (ponen a 0, no se cuentan)
  TOTAL ESPERADO: 36h
```

**⚠️ Señales de que funciona:**
- Las horas **disminuyeron** respecto a antes
- Horas posteriores al 15/06 **no se cuentan**
- Total anual **bajó** correctamente
- Capacity planner y Dashboard muestran **números consistentes**

**❌ Señales de que NO funciona:**
- Las horas **siguen igual** (no se actualizó nada)
- Dashboard sigue contando horas posteriores a la baja
- Los totales no cambiaron

### **Paso 5: Análisis de Datos en Firestore (Opcional)**
Si tienes acceso a Firebase Console:

1. Ve a **Firebase Console** → **Realtime Database** → `calendar`
2. Busca los documentos de este empleado: `Feb-{id}`, `Mar-{id}`, etc.
3. En el mes de la baja (Junio):
   ```json
   {
     "days": {
       "1": 8,
       "2": 8,
       ...
       "14": 8,
       "15": 0,    ← Cambió a 0
       "16": 0,    ← Cambió a 0
       "17": 0     ← Cambió a 0
       ...
     }
   }
   ```
4. En meses posteriores (Julio, Agosto...):
   - **El documento debería estar ELIMINADO** (no debería existir)

### **Paso 6: Revertir (Opcional)**
1. Ve a **Gestión de equipo** → **👥 Team Roster**
2. Click **✏️ Editar** sobre el empleado
3. **Vacía el campo "Fecha de baja"** 
4. Click **Guardar cambios**
5. Verificar que las horas vuelven a aparecer en el Dashboard

## 📊 Resumen de Cambios Esperados

| Métrica | Antes de baja | Después de baja | ¿Cambió? |
|---------|---|---|---|
| Horas totales del empleado | 80h | 36h | ✅ Sí |
| Horas del mes de baja | 40h | 36h | ✅ Sí |
| Horas de meses posteriores | 40h | 0h | ✅ Sí |
| Total anual (todos) | Más | Menos | ✅ Sí |
| Dashboard vs Planner | Iguales | Iguales | ✅ Sí |

## 🐛 Si algo no funciona

**Síntoma:** Las horas no cambiaron
**Solución:** 
- Verifica que está en la pestaña de **Baja**, no **Edición**
- Haz click en **Actualizar** en el Dashboard
- Recarga la página (F5)

**Síntoma:** El empleado desapareció del Dashboard completamente
**Posible problema:** 
- Los calendarios fueron eliminados en lugar de actualizar
- Verifica en Firestore que los registros existen

**Síntoma:** Vuelve a aparecer con horas después de refrescar
**Posible problema:**
- Los datos en Firestore no se guardaron correctamente
- Verifica que la conexión a Firestore es correcta

## ✅ Prueba Exitosa
```
✅ Alta registrada
✅ Empleado visible en Dashboard
✅ Baja registrada y calendarios actualizados
✅ Horas disminuyeron correctamente
✅ Dashboard y Planner muestran números consistentes
✅ Rollback funciona (retirar fecha de fin)
```
