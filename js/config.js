/**
 * Configuración Centralizada - BT Team Capacity
 * Soporta múltiples años (2026-2030+)
 *
 * Este archivo centraliza todas las constantes y funciones reutilizables
 * para evitar hardcoding de años, meses y cálculos.
 */

// ============================================================================
// CONSTANTES GLOBALES
// ============================================================================

// Rango de años soportados
const YEAR_MIN = 2026;
const YEAR_MAX = 2035;

// Meses en inglés (para identificadores Firestore)
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Meses en español (para UI)
const MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Meses abreviados en español
const MONTH_NAMES_ES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun',
                               'Jul','Ago','Sep','Oct','Nov','Dic'];

// Días en cada mes (enero tiene 31, febrero 28 normalmente, etc.)
// Nota: Febrero se ajusta dinámicamente para años bisiestos
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Códigos de ausencia / eventos especiales
const ABSENCE_CODES = ['H', 'L', 'S', 'T', 'M', 'COM', 'LD', 'HPY', 'EXT', 'F'];

// Mapeo de códigos a nombres
const ABSENCE_NAMES = {
  'H': 'Holiday',
  'L': 'License/Vacation',
  'S': 'Sickness',
  'T': 'Training',
  'M': 'Maternity Leave',
  'COM': 'Compensated',
  'LD': 'Libre Disposición',
  'HPY': 'Holiday Prev. Year',
  'EXT': 'Extra Hours',
  'F': 'Festivity'
};

// Horas por modalidad
const HOURS_BY_MODE = {
  'Onsite': 8,
  'Offshore': 9
};

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Verifica si un año es bisiesto
 * @param {number} year - Año a verificar
 * @returns {boolean}
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Obtiene datos del año (ajusta febrero si es bisiesto)
 * @param {number} year - Año
 * @returns {object}
 */
function getYearData(year) {
  const daysInMonth = [...DAYS_IN_MONTH];

  // Ajustar febrero para años bisiestos
  if (isLeapYear(year)) {
    daysInMonth[1] = 29;
  }

  return {
    year: year,
    isLeapYear: isLeapYear(year),
    daysInMonth: daysInMonth,
    monthNames: MONTH_NAMES_EN,
    monthNamesES: MONTH_NAMES_ES,
    monthNamesESShort: MONTH_NAMES_ES_SHORT
  };
}

/**
 * Calcula los días hábiles (lunes-viernes) en un mes específico
 * @param {number} year - Año
 * @param {number} monthIndex - Índice del mes (0-11)
 * @returns {number}
 */
function calculateWorkDaysInMonth(year, monthIndex) {
  const yearData = getYearData(year);
  const daysInMonth = yearData.daysInMonth[monthIndex];

  // Primer día del mes (0=lunes, 1=martes, ..., 6=domingo)
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  let workDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (firstDay + d - 1) % 7;
    // Si es lunes-viernes (0-4), cuenta como día hábil
    if (dayOfWeek < 5) {
      workDays++;
    }
  }

  return workDays;
}

/**
 * Genera el ID de documento en Firestore para calendarios
 * @param {number} year - Año
 * @param {string} monthEN - Mes en inglés (Jan, Feb, etc.)
 * @param {string} personId - ID de la persona
 * @returns {string} ID del documento
 */
function getCalendarDocId(year, monthEN, personId) {
  return `${year}-${monthEN}-${personId}`;
}

/**
 * Obtiene el mes en inglés dado el índice
 * @param {number} monthIndex - Índice (0-11)
 * @returns {string}
 */
function getMonthNameEN(monthIndex) {
  return MONTH_NAMES_EN[monthIndex];
}

/**
 * Obtiene el mes en español dado el índice
 * @param {number} monthIndex - Índice (0-11)
 * @returns {string}
 */
function getMonthNameES(monthIndex) {
  return MONTH_NAMES_ES[monthIndex];
}

/**
 * Obtiene el mes abreviado en español
 * @param {number} monthIndex - Índice (0-11)
 * @returns {string}
 */
function getMonthNameESShort(monthIndex) {
  return MONTH_NAMES_ES_SHORT[monthIndex];
}

/**
 * Obtiene las horas por día según la modalidad
 * @param {string} mode - Modalidad (Onsite/Offshore)
 * @returns {number}
 */
function getHoursPerDay(mode) {
  return HOURS_BY_MODE[mode] || 8; // Default 8 si no se especifica
}

/**
 * Valida que un año esté en el rango permitido
 * @param {number} year - Año a validar
 * @returns {boolean}
 */
function isYearValid(year) {
  return year >= YEAR_MIN && year <= YEAR_MAX;
}

/**
 * Obtiene el año actual, validando rango permitido
 * Si el año actual está fuera del rango, retorna YEAR_MIN
 * @returns {number}
 */
function getCurrentValidYear() {
  const currentYear = new Date().getFullYear();
  return isYearValid(currentYear) ? currentYear : YEAR_MIN;
}

/**
 * Calcula el número de días hábiles entre dos fechas
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {number}
 */
function calculateWorkDaysBetween(startDate, endDate) {
  let workDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Si es lunes-viernes (1-5 en JS, donde 0=domingo)
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      workDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workDays;
}

/**
 * Obtiene lista de años disponibles
 * @returns {array}
 */
function getAvailableYears() {
  const years = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Calcula horas totales para una persona en un año
 * (Usado en dashboards para mostrar totales anuales)
 *
 * @param {object} person - Objeto de persona
 * @param {number} year - Año
 * @param {object} calendars - Mapa de calendarios del Firestore
 * @returns {number}
 */
function calculateAnnualHours(person, year, calendars) {
  let totalHours = 0;
  const yearData = getYearData(year);

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthName = MONTH_NAMES_EN[monthIndex];
    const docId = getCalendarDocId(year, monthName, person.id);
    const calendar = calendars[docId];

    if (calendar && calendar.days) {
      // Sumar horas de todos los días del mes
      for (const dayKey in calendar.days) {
        const dayValue = calendar.days[dayKey];

        // Si es un número, sumar
        if (typeof dayValue === 'number') {
          totalHours += dayValue;
        }
        // Si es un objeto con type EXT, sumar las horas extras
        else if (typeof dayValue === 'object' && dayValue.type === 'EXT') {
          totalHours += dayValue.hours || 0;
        }
        // Si es string (código de ausencia), ignorar (0 horas)
      }
    }
  }

  return totalHours;
}

/**
 * Obtiene estadísticas anuales para un equipo
 * @param {string} teamName - Nombre del equipo
 * @param {number} year - Año
 * @param {array} people - Array de personas
 * @param {object} calendars - Mapa de calendarios
 * @returns {object}
 */
function getTeamAnnualStats(teamName, year, people, calendars) {
  const teamPeople = people.filter(p => p.team === teamName);

  return {
    team: teamName,
    year: year,
    memberCount: teamPeople.length,
    totalHours: teamPeople.reduce((sum, person) => {
      return sum + calculateAnnualHours(person, year, calendars);
    }, 0),
    people: teamPeople
  };
}

// ============================================================================
// EXPORTAR (para uso en otros archivos)
// ============================================================================

// Si está en Node.js/CommonJS (para tests):
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    YEAR_MIN, YEAR_MAX,
    MONTH_NAMES_EN, MONTH_NAMES_ES, MONTH_NAMES_ES_SHORT,
    DAYS_IN_MONTH, ABSENCE_CODES, ABSENCE_NAMES, HOURS_BY_MODE,
    isLeapYear, getYearData, calculateWorkDaysInMonth,
    getCalendarDocId, getMonthNameEN, getMonthNameES, getMonthNameESShort,
    getHoursPerDay, isYearValid, getCurrentValidYear,
    calculateWorkDaysBetween, getAvailableYears,
    calculateAnnualHours, getTeamAnnualStats
  };
}
