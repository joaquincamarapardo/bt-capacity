# 🧪 Plan de Testing en Ambiente Staging

**Rama:** `feature/multi-year-refactor`  
**Firebase:** `bt-capacity-staging` (separado de producción)  
**Estado:** 🟡 Listo para testing  
**Fecha:** 17/07/2026

---

## 🔧 Configuración Actual

- ✅ Firebase config apunta a **staging** (bt-capacity-staging)
- ✅ Código refactorizado para multi-año
- ✅ Selectores de año en topbar
- ✅ config.js con funciones dinámicas

---

## 📋 Checklist de Testing

### PARTE 1: Setup Staging

- [ ] Firebase staging creado y Firestore inicializado
- [ ] Usuario admin creado en staging
- [ ] Archivo local abierto en navegador
- [ ] Login exitoso en staging

### PARTE 2: Testing de Admin (Altas)

#### Test 1: Crear empleado en 2026
```
1. Admin → Pestaña "Alta"
2. Año selector: Verificar que dice "2026"
3. Llenar datos:
   - Nombre: "Test 2026-Ana"
   - Email: test-2026-ana@test.com
   - Equipo: BT
   - Modalidad: Onsite
   - Fecha alta: 2026-03-01
   
4. Click "Confirmar alta"
5. ✅ Mensaje: "✅ Alta registrada correctamente (2026). Calendario creado para 10 meses."
6. Verificar en Firebase:
   - Documento en `roster`: id=test-2026-ana
   - 10 documentos en `calendar`: formato "2026-Jan-test-2026-ana", "2026-Feb-...", etc.
```

#### Test 2: Crear empleado en 2027
```
1. Admin → Cambiar año selector a "2027"
2. Crear otro empleado:
   - Nombre: "Test 2027-Bob"
   - Fecha alta: 2027-01-01
   
3. Click "Confirmar alta"
4. ✅ Mensaje debe decir "(2027)"
5. Verificar en Firebase:
   - Documentos en `calendar`: formato "2027-Jan-test-2027-bob", "2027-Feb-...", etc.
```

#### Test 3: Crear empleado con Offshore
```
1. Año: 2026
2. Nombre: "Test Offshore"
3. Modalidad: Offshore (debería poner 9h por defecto)
4. Verificar que inputs de horas muestran "9"
5. Confirmar alta
6. Verificar en Firebase que los calendarios tienen 9h/día
```

### PARTE 3: Testing de Dashboard

#### Test 4: Dashboard 2026
```
1. Dashboard (automáticamente mostrará 2026)
2. Verificar:
   - [ ] Título: "Dashboard de Capacidad" (sin año hardcodeado)
   - [ ] Año selector: muestra "2026"
   - [ ] Tabla "Por persona": aparecen empleados de 2026
   - [ ] Totales de horas son correctos
   - [ ] Gráficos cargan sin errores
```

#### Test 5: Cambiar a 2027 en Dashboard
```
1. Dashboard → Año selector → Cambiar a "2027"
2. Esperar a que cargue
3. Verificar:
   - [ ] Tabla se actualiza con empleados de 2027
   - [ ] Los de 2026 desaparecen
   - [ ] Totales reflejan solo 2027
   - [ ] Año se guarda en localStorage (F5 sigue en 2027)
```

#### Test 6: Cambiar de nuevo a 2026
```
1. Año selector → "2026"
2. Verificar que datos de 2026 se restauran correctamente
```

### PARTE 4: Testing de Planner

#### Test 7: Planner 2026
```
1. Planner (abre con 2026)
2. Verificar:
   - [ ] Título: "Capacity Planner" (sin año hardcodeado)
   - [ ] Año selector muestra "2026"
   - [ ] Mes selector funciona
   - [ ] Calendario muestra empleados de 2026
   - [ ] Totales por persona son correctos
```

#### Test 8: Cambiar a 2027 en Planner
```
1. Año selector → "2027"
2. Esperar a que cargue mes actual
3. Verificar:
   - [ ] Tabla se actualiza
   - [ ] Empleados de 2027 aparecen
   - [ ] Empleados de 2026 desaparecen
```

#### Test 9: Navegar meses en 2027
```
1. Click en diferentes meses
2. Verificar que los calendarios cargan correctamente para 2027
3. Intentar editar horas (si tienes permisos admin)
4. Guardar cambios
```

### PARTE 5: Testing de Baja

#### Test 10: Registrar baja en 2026
```
1. Admin → Pestaña "Baja"
2. Año selector: asegurar que es 2026
3. Seleccionar: "Test 2026-Ana"
4. Fecha de baja: "2026-06-15"
5. Click "Confirmar baja"
6. ✅ Mensaje: "✅ Baja registrada, calendarios actualizados..."
7. Verificar en Firebase:
   - [ ] Documento "2026-Jun-test-2026-ana": días 16-30 son 0
   - [ ] Documentos "2026-Jul-...", "2026-Aug-..." están ELIMINADOS
```

#### Test 11: Dashboard después de baja
```
1. Dashboard → "Test 2026-Ana"
2. Verificar:
   - [ ] Horas bajaron (de ~1568h a ~600h)
   - [ ] Solo cuenta hasta 15/06
```

### PARTE 6: Testing de Múltiples Años Simultáneos

#### Test 12: Comparar datos 2026 vs 2027
```
1. Dashboard → 2026 → Anotar totales
2. Dashboard → 2027 → Anotar totales
3. Dashboard → 2026 → Verificar que totales son los mismos
4. Planner → 2026 → Verificar números
5. Planner → 2027 → Diferentes empleados
6. Planner → 2026 → Mismos empleados
```

### PARTE 7: Testing de localStorage

#### Test 13: Persistencia de año
```
1. Admin → Año "2027"
2. Crear empleado
3. F5 (reload página)
4. ✅ Año sigue siendo "2027"
5. Cambiar a 2026
6. Ir a Dashboard
7. ✅ Dashboard abre en 2026
8. F5
9. ✅ Sigue en 2026
```

### PARTE 8: Testing de Errores

#### Test 14: Datos inconsistentes
```
1. Crear empleado sin especificar fecha de baja
2. Verificar que calcula correctamente todo el año
3. Editar empleado → agregar fecha de baja
4. Verificar que se actualiza correctamente
```

#### Test 15: Navegar entre años rápidamente
```
1. Cambiar año rápidamente: 2026 → 2027 → 2028 → 2026
2. Verificar que no hay datos mezclados
3. Verificar que no hay errores en consola (F12)
```

---

## 🧹 Testing Manual vs Automatizado

### Manual Testing (Ahora)
- ✅ Todos los tests anteriores (1-15)
- ✅ Verificación visual en navegador
- ✅ Interacción con UI
- ⏱️ Tiempo: ~2-3 horas

### Automatizado (Después, FASE 4)
- Playwright tests en `tests/multi-year.spec.js`
- Crear empleados programáticamente
- Verificar datos en Firestore
- Correr en CI/CD

---

## 📊 Resultados Esperados

| Test | Resultado Esperado | ✅/❌ |
|------|------------------|------|
| 1: Crear 2026 | 10 meses creados | [ ] |
| 2: Crear 2027 | 12 meses creados (enero) | [ ] |
| 3: Offshore | 9h/día | [ ] |
| 4: Dashboard 2026 | Datos correctos | [ ] |
| 5: Cambiar a 2027 | Solo 2027 | [ ] |
| 6: Volver a 2026 | Datos de 2026 | [ ] |
| 7: Planner 2026 | Calendario correcto | [ ] |
| 8: Cambiar Planner | Datos actualizados | [ ] |
| 9: Navegar meses | Todos cargan OK | [ ] |
| 10: Baja | Calendarios ajustados | [ ] |
| 11: Dashboard baja | Horas reducidas | [ ] |
| 12: Multi-año | Sin mezcla datos | [ ] |
| 13: localStorage | Año persiste | [ ] |
| 14: Errores | Cálculos correctos | [ ] |
| 15: Velocidad | Sin mezcla datos | [ ] |

---

## 🔍 Dónde Verificar Datos

### Firebase Console (bt-capacity-staging)
1. Firestore Database → colección `calendar`
2. Buscar documentos: `2026-Jan-...`, `2027-Jan-...`, etc.
3. Verificar estructura:
   ```json
   {
     "year": 2026,
     "month": "Jan",
     "monthIndex": 0,
     "name": "Test",
     "team": "BT",
     "days": {
       "1": 8,
       "2": 8,
       ...
       "31": 0  // después de baja
     }
   }
   ```

### Browser Console (F12)
1. Abre Developer Tools (F12)
2. Pestaña "Console"
3. Al cambiar año verás: `Año seleccionado: 2026` / `2027` / etc.
4. Busca errores en rojo

### Local Storage
1. F12 → Application → Local Storage
2. Busca `selectedYear`
3. Debería mostrar el año actual: `2026`, `2027`, etc.

---

## ⚠️ Problemas Comunes

### Problema: Dashboard muestra "undefined"
**Causa:** Calendarios sin campo `name`  
**Solución:** Esos registros se filtran automáticamente (ya está corregido)

### Problema: Año selector no aparece
**Causa:** config.js no cargó  
**Solución:** Verifica F12 Console por errores

### Problema: Datos del año anterior aparecen
**Causa:** localStorage conflicto  
**Solución:** Limpia localStorage:
```javascript
// En F12 Console
localStorage.clear()
location.reload()
```

### Problema: Firestore devuelve datos de ambos años
**Causa:** Filtro de año está mal  
**Solución:** Verifica que documento tenga campo `year` y filtro en código

---

## ✅ Cuando Esté Todo OK

1. ✅ Completa todos los tests (1-15)
2. ✅ No hay errores en consola
3. ✅ Datos no se mezclan entre años
4. ✅ localStorage funciona
5. ✅ Cambios de año son instantáneos
6. ✅ Calendarios se generan correctamente

**Resultado:** Pasar a FASE 4 (Testing Automatizado) y luego FASE 5 (Migración a Producción)

---

## 📝 Log de Testing

**Fecha:** ___________  
**Testeador:** ___________  
**Ambiente:** bt-capacity-staging  

### Resumen:
```
Tests completados: ___/15
Errores encontrados: ___
Bloqueadores: [ ] Sí [ ] No
```

### Errores encontrados:
```
1. ________________________
2. ________________________
3. ________________________
```

### Notas:
```
_________________________________
_________________________________
_________________________________
```

---

**¿Listo para empezar el testing?** 🚀

Pasos:
1. Ve a http://localhost:8000 (si lo necesitas, ejecuta `npx http-server -p 8000`)
2. Login con admin
3. Ejecuta los tests del checklist
4. Reporta cualquier problema

