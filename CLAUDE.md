# CLAUDE.md

## Proyecto
Nombre: Finanzas en Orden

Objetivo:
Construir una webapp moderna, profesional y completamente funcional de finanzas personales donde cada usuario pueda registrar ingresos, dividir su dinero en diferentes cuentas, controlar gastos, ver historial mes a mes y guardar toda la información en Firebase.

La aplicación NO debe ser una maqueta.
Debe ser una aplicación real, funcional, responsive y lista para producción.

---

# IMPORTANTE — OPTIMIZACIÓN DE TOKENS Y RESPUESTAS

Durante todo el desarrollo del proyecto:

- NO gastar tokens innecesarios.
- NO dar explicaciones largas.
- NO repetir información.
- NO generar documentación excesiva dentro del chat.
- Responder de manera corta, técnica y eficiente.
- Priorizar ejecutar y construir antes que explicar.

## Documentación

Toda la documentación debe ir:
- dentro del proyecto
- en README.md
- comentarios importantes del código
- documentación técnica en GitHub

NO explicar grandes bloques de texto en el chat.

## Desarrollo

Quiero:
- más ejecución
- menos explicación
- menos texto innecesario
- menos consumo de créditos/tokens

## Código

Prioridades:
1. Código funcional
2. Arquitectura limpia
3. Bajo consumo de Firebase
4. Bajo consumo de tokens
5. Escalabilidad
6. Seguridad

## Firebase

Optimizar al máximo:
- lecturas
- escrituras
- listeners
- consultas repetidas

Evitar:
- renders innecesarios
- múltiples requests iguales
- estructuras costosas

## Chat

Cuando termines tareas:
- responde corto
- solo indicar lo importante
- evitar explicaciones innecesarias

## GitHub

Subir:
- README.md completo
- estructura profesional
- instrucciones claras y cortas
- variables de entorno
- deployment Netlify
- configuración Firebase

La mayor parte de la documentación debe quedar en GitHub y no en el chat.

---

# Stack obligatorio

- React + Vite
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore
- React Router DOM
- Recharts para gráficas
- React Hook Form o formularios optimizados
- Firebase Rules seguras
- Preparado para Netlify
- Código limpio, modular y escalable

---

# Regla principal

Toda la información financiera debe guardarse en Firebase Firestore.

NO usar LocalStorage para:
- usuarios
- ingresos
- gastos
- historial
- presupuestos
- ahorro
- configuraciones financieras

LocalStorage solo puede usarse opcionalmente para:
- tema oscuro/claro
- preferencias visuales

---

# Autenticación

La app debe tener:

## Registro tradicional
- correo
- contraseña
- confirmación de contraseña

## Inicio de sesión
- login con correo y contraseña

## Login con Google

Agregar inicio de sesión con Google usando Firebase Authentication.

La app debe permitir dos métodos de acceso:
1. Correo y contraseña
2. Cuenta de Google

Requisitos:
- Botón “Continuar con Google”
- Crear usuario automáticamente en Firestore si es la primera vez
- No duplicar usuarios
- Actualizar información básica al volver a iniciar sesión

Guardar en:

users/{uid}
- name
- email
- photoURL
- provider
- role
- supportAccess
- isActive
- hasCompletedOnboarding
- createdAt
- updatedAt

provider:
- google
- email

## Sesión
- persistencia de sesión
- cerrar sesión

## Seguridad
- rutas protegidas
- cada usuario solo puede acceder a sus datos

---

# Roles y permisos

La app debe tener sistema de roles.

## Roles

### user
Puede:
- crear
- leer
- editar
- eliminar

Solo sus propios datos.

### admin
Puede:
- ver usuarios registrados
- ver métricas generales
- desactivar usuarios
- administrar la plataforma

NO puede ver información financiera privada detallada de usuarios normales.

### support
Puede:
- acceder a datos de un usuario SOLO si:
  supportAccess == true

---

# Flujo inicial obligatorio (Onboarding)

Cuando el usuario inicie sesión por primera vez, debe aparecer un onboarding financiero.

Objetivo:
Permitir que el usuario configure desde el inicio:
- ingreso mensual
- gastos base
- distribución del dinero
- ahorro inicial

## Flujo

1. Usuario crea cuenta o inicia sesión.
2. La app revisa:
   hasCompletedOnboarding
3. Si es false:
   mostrar onboarding.
4. Si es true:
   enviar al dashboard.

---

# Configuración inicial de gastos

El usuario debe poder definir desde el inicio cuáles son sus gastos recurrentes.

Mostrar lista precargada editable:

- Arriendo
- Agua
- Luz
- Gas
- Internet
- Celular
- Transporte
- Alimentación
- Deudas
- Suscripciones
- Aseo personal
- Insumos hogar
- Otros

Cada gasto debe poder:
- editar nombre
- editar valor
- editar categoría
- editar tipo de cuenta
- activar/desactivar
- eliminar
- agregar nuevos gastos

Tipos de cuenta:
- gastos fijos
- ahorro
- gasto diario

---

# Sección: Mis gastos base

El usuario debe tener una sección permanente llamada:

“Mis gastos base”

Objetivo:
Editar los gastos recurrentes que normalmente usa cada mes.

Funciones:
- editar
- eliminar
- activar/desactivar
- crear nuevos gastos base

---

# Sistema principal de finanzas

La app debe manejar 3 cuentas principales:

## A. Cuenta de gastos fijos
Ejemplos:
- arriendo
- agua
- luz
- gas
- internet
- celular
- transporte fijo
- deudas
- servicios

## B. Cuenta de ahorro
Ejemplos:
- fondo de emergencia
- metas
- ahorro general
- pago de deudas

## C. Cuenta de gasto diario
Ejemplos:
- alimentación
- salidas
- hogar
- aseo
- compras pequeñas
- ocio

---

# Dashboard principal

Mostrar:
- ingreso mensual
- dinero disponible
- total gastado
- ahorro acumulado
- saldo disponible
- porcentaje de ahorro
- porcentaje de gasto
- alertas financieras
- gráficas
- comparación mensual

---

# Formulario 1: ingreso mensual

Campos:
- mes
- año
- ingreso mensual
- observaciones opcionales

Funciones:
- crear ingreso mensual
- editar ingreso mensual
- validar valores positivos
- evitar duplicados del mismo mes

---

# Formulario 2: distribución del ingreso

El usuario debe poder dividir el dinero en:

- gastos fijos
- ahorro
- gasto diario

Campos:
- mes
- año
- monto gastos fijos
- monto ahorro
- monto gasto diario

Validaciones:
- la suma no puede superar el ingreso
- mostrar dinero restante sin asignar

Funciones:
- editar distribución
- guardar historial por mes

---

# Formulario 3: registro de gastos

Campos:
- fecha
- nombre del gasto
- valor
- categoría
- cuenta utilizada:
  - gastos fijos
  - ahorro
  - gasto diario
- tipo:
  - fijo
  - variable
  - deuda
  - ahorro
- método de pago
- observaciones

Funciones:
- crear gasto
- editar gasto
- eliminar gasto
- filtrar por mes
- filtrar por categoría
- filtrar por cuenta
- búsqueda de gastos

---

# Alertas automáticas

Mostrar alertas visuales cuando:

- gastos > 90% del ingreso
- ahorro < 10%
- gasto diario supera presupuesto
- gastos fijos superan presupuesto
- no existe ingreso registrado
- hay dinero libre para ahorrar

---

# Historial mensual

Crear sección de historial.

Mostrar:
- mes
- ingreso
- total gastado
- total ahorrado
- saldo final
- porcentaje de ahorro
- gastos del mes
- comparación entre meses

Debe existir:
- selector de mes
- selector de año

---

# Gráficas

Usar Recharts.

Mostrar:
- distribución de gastos
- ingreso vs gasto
- ahorro mensual
- evolución financiera
- porcentaje por categorías

---

# Diseño

El diseño debe ser:
- moderno
- minimalista
- limpio
- responsive
- profesional
- muy fácil de usar

Colores:
- negro
- blanco
- verde financiero
- azul suave

Usar:
- cards
- tablas limpias
- sombras suaves
- bordes redondeados
- animaciones ligeras

La app debe verse como un SaaS moderno de finanzas personales.

---

# Firebase

## Authentication
Usar Firebase Auth.

Métodos:
- Email/password
- Google provider

## Firestore
Toda la información debe guardarse en Firestore.

---

# Estructura Firestore

users/{uid}
  name
  email
  photoURL
  provider
  role
  supportAccess
  isActive
  hasCompletedOnboarding
  createdAt
  updatedAt

users/{uid}/initialSetup/defaultExpenses/{expenseId}
  name
  amount
  category
  accountType
  expenseType
  isActive
  isRecurring
  createdAt
  updatedAt

users/{uid}/monthlyIncome/{monthId}
  month
  year
  income
  notes
  createdAt
  updatedAt

users/{uid}/monthlyBudgets/{monthId}
  month
  year
  fixedExpensesBudget
  savingsBudget
  dailySpendingBudget
  unassignedMoney
  createdAt
  updatedAt

users/{uid}/transactions/{transactionId}
  date
  month
  year
  name
  amount
  category
  accountType
  expenseType
  paymentMethod
  notes
  createdAt
  updatedAt

users/{uid}/monthlySummaries/{monthId}
  month
  year
  income
  totalSpent
  totalSaved
  availableMoney
  savingsRate
  fixedExpensesSpent
  dailySpent
  createdAt
  updatedAt

admin/stats
  totalUsers
  activeUsers
  totalTransactions
  updatedAt

---

# Reglas Firestore

Crear reglas seguras.

Objetivos:
- users solo acceden a sus datos
- admin administra usuarios
- support accede solo con autorización

Usar reglas similares a:

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {

      allow read, write:
      if request.auth != null
      && request.auth.uid == userId;

      match /{document=**} {
        allow read, write:
        if request.auth != null
        && request.auth.uid == userId;
      }
    }
  }
}

---

# Panel Admin

Crear panel admin separado.

Debe mostrar:
- usuarios registrados
- usuarios activos
- métricas generales
- actividad reciente

Funciones:
- desactivar usuarios
- cambiar roles
- ver estadísticas generales

NO mostrar datos financieros sensibles.

---

# Datos de ejemplo

Precargar ejemplo opcional:

Ingreso:
3000000

Gastos:
- Arriendo: 700000
- Agua: 50000
- Luz: 50000
- Gas: 20000
- Internet: 55000
- Celular: 47000
- Transporte: 180000
- Alimentación: 800000
- Cuota abuelo: 20000
- Addi: 158000
- Spotify: 10000
- Google Play: 10000
- Aseo personal: 200000
- Insumos hogar: 200000

---

# Optimización Firebase

La aplicación debe estar optimizada para reducir costos de Firebase.

Evitar:
- lecturas innecesarias
- consultas repetidas
- renders innecesarios
- listeners excesivos

Usar:
- consultas eficientes
- caché controlado
- paginación si es necesaria
- estructura optimizada de documentos

---

# Requisitos técnicos

La aplicación debe:
- tener estructura limpia
- usar componentes reutilizables
- separar lógica de Firebase
- manejar loading states
- manejar errores
- validar formularios
- evitar valores negativos
- formatear moneda COP
- usar variables de entorno
- usar código modular
- evitar lógica duplicada

---

# Variables .env

Crear:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

---

# README.md

Crear README completo con:
- instalación
- configuración Firebase
- variables de entorno
- cómo correr localmente
- despliegue en Netlify
- estructura del proyecto

---

# .gitignore

Crear .gitignore correcto para:
- node_modules
- .env
- dist
- archivos temporales

---

# GitHub

Subir el proyecto completo a GitHub.

Entregar:
- estructura profesional
- commits organizados
- proyecto listo para clonar

---

# Netlify

Dejar listo para desplegar en Netlify.

Incluir:
- configuración build
- instrucciones deployment
- manejo de rutas SPA

---

# Objetivo final

La app debe sentirse:
- profesional
- rápida
- moderna
- segura
- seria
- escalable

Debe parecer una startup real de finanzas personales.

---

# Muy importante

NO hacer una maqueta.

Debe ser:
- funcional
- persistente
- conectada a Firebase
- con autenticación real
- con Firestore real
- con dashboard funcional
- con historial real
- con CRUD completo
- con login Google
- con panel admin
- con roles
- lista para producción

Antes de programar:
1. Revisar arquitectura
2. Mejorar estructura si hace falta
3. Optimizar seguridad
4. Optimizar rendimiento
5. Optimizar costos Firebase
6. Luego implementar la mejor versión completa