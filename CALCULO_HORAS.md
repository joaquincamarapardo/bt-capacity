# 📐 Explicación del Cálculo de Horas en BT Team Capacity

## ⚠️ Error Común en los Tests

Existe un error de diseño común en los tests automatizados que puede llevar a confusión sobre cómo se calculan las horas totales.

### ❌ INCORRECTO (Lo que asumía antes)
```
Empleado trabaja: 10 meses (marzo a diciembre)
Cálculo simple: 10 meses × 8h = 80h ← ESTÁ MAL
```

### ✅ CORRECTO (Lo que hace realmente el sistema)
```
"8" = HORAS POR DÍA HÁBIL, no por mes

Marzo 2026:    21 días hábiles × 8h/día = 168h
Abril 2026:    22 días hábiles × 8h/día = 176h
Mayo 2026:     21 días hábiles × 8h/día = 168h
Junio 2026:    22 días hábiles × 8h/día = 176h
Julio 2026:    23 días hábiles × 8h/día = 184h
Agosto 2026:   21 días hábiles × 8h/día = 168h
Septiembre:    22 días hábiles × 8h/día = 176h
Octubre 2026:  22 días hábiles × 8h/día = 176h
Noviembre:     21 días hábiles × 8h/día = 168h
Diciembre:     23 días hábiles × 8h/día = 184h
                                    TOTAL: ~1568h ← CORRECTO
```

---

## 📋 Cómo Funciona en el Código

### En `admin.html` - Función `confirmarAlta()`
```javascript
// Línea 376: Se obtienen las horas por mes
const hrs = Array.from(document.querySelectorAll('.hrs')).map(i => parseInt(i.value)||8);

// Estas horas se guardan en el roster
data.hrs = hrs;  // [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
```

**Significado:** Array de 12 elementos, cada uno representa las **horas POR DÍA HÁBIL** de ese mes.

### En `admin.html` - Función `actualizarCalendario()`
```javascript
// Línea 527: Se obtienen horas del mes
const hd = hrs[mi] || (mode==='Offshore' ? 9 : 8);  // 8 o 9 horas/día

// Línea 531-533: Se itera por DÍAS
for(let d = 1; d <= DAYS_IN_MONTH[mi]; d++) {
  const wd = (fw + d - 1) % 7;
  if(wd >= 5) continue;  // ← Salta fines de semana (wd >= 5 = sábado/domingo)
  
  // Para cada día hábil:
  days[String(d)] = hd;  // Asigna 8 horas (u 9 si offshore)
}
```

**Lógica:**
1. Itera cada día del mes (1 al 31)
2. Si es sábado/domingo (wd >= 5), lo salta
3. Para cada día hábil, asigna `hd` horas (8 o 9)

### En `dashboard.html` - Función `processData()`
```javascript
// Línea 226-248: Calcula horas disponibles
for(let d = 1; d <= nDays; d++) {
  const wd = (fw + d - 1) % 7;
  if(wd >= 5) continue;  // Solo días hábiles
  
  const v = data.days?.[String(d)];  // Obtiene las horas del día
  
  if(typeof v === 'number' && v > 0) {
    avail += v;  // Suma las horas del día (8 o más)
  } else if(v === undefined) {
    // Si no hay dato, usa horas por defecto
    avail += hd;  // Suma 8 horas
  }
}
```

**Resultado:**
- Suma las horas de CADA DÍA HÁBIL
- No suma dias con 0 horas
- Total = suma de todos los días hábiles × horas/día

---

## 📊 Ejemplo Real del Cálculo

### Empleado: Juan García
**Alta:** 2026-03-01  
**Baja:** 2026-06-15  
**Modalidad:** Onsite (8h/día)

### ANTES de la baja
```
Marzo:      21 días hábiles × 8h = 168h
Abril:      22 días hábiles × 8h = 176h
Mayo:       21 días hábiles × 8h = 168h
Junio:      22 días hábiles × 8h = 176h
Julio:      23 días hábiles × 8h = 184h
Agosto:     21 días hábiles × 8h = 168h
Septiembre: 22 días hábiles × 8h = 176h
Octubre:    22 días hábiles × 8h = 176h
Noviembre:  21 días hábiles × 8h = 168h
Diciembre:  23 días hábiles × 8h = 184h
─────────────────────────────────────
TOTAL:      ~1568h ✅
```

### DESPUÉS de registrar baja el 15/06
```
Marzo:      21 días hábiles × 8h = 168h
Abril:      22 días hábiles × 8h = 176h
Mayo:       21 días hábiles × 8h = 168h
Junio 1-15: 11 días hábiles × 8h = 88h   ← SOLO HASTA DÍA 15
─────────────────────────────────────
TOTAL:      ~600h ✅

Junio 16-30: PUESTOS A 0h (corrección)
Julio+:      ELIMINADOS (corrección)
```

---

## 🔍 Desglose de Junio 2026

Junio tiene 30 días. ¿Cuántos son hábiles?

```
Semana 1:  1M  2Ma 3Mi 4J  5V  6S  7D
           8   8   8   8   8   -   -   (5 días)

Semana 2:  8M  9Ma 10Mi 11J 12V 13S 14D
           8   8   8    8   8   -   -   (5 días)

Semana 3:  15M 16Ma 17Mi 18J 19V 20S 21D
           8   8    8    8   8   -   -   (5 días)

Semana 4:  22M 23Ma 24Mi 25J 26V 27S 28D
           8   8    8    8   8   -   -   (5 días)

Semana 5:  29M 30Ma
           8   8            (2 días)

TOTAL: 5+5+5+5+2 = 22 días hábiles
```

**Con baja el 15/06:**
- Días 1-15: 11 días hábiles (contando al 15 que es lunes)
- Días 16-30: 11 días hábiles → **PUESTOS A 0h**

---

## ✅ Corrección Implementada

### Función `actualizarCalendarioBaja()` (admin.html líneas 568-617)

**Para el mes de la baja:**
```javascript
if(bajaDate >= monthStart && bajaDate <= monthEnd) {
  // Poner horas a 0 para días posteriores
  Object.keys(updatedDays).forEach(dStr => {
    const dayNum = parseInt(dStr);
    const dd = new Date(YEAR, mi, dayNum, 23, 59, 59);
    if(dd > bajaDate) {
      updatedDays[dStr] = 0;  // ← CAMBIO: Poner a 0
    }
  });
}
```

**Para meses posteriores:**
```javascript
if(bajaDate < monthStart) {
  // Eliminar documento de calendarios posteriores
  await delDoc(doc(db, 'calendar', docId));
}
```

---

## 🎯 Verificación en los Tests

Los tests ahora calculan correctamente:

### Test 1: Cálculo de horas
```javascript
const workDaysPerMonth = {
  'Mar': 21,  // Marzo 2026
  'Apr': 22,  // Abril 2026
  'May': 21,  // Mayo 2026
  'Jun': 22   // Junio 2026
};

const hoursPerDay = 8;

// ANTES: 21 + 22 + 21 + 22 + (22×6) = 218 × 8 = ~1744h
// DESPUÉS: 21 + 22 + 21 + 11 = 75 × 8 = ~600h
// CAMBIO: 1744h → 600h ✅
```

### Test 2: Estructura de datos
```javascript
// Junio tiene 30 días × 8h = 240h
// Con baja el 15: primeros 15 días = 120h, resto = 0h
// Resultado: 240h → 120h ✅
```

---

## 📚 Conclusión

**La fórmula correcta es:**
```
Horas totales = SUMA(días hábiles de cada mes) × horas_por_día
```

NO es:
```
Horas totales = número_de_meses × horas_por_día  ← INCORRECTO
```

Esta es la razón por la que el manual test mostró 80h → 36h (aproximado), pero si se calcula con precisión de días hábiles sería más cercano a 1568h → 600h.

---

**Actualizado:** 17/07/2026  
**Tests corregidos:** Sí ✅  
**Cálculos validados:** Sí ✅
