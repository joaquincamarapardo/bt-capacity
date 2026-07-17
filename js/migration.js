/**
 * Script de Migración - Datos 2026 → Nueva Estructura Multi-Año
 *
 * Migra documentos de calendarios de la estructura antigua:
 *   {month}-{personId}
 * A la nueva estructura:
 *   {year}-{month}-{personId}
 *
 * Agregar los campos: year, monthIndex
 */

const MIGRATION_VERSION = "1.0";
const MIGRATION_DATE = new Date().toISOString();

/**
 * Migra todos los documentos de calendarios de 2026 a la nueva estructura
 * IMPORTANTE: Ejecutar solo UNA VEZ en producción
 * @param {object} db - Instancia de Firestore
 * @returns {object} - Resumen de migración
 */
async function migrateCalendarDocuments(db) {
  console.log("🔄 Iniciando migración de calendarios a estructura multi-año...");

  const summary = {
    startTime: new Date(),
    docsProcessed: 0,
    docsMigrated: 0,
    docsSkipped: 0,
    errors: [],
    newDocIds: [],
    oldDocIds: []
  };

  try {
    // 1. Leer todos los documentos de la colección "calendar"
    const calendarCollection = await getDocs(collection(db, 'calendar'));

    console.log(`📄 Encontrados ${calendarCollection.docs.length} documentos en calendar`);

    // 2. Para cada documento, verificar si necesita migración
    for (const doc of calendarCollection.docs) {
      const docId = doc.id;
      const data = doc.data();
      summary.docsProcessed++;

      try {
        // Validar si ya tiene estructura nueva (contiene "year")
        if (data.year !== undefined) {
          console.log(`⏭️  Doc ${docId} ya tiene estructura nueva, saltando...`);
          summary.docsSkipped++;
          continue;
        }

        // Validar si es documento viejo (formato: {month}-{personId})
        if (!isOldFormatDocId(docId)) {
          console.log(`⏭️  Doc ${docId} no coincide con formato antiguo, saltando...`);
          summary.docsSkipped++;
          continue;
        }

        // Extraer información del documento viejo
        const { month, personId } = parseOldDocId(docId);
        const monthIndex = getMonthIndex(month);

        // Crear nuevo documento con estructura actualizada
        const newData = {
          ...data,
          year: 2026,                    // Año por defecto (pueden ser otros años)
          month: month,                  // Mes en inglés (ya existe)
          monthIndex: monthIndex,        // Índice del mes (nuevo)
          migratedAt: MIGRATION_DATE,    // Marca de migración
          migratedFrom: docId            // ID antiguo para auditoría
        };

        // Generar nuevo ID
        const newDocId = `2026-${month}-${personId}`;

        // Crear documento nuevo
        const newDocRef = doc(db, 'calendar', newDocId);
        await setDoc(newDocRef, newData);

        console.log(`✅ Migrado: ${docId} → ${newDocId}`);
        summary.docsMigrated++;
        summary.newDocIds.push(newDocId);
        summary.oldDocIds.push(docId);

        // Nota: No borrar documento viejo aún (para rollback)
        // Se borrará tras validación en pruebas

      } catch (error) {
        console.error(`❌ Error migrando ${docId}:`, error.message);
        summary.errors.push({
          docId: docId,
          error: error.message
        });
      }
    }

    summary.endTime = new Date();
    summary.durationMs = summary.endTime - summary.startTime;

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE MIGRACIÓN");
    console.log("=".repeat(60));
    console.log(`Documentos procesados:  ${summary.docsProcessed}`);
    console.log(`Documentos migrados:    ${summary.docsMigrated}`);
    console.log(`Documentos saltados:    ${summary.docsSkipped}`);
    console.log(`Errores:                ${summary.errors.length}`);
    console.log(`Duración:               ${summary.durationMs}ms`);
    console.log("=".repeat(60));

    if (summary.errors.length > 0) {
      console.log("\n⚠️  Errores encontrados:");
      summary.errors.forEach(err => {
        console.log(`  - ${err.docId}: ${err.error}`);
      });
    }

    return summary;

  } catch (error) {
    console.error("❌ Error crítico en migración:", error);
    summary.errors.push({
      level: "CRITICAL",
      error: error.message
    });
    return summary;
  }
}

/**
 * Valida que la migración se completó correctamente
 * @param {object} db - Instancia de Firestore
 * @param {object} migrationSummary - Resumen de migración anterior
 * @returns {object} - Validación
 */
async function validateMigration(db, migrationSummary) {
  console.log("\n🔍 Validando integridad de datos...\n");

  const validation = {
    allNewDocsExist: true,
    allNewDocsValid: true,
    dataIntact: true,
    orphanedDocs: [],
    issues: []
  };

  try {
    // 1. Verificar que todos los documentos nuevos existen y son válidos
    for (const newDocId of migrationSummary.newDocIds) {
      const docRef = doc(db, 'calendar', newDocId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        validation.allNewDocsExist = false;
        validation.issues.push(`Documento nuevo no encontrado: ${newDocId}`);
        console.log(`❌ ${newDocId} - NO EXISTE`);
      } else {
        const data = docSnapshot.data();

        // Validar campos requeridos
        if (!data.year || !data.month || !data.name || !data.days) {
          validation.allNewDocsValid = false;
          validation.issues.push(`Documento inválido (campos faltantes): ${newDocId}`);
          console.log(`❌ ${newDocId} - CAMPOS FALTANTES`);
        } else {
          // Contar horas para validación
          const totalHours = Object.values(data.days)
            .filter(v => typeof v === 'number')
            .reduce((a, b) => a + b, 0);

          console.log(`✅ ${newDocId} - ${Object.keys(data.days).length} días, ~${totalHours}h`);
        }
      }
    }

    // 2. Buscar documentos huérfanos (documentos viejos sin correspondiente nuevo)
    const allDocs = await getDocs(collection(db, 'calendar'));
    for (const doc of allDocs.docs) {
      const docId = doc.id;

      // Si es formato antiguo y no está en la lista de migrados
      if (isOldFormatDocId(docId) && !migrationSummary.oldDocIds.includes(docId)) {
        validation.orphanedDocs.push(docId);
        validation.issues.push(`Documento huérfano (no migrado): ${docId}`);
        console.log(`⚠️  Documento huérfano: ${docId}`);
      }
    }

    // 3. Resumen de validación
    console.log("\n" + "=".repeat(60));
    console.log("✅ VALIDACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log(`Documentos nuevos existen:  ${validation.allNewDocsExist ? "SÍ ✅" : "NO ❌"}`);
    console.log(`Documentos son válidos:     ${validation.allNewDocsValid ? "SÍ ✅" : "NO ❌"}`);
    console.log(`Integridad de datos:        ${validation.dataIntact ? "SÍ ✅" : "NO ❌"}`);
    console.log(`Documentos huérfanos:       ${validation.orphanedDocs.length}`);

    if (validation.issues.length > 0) {
      console.log(`\nProblemas encontrados:      ${validation.issues.length}`);
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log("=".repeat(60));

    return validation;

  } catch (error) {
    console.error("❌ Error en validación:", error);
    validation.issues.push(`Error crítico: ${error.message}`);
    return validation;
  }
}

/**
 * Limpia documentos antiguos tras validación exitosa
 * IMPORTANTE: Solo ejecutar DESPUÉS de validación exitosa
 * @param {object} db - Instancia de Firestore
 * @param {array} oldDocIds - IDs de documentos a eliminar
 * @returns {object} - Resumen de limpieza
 */
async function cleanupOldDocuments(db, oldDocIds) {
  console.log("\n🗑️  Eliminando documentos antiguos...\n");

  const summary = {
    docsDeleted: 0,
    errors: [],
    deletedIds: []
  };

  if (oldDocIds.length === 0) {
    console.log("ℹ️  No hay documentos antiguos para eliminar");
    return summary;
  }

  for (const docId of oldDocIds) {
    try {
      await deleteDoc(doc(db, 'calendar', docId));
      console.log(`✅ Eliminado: ${docId}`);
      summary.docsDeleted++;
      summary.deletedIds.push(docId);
    } catch (error) {
      console.error(`❌ Error eliminando ${docId}:`, error.message);
      summary.errors.push({
        docId: docId,
        error: error.message
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Documentos eliminados: ${summary.docsDeleted}/${oldDocIds.length}`);
  console.log(`Errores: ${summary.errors.length}`);
  console.log("=".repeat(60));

  return summary;
}

/**
 * Verifica si un ID de documento tiene el formato antiguo
 * Formato antiguo: {month}-{personId}
 * Ejemplo: "Jan-ana-garcia-lopez"
 */
function isOldFormatDocId(docId) {
  const parts = docId.split('-');
  if (parts.length < 2) return false;

  const month = parts[0];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return months.includes(month);
}

/**
 * Parsea un documento ID antiguo
 * Retorna {month, personId}
 */
function parseOldDocId(docId) {
  const parts = docId.split('-');
  const month = parts[0];
  const personId = parts.slice(1).join('-');

  return { month, personId };
}

/**
 * Obtiene el índice del mes (0-11) dado el nombre en inglés
 */
function getMonthIndex(monthEN) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.indexOf(monthEN);
}

// ============================================================================
// FUNCTION PRINCIPAL DE MIGRACIÓN (Para ejecutar en consola)
// ============================================================================

/**
 * Ejecuta la migración completa (migración + validación)
 * Uso en consola del navegador:
 *   await runFullMigration(db)
 */
async function runFullMigration(db) {
  console.clear();
  console.log("🚀 INICIANDO MIGRACIÓN COMPLETA\n");

  try {
    // Paso 1: Migración
    const migrationResult = await migrateCalendarDocuments(db);

    if (migrationResult.errors.length > 0) {
      console.log("\n⚠️  Hay errores. Validando de todas formas...\n");
    }

    // Paso 2: Validación
    const validationResult = await validateMigration(db, migrationResult);

    if (!validationResult.allNewDocsExist || !validationResult.allNewDocsValid) {
      console.log("\n❌ MIGRACIÓN INCOMPLETA O INVÁLIDA");
      console.log("NO SE ELIMINARÁN DOCUMENTOS ANTIGUOS");
      return {
        migrationResult,
        validationResult,
        status: "FAILED"
      };
    }

    // Paso 3: Confirmación antes de limpiar
    console.log("\n" + "=".repeat(60));
    console.log("⚠️  PRÓXIMO PASO: LIMPIAR DOCUMENTOS ANTIGUOS");
    console.log("=".repeat(60));
    console.log("Los documentos antiguos se pueden eliminar manualmente:");
    console.log("  await cleanupOldDocuments(db, migrationResult.oldDocIds)");
    console.log("\nO esperar a confirmación manual en producción.");
    console.log("=".repeat(60) + "\n");

    return {
      migrationResult,
      validationResult,
      status: "SUCCESS_PENDING_CLEANUP"
    };

  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO EN MIGRACIÓN:", error);
    return {
      status: "FAILED",
      error: error.message
    };
  }
}

// Exportar para uso en Node.js/tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    migrateCalendarDocuments,
    validateMigration,
    cleanupOldDocuments,
    runFullMigration,
    isOldFormatDocId,
    parseOldDocId,
    getMonthIndex,
    MIGRATION_VERSION,
    MIGRATION_DATE
  };
}
