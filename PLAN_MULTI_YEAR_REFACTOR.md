# 📋 Plan de Refactorización Multi-Año (2026-2030+)

**Rama:** `feature/multi-year-refactor`  
**Objetivo:** Convertir la aplicación de ser solo 2026 a soportar múltiples años dinámicamente  
**Alcance:** Refactorización completa (Opción B)  
**Ambiente:** Firebase temporal + Rama aislada en Git  
**Estado:** 🟡 En Progreso

---

## 📌 Fases del Plan

### **FASE 1: Preparación del Entorno** (Esta semana)
- [ ] ✅ Crear rama `feature/multi-year-refactor` en Git
- [ ] Crear proyecto Firebase temporal `bt-capacity-staging`
- [ ] Copiar credenciales Firebase a rama (no push)
- [ ] Documento del plan (este archivo)
- [ ] Script de migración esqueleto

### **FASE 2: Refactorización de Código** 
- [ ] Crear `config.js` centralizado con constantes
- [ ] Refactorizar `admin.html` para año dinámico
- [ ] Refactorizar `dashboard.html` con totales anuales
- [ ] Refactorizar `planner.html` para multi-año
- [ ] Actualizar estructura Firestore (agregar `year`)

### **FASE 3: Migración de Datos**
- [ ] Script para migrar datos 2026 existentes
- [ ] Validación de datos post-migración
- [ ] Rollback plan si algo falla

### **FASE 4: Testing Exhaustivo**
- [ ] Tests manuales: crear empleados 2026-2030
- [ ] Tests: Alta/Baja en cada año
- [ ] Tests: Cálculos de horas por año
- [ ] Tests: Dashboards y totales anuales
- [ ] Tests automatizados (Playwright)

### **FASE 5: Integración a Main**
- [ ] Pull Request a main
- [ ] Code review
- [ ] Merge a main
- [ ] Migración en Firebase producción
- [ ] Validación en ambiente vivo

---

## 🗂️ Estructura Nueva de Firestore

### Cambio en Documentos de Calendarios

**ANTES (actual):**
```
Collection: calendar
Document ID: {month}-{personId}
Ejemplo: "Jan-ana-garcia-lopez"

{
  name: "Ana García López",
  team: "BT",
  days: { "1": 8, "2": 8, ... }
}
```

**DESPUÉS (nuevo):**
```
Collection: calendar
Document ID: {year}-{month}-{personId}
Ejemplo: "2026-Jan-ana-garcia-lopez"

{
  year: 2026,
  month: "Jan",
  monthIndex: 0,
  name: "Ana García López",
  team: "BT",
  days: { "1": 8, "2": 8, ... }
}
```

**Compatibilidad:**
- Datos 2026 existentes se migran automáticamente
- Nueva estructura soporta 2026-2030+
- Queries se actualizan para incluir year

---

## 📄 Archivos a Crear/Modificar

### Nuevos Archivos:

1. **`js/config.js`** (100-150 líneas)
   - Constantes centralizadas: YEAR, MN, MNL, DAYS_IN_MONTH, etc.
   - Función: `getYearData(year)` para datos dinámicos
   - Función: `getCalendarDocId(year, month, personId)`
   - Función: `calculateWorkDaysInMonth(year, monthIndex)`

2. **`js/migration.js`** (200-300 líneas)
   - Script para migrar datos 2026 → 2026-{month}-{personId}
   - Validación post-migración
   - Rollback helper

3. **`MIGRATION_GUIDE.md`** 
   - Instrucciones para ejecutar migración en producción
   - Rollback plan
   - Validaciones

### Modificados:

1. **`admin.html`** (~800 líneas)
   - Selector de año dinámico
   - Usar `config.js` en lugar de constantes hardcodeadas
   - Funciones dinámicas con parámetro `year`
   - Migrar calls a Firestore para incluir `year`

2. **`dashboard.html`** (~900 líneas)
   - Selector de año dinámico
   - Usar `config.js`
   - Nueva sección: "Totales Anuales"
   - Queries dinámicas con `year`
   - Mostrar totales por año seleccionado

3. **`planner.html`** (~700 líneas)
   - Selector de año dinámico
   - Usar `config.js`
   - Calendarios dinámicos
   - Totales por año

4. **`firebase-config.js`**
   - Referencia a proyecto staging (temporal)
   - Será revertido a producción antes de merge a main

5. **`playwright.config.js`** (ya hecho)
   - Local server en lugar de GitHub Pages

---

## 🎯 Funciones Clave a Crear

### En `config.js`:

```javascript
// Constantes dinámicas
function getYearData(year) {
  return {
    year: year,
    months: [...],
    daysInMonth: [...],
    isLeapYear: isLeapYear(year)
  };
}

// Generar ID de documento Firestore
function getCalendarDocId(year, month, personId) {
  return `${year}-${month}-${personId}`;
}

// Calcular días hábiles (lunes-viernes)
function calculateWorkDaysInMonth(year, monthIndex) {
  // Retorna número de días hábiles
}

// Verificar si es año bisiesto
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
```

---

## 🔄 Cambios en Queries Firestore

### ANTES:
```javascript
const docRef = doc(db, 'calendar', `${month}-${personId}`);
```

### DESPUÉS:
```javascript
const docRef = doc(db, 'calendar', getCalendarDocId(year, month, personId));
```

---

## 📊 Dashboard - Totales Anuales

Nueva sección a agregar:

```
┌─ Año Seleccionado: [Dropdown 2026-2030+] ─────────────────────┐
│                                                                 │
│ TOTALES ANUALES 2026:                                          │
│ ─────────────────────────────────────────────────────────────  │
│ Total Equipo BT:        1450 horas                            │
│ Total Equipo Finanzas:   980 horas                            │
│ Total General:          2430 horas                            │
│                                                                 │
│ Capacidad por Mes: [Ver desglose]                             │
│ ─────────────────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Plan de Testing

### 1. Testing Manual - Por Año

Para cada año (2026, 2027, 2028, 2029, 2030):
- [ ] Crear empleado ficticio "TEST-{year}"
- [ ] Registrar alta: 01/Enero/{year}
- [ ] Verificar calendarios creados (12 meses)
- [ ] Verificar cálculos de horas correctos
- [ ] Registrar baja a mitad de año
- [ ] Verificar totales reducidos correctamente
- [ ] Borrar y recrear para siguiente año

### 2. Testing de Migración

- [ ] Crear datos 2026 en staging
- [ ] Ejecutar script de migración
- [ ] Verificar estructura nueva
- [ ] Verificar datos intactos
- [ ] Validar que dashboards funcionan

### 3. Testing Automatizado (Playwright)

Nuevos tests en `tests/multi-year.spec.js`:
- [ ] Test: selector de año funciona
- [ ] Test: crear empleado en 2026 y 2027
- [ ] Test: cálculos de horas por año son independientes
- [ ] Test: totales anuales correctos
- [ ] Test: baja en diferentes años

---

## 🚀 Hitos

| Hito | Estimado | Status |
|------|----------|--------|
| Fase 1: Prep. Entorno | Esta semana | 🟡 Progreso |
| Fase 2: Refactor código | 2-3 semanas | ⏳ Por hacer |
| Fase 3: Migración datos | 1 semana | ⏳ Por hacer |
| Fase 4: Testing | 1-2 semanas | ⏳ Por hacer |
| Fase 5: Integración | Fin mes | ⏳ Por hacer |

---

## ⚠️ Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Datos 2026 se corrompen | Alto | Backup antes, script rollback |
| Cálculos de horas fallan | Alto | Testing exhaustivo, validación |
| Interfaz UI rompe | Medio | Tests Playwright, manual |
| Performance decae | Bajo | Monitorear queries, índices |

---

## 📞 Contactos / Notas

- **Rama:** `feature/multi-year-refactor`
- **Firebase Staging:** `bt-capacity-staging` (crear cuando esté listo)
- **Producción:** Cambiar back a Firebase prod antes de merge a main
- **Reversión:** Revertible hasta antes del merge a main

---

## ✅ Checklist Final (Antes de Merge a Main)

- [ ] Todos los tests pasan (manual + automatizados)
- [ ] No hay console errors
- [ ] Datos 2026 existentes migrados correctamente
- [ ] Dashboard muestra totales anuales
- [ ] Performance acceptable
- [ ] Code review aprobado
- [ ] Documentación actualizada
- [ ] Firebase configurado a producción
- [ ] Script de migración listo

---

**Última actualización:** 17/07/2026  
**Responsable:** Claude + Joaquin  
**Rama:** feature/multi-year-refactor
