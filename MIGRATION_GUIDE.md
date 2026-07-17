# 📦 Guía de Migración - Datos 2026 a Estructura Multi-Año

**Versión:** 1.0  
**Fecha:** 17/07/2026  
**Ambiente:** Firebase Producción  
**Estado:** 🟡 Pendiente Ejecución

---

## 📋 Resumen

Esta guía describe cómo migrar los datos existentes de calendarios de la estructura antigua:
```
{month}-{personId}          Ejemplo: "Jan-ana-garcia-lopez"
```

A la nueva estructura multi-año:
```
{year}-{month}-{personId}   Ejemplo: "2026-Jan-ana-garcia-lopez"
```

---

## ⚠️ ANTES DE EMPEZAR

### Requisitos
- [ ] ✅ Proyecto Firebase con acceso de admin
- [ ] ✅ Branch `feature/multi-year-refactor` mergeada a `main`
- [ ] ✅ Código nuevo desplegado en producción
- [ ] ✅ Backup de Firestore creado (opcional pero recomendado)
- [ ] ✅ Ventana de mantenimiento comunicada a usuarios (30 min)

### Backup (OPCIONAL pero RECOMENDADO)

En Firebase Console → Firestore → Backups:
1. Click en "Create Backup"
2. Seleccionar colección `calendar` (o toda la base de datos)
3. Esperar a que complete
4. **Copiar el nombre del backup para referencia**

---

## 🚀 Pasos de Migración

### PASO 1: Acceder a Firebase Console

1. Ir a https://console.firebase.google.com
2. Seleccionar proyecto `bt-capacity`
3. Ir a Firestore Database
4. Click en "Console" (en la esquina superior derecha)

### PASO 2: Preparación (Sin ejecutar todavía)

En la consola del navegador (F12 → Console):

```javascript
// Importar funciones de migración
// Asegúrate que config.js y migration.js están cargados

// Ver documentos actuales (estructura antigua)
db.collection('calendar').limit(5).get().then(snap => {
  console.log('Documentos actuales:');
  snap.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });
});
```

**Resultado esperado:** Verás documentos con IDs como `Jan-ana-garcia-lopez` sin campo `year`.

### PASO 3: Ejecutar Migración

En la **misma consola**:

```javascript
// EJECUTAR LA MIGRACIÓN COMPLETA
const resultado = await runFullMigration(db);
console.log('Resultado:', resultado);
```

**Esto ejecutará:**
1. Migración de todos los documentos
2. Validación automática
3. Reporte detallado

**Tiempo esperado:** 2-5 minutos (según cantidad de documentos)

### PASO 4: Revisar Resultado

El resultado contiene:
```javascript
{
  migrationResult: {
    docsProcessed: 120,    // Total procesados
    docsMigrated: 120,     // Migrados exitosamente
    docsSkipped: 0,        // Ya estaban migrados
    errors: [],            // Errores encontrados
    newDocIds: [...],      // Nuevos IDs creados
    oldDocIds: [...]       // IDs antiguos
  },
  validationResult: {
    allNewDocsExist: true,
    allNewDocsValid: true,
    orphanedDocs: [],
    issues: []
  },
  status: "SUCCESS_PENDING_CLEANUP"
}
```

### PASO 5: Verificación Manual (IMPORTANTE)

Antes de limpiar documentos antiguos, **verificar manualmente:**

1. **En Firestore Console:**
   - Ir a Firestore Database
   - Colección `calendar`
   - Buscar documentos nuevos (formato `2026-Jan-...`)
   - Verificar que contienen `year: 2026`

2. **En la aplicación:**
   - Abrir Dashboard
   - Verificar que siguen mostrando datos correctamente
   - Verificar totales anuales
   - Crear un nuevo empleado (2026) y verificar

3. **En la consola:**
   ```javascript
   // Contar documentos nuevos
   db.collection('calendar')
     .where('year', '==', 2026)
     .get()
     .then(snap => console.log('Docs nuevos:', snap.size));
   
   // Verificar integridad (debería ser 0 si todo está bien)
   db.collection('calendar')
     .where('year', '==', undefined)
     .get()
     .then(snap => console.log('Docs sin year:', snap.size));
   ```

### PASO 6: Limpiar Documentos Antiguos

**SOLO después de:**
- ✅ Migración completada sin errores
- ✅ Validación pasada
- ✅ Verificación manual OK
- ✅ Testing en la app OK

En la consola:

```javascript
// LIMPIAR DOCUMENTOS ANTIGUOS
const cleanupResult = await cleanupOldDocuments(db, resultado.migrationResult.oldDocIds);
console.log('Limpieza completada:', cleanupResult);
```

**Tiempo esperado:** 1-2 minutos

### PASO 7: Validación Final

```javascript
// Verificar que NO hay documentos con estructura antigua
db.collection('calendar')
  .where('year', '==', undefined)
  .get()
  .then(snap => {
    if (snap.size === 0) {
      console.log('✅ MIGRACIÓN COMPLETA Y LIMPIA');
    } else {
      console.log('⚠️ AÚN HAY', snap.size, 'docs sin year');
    }
  });
```

---

## 🔄 Rollback (Si algo falla)

### Opción 1: Desde Backup (Mejor)

Si tienes backup:
1. Firebase Console → Backups
2. Click en el backup creado
3. Click "Restore"
4. Seleccionar colección `calendar`
5. Esperar a que complete (2-10 minutos)

### Opción 2: Manual (Si no hay backup)

Eliminar los documentos **nuevos** creados:

```javascript
// ELIMINAR DOCUMENTOS NUEVOS (CUIDADO!)
const docIdsToDelete = resultado.migrationResult.newDocIds;

let deleted = 0;
for (const docId of docIdsToDelete) {
  await db.collection('calendar').doc(docId).delete();
  deleted++;
  if (deleted % 10 === 0) console.log(`Eliminados ${deleted}/${docIdsToDelete.length}`);
}
console.log('Rollback completado');
```

---

## ✅ Checklist de Migración

### Antes de empezar
- [ ] ✅ Backup de Firestore (opcional pero recomendado)
- [ ] ✅ Código nuevo desplegado
- [ ] ✅ Nadie está usando la app (ventana de mantenimiento)
- [ ] ✅ Tener `config.js` y `migration.js` disponibles

### Durante migración
- [ ] ✅ Ejecutar `runFullMigration(db)`
- [ ] ✅ Revisar resultado (sin errores)
- [ ] ✅ Validación automática pasada
- [ ] ✅ Verificación manual en la app

### Limpieza
- [ ] ✅ Ejecutar `cleanupOldDocuments(db, ...)`
- [ ] ✅ Validación final sin documentos antiguos
- [ ] ✅ Testing final en la app

### Completado
- [ ] ✅ Documentar hora de migración
- [ ] ✅ Comunicar a usuarios que está completo
- [ ] ✅ Actualizar documentación interna

---

## 📊 Comandos Útiles

### Contar documentos por estructura

```javascript
// Docs estructura nueva
db.collection('calendar')
  .where('year', '==', 2026)
  .get()
  .then(s => console.log('Nuevos (2026):', s.size));

// Docs estructura antigua
db.collection('calendar')
  .where('year', '==', undefined)
  .get()
  .then(s => console.log('Antiguos:', s.size));

// Total general
db.collection('calendar')
  .get()
  .then(s => console.log('Total:', s.size));
```

### Ver documentos específicos

```javascript
// Ver primeros 5 docs antiguos
db.collection('calendar')
  .where('year', '==', undefined)
  .limit(5)
  .get()
  .then(snap => {
    snap.docs.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  });

// Ver primeros 5 docs nuevos
db.collection('calendar')
  .where('year', '==', 2026)
  .limit(5)
  .get()
  .then(snap => {
    snap.docs.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  });
```

### Buscar errores

```javascript
// Docs sin field 'name' (corrupted)
db.collection('calendar')
  .where('name', '==', undefined)
  .get()
  .then(s => console.log('Docs sin name:', s.size));

// Docs sin field 'days'
db.collection('calendar')
  .where('days', '==', undefined)
  .get()
  .then(s => console.log('Docs sin days:', s.size));
```

---

## ⏱️ Timeline Estimado

| Paso | Duración | Actividad |
|------|----------|-----------|
| Preparación | 5 min | Hacer backup, verificar | Paso 1-2 |
| Migración | 2-5 min | Ejecutar `runFullMigration` | Paso 3 |
| Validación | 5 min | Revisar resultado y verificar | Paso 4-5 |
| Limpieza | 1-2 min | Ejecutar `cleanupOldDocuments` | Paso 6 |
| Validación Final | 5 min | Verificar que todo está limpio | Paso 7 |
| **TOTAL** | **15-30 min** | Ventana de mantenimiento recomendada |

---

## 🆘 Problemas Comunes

### Error: "Documento no encontrado"
```
❌ Error migrando Jan-ana-garcia-lopez: Document does not exist
```
**Solución:** El documento fue eliminado antes de migrar. Ignorar, es normal.

### Error: "Permission denied"
```
❌ Error migrando Jan-ana-garcia-lopez: Missing or insufficient permissions
```
**Solución:** Verificar que tienes acceso de admin a Firebase Console.

### Validación falla: "Documentos huérfanos"
```
⚠️ Documento huérfano: Jan-ana-garcia-lopez
```
**Solución:** Documentos que no se migraron. Revisar por qué, posible rollback.

### La app sigue viendo documentos antiguos
**Solución:** Cache del navegador. Hacer hardrefresh (Ctrl+Shift+R).

---

## 📞 Contacto / Soporte

Si hay problemas durante la migración:
1. **Detener inmediatamente** (no continuar con pasos posteriores)
2. **Hacer rollback** desde backup o manualmente
3. **Documentar el error** en el archivo de log
4. **Contactar** al equipo de desarrollo

---

## 📝 Log de Migración

**Fecha de ejecución:** ___________  
**Ejecutado por:** ___________  
**Resultado:** [ ] Exitoso [ ] Fallido [ ] Con errores

**Documentos procesados:** ___________  
**Documentos migrados:** ___________  
**Documentos antiguos limpiados:** ___________  

**Observaciones:**
```
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________
```

**Hora de finalización:** ___________  
**Tiempo total:** ___________  
**Comunicado a usuarios:** [ ] Sí [ ] No  

---

**Versión:** 1.0  
**Última actualización:** 17/07/2026  
**Estado:** 🟡 Pendiente ejecución
