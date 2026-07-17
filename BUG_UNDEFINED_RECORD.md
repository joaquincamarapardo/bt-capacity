# 🐛 Bug Corregido: Registro "undefined" en Dashboard

## 🔴 El Problema

En el dashboard aparecía un registro fantasma llamado **"undefined"** al final de la tabla "Tabla por persona", contabilizando aproximadamente **165 horas**.

```
Persona    | Modo | Equipo | H disp. | H aus. | % disp.
-----------|------|--------|---------|--------|--------
...
undefined  | ?    | BT     | 165h    | 0h     | 100%  ← PROBLEMA
```

## 🔍 Causa Raíz

El código en `dashboard.html` línea 215 obtenía el nombre de los documentos de calendario sin validar:

```javascript
const name = data.name;  // ← Si data.name es undefined, 'name' es undefined

if(!people[name]) people[name] = { ... };  // ← Crea people["undefined"]
```

**¿De dónde venían los registros sin nombre?**

Posibles causas:
1. Documentos huérfanos en Firestore (calendarios sin roster correspondiente)
2. Registros incompletos con campo `name` faltante
3. Sincronización fallida entre colecciones

## ✅ La Solución

Se agregaron dos validaciones:

### 1. En `processData()` (línea 216)
```javascript
// Validar que existe un nombre válido — omitir registros sin nombre
if(!name || typeof name !== 'string' || name.trim() === '') return;
```

**Efecto:** Si un documento de calendario no tiene un nombre válido, se omite completamente (no se procesa).

### 2. En `filterOvTable()` (línea 358)
```javascript
const f = STATE.people.filter(
  p => p.name &&  // ← Validación defensiva
  (!mode || p.mode === mode) && 
  (!name || p.name.toLowerCase().includes(name))
).sort((a,b) => b.avail - a.avail);
```

**Efecto:** Incluso si `undefined` llegara a `STATE.people`, se filtraría antes de renderizar.

## 📊 Resultado

| Estado | Antes | Después |
|--------|-------|---------|
| Registros fantasma | 1 (undefined) | 0 ✅ |
| Horas fantasma | ~165h | 0h ✅ |
| Total de personas | N+1 | N ✅ |

## 🔧 Cómo Evitar Esto en el Futuro

Cuando se creen registros de calendario via `actualizarCalendario()`:
- ✅ SIEMPRE incluir el campo `name` con un valor válido
- ✅ VALIDAR que el nombre no sea vacío
- ✅ LOGUEAR si se omite un registro por falta de nombre (para debugging)

**Ejemplo correcto en admin.html (línea 559):**
```javascript
promises.push(setDoc(doc(db, 'calendar', docId), { 
  name: nombre,      // ← SIEMPRE presente
  team,
  days: mergedDays
}));
```

## 🧪 Testing

Para verificar que se fijó:
1. Ve a Dashboard
2. Busca en la tabla "Tabla por persona"
3. No debería haber ningún registro con nombre "undefined"
4. El total de horas no debería incluir las ~165h fantasmas

## 📝 Detalles Técnicos

**Líneas modificadas:**
- dashboard.html:216-218 - Validación de nombre antes de procesar
- dashboard.html:358 - Filtro defensivo adicional

**Commits:**
- `c810bf1` - Fix: Remove undefined records from dashboard people list

---

**Resuelto:** 17/07/2026  
**Causa:** Calendarios huérfanos o incompletos en Firestore  
**Impacto:** Eliminado phantom record con ~165h  
**Prevención:** Validación agregada en processData
