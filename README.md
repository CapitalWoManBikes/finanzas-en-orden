# Finanzas en Orden

App de finanzas personales — React + Firebase. Control de ingresos, gastos y presupuesto diario.

## Versiones

| Tag | Descripción |
|-----|-------------|
| `v1.0.0` | Versión estable — sistema fo/ migrado completo, presupuesto diario |

## Stack

- React 19 + Vite
- Tailwind CSS v4 (`@import "tailwindcss"`, sin config.js)
- Firebase Auth (email/password + Google)
- Firebase Firestore
- React Router DOM v7
- Recharts

## Sistema de diseño

Componentes propios en `src/components/fo/`:
- `base.jsx` — Card, Button, Input, Chip, KPI, ProgressBar, Money, SectionHeader
- `layout.jsx` — Sidebar, MobileHeader, MobileTabBar, AppShell, Logo, Ico
- `index.js` — re-exports

Tokens CSS en `src/styles/tokens.css`. Tema oscuro activado con clase `.fo-app` en `<body>`.

## Instalación

```bash
git clone <repo-url>
cd "SISTEMA FINANZAS"
npm install
```

Crear `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
npm run dev
```

## Estructura

```
src/
├── components/
│   ├── fo/            # Sistema de diseño (base.jsx, layout.jsx, index.js)
│   ├── dashboard/     # DailyWidget
│   ├── onboarding/    # Flujo inicial
│   ├── layout/        # AppLayout
│   ├── auth/          # ProtectedRoute
│   └── ui/            # Spinner
├── context/           # AuthContext
├── hooks/             # useFinance
├── lib/               # firebase.js, firestore.js
├── pages/             # Login, Register, Dashboard, Gastos, Ingresos, etc.
├── styles/            # tokens.css
└── utils/             # format.js, dailyBudget.js
```

## Firebase

1. Crear proyecto en Firebase Console
2. Activar Authentication → Email/Password + Google
3. Activar Firestore Database
4. Copiar credenciales al `.env`

### Estructura Firestore

```
users/{uid}
  └── initialSetup/defaultExpenses/{id}
  └── monthlyIncome/{monthId}
  └── monthlyBudgets/{monthId}
  └── transactions/{id}
  └── monthlySummaries/{monthId}
```

### Reglas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Despliegue Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- `netlify.toml` ya configurado para SPA routing
- Agregar variables `.env` en Netlify Dashboard

## Funcionalidades v1.0

- Autenticación email/password + Google
- Onboarding financiero (ingreso → gastos base → distribución)
- Dashboard con KPIs, gráfica y alertas automáticas
- Presupuesto diario con estado visual (verde/amarillo/rojo)
- Configuración modalidad de pago (mensual / quincenal)
- CRUD completo de gastos con filtros
- Registro de ingresos por mes/año
- Gastos base reutilizables agrupados por cuenta
- Historial mensual con gráfica de evolución (AreaChart)
