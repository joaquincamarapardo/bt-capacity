# BT Team Capacity — Aplicación web 2026

Aplicación web completa para la gestión y visualización de la capacidad del equipo BT de DXC Technology.

## 🌐 Acceso
**https://joaquincamarapardo.github.io/bt-capacity/**

Requiere cuenta Google autorizada por el administrador.

---

## 📁 Estructura de archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Login con Google + hub de navegación |
| `firebase-config.js` | Configuración Firebase (no modificar) |
| `planner.html` | Calendario mensual editable en tiempo real |
| `admin.html` | Gestión de altas y bajas · Team Roster |
| `import-excel.html` | Importar Excel a Firebase (solo primera vez) |
| `dashboard.html` | Reportes y dashboards de capacidad |

---

## 🚀 Primeros pasos

### 1. Importar datos del Excel
La primera vez hay que importar el Excel actual a Firebase:
1. Acceder a la app con Google
2. Ir a `import-excel.html`
3. Arrastrar el archivo `Capacity_BT_2026.xlsx`
4. Esperar a que complete la importación (~1 minuto)

A partir de ahí todos los datos se gestionan desde la app web.

### 2. Gestión del equipo
- **Altas** → `admin.html` → pestaña Alta
- **Bajas** → `admin.html` → pestaña Baja
- **Ver Roster** → `admin.html` → pestaña Team Roster

### 3. Actualizar disponibilidad
- Ir a `planner.html`
- Seleccionar el mes
- Hacer clic en cualquier celda y escribir el valor:
  - Número (ej. `8`) → horas disponibles
  - `H` → Festivo
  - `L` → Vacaciones
  - `S` → Baja
  - `T` → Formación
  - `M` → Maternidad
  - `propd` → Jornada flexible
  - `LD` → Libre disposición
  - `HPY` → Vacaciones año anterior
- Los cambios se guardan automáticamente en Firebase

---

## 🔧 Tecnologías

- **Frontend:** HTML + CSS + JavaScript (sin frameworks)
- **Base de datos:** Google Firebase Firestore
- **Autenticación:** Google Firebase Auth
- **Hosting:** GitHub Pages
- **Gráficos:** Chart.js

---

## 🔑 Configuración Firebase

- **Proyecto:** bt-capacity
- **Project ID:** bt-capacity
- **Auth domain:** bt-capacity.firebaseapp.com
- **Región:** europe-west

---

## 👤 Administrador

**Joaquin Camara** · BT Team Lead · DXC Technology  
`joaquin.camara@dxc.com`

Para dar acceso a nuevos usuarios: Firebase Console → Authentication → Users → Add user.
