# Finanzas en Orden

App de finanzas personales con React + Firebase. Registra ingresos, controla gastos y visualiza tu historial mes a mes.

## Stack

- React + Vite
- Tailwind CSS v4
- Firebase Auth (email/password + Google)
- Firebase Firestore
- React Router DOM
- Recharts

## Instalación local

```bash
git clone <repo-url>
cd "SISTEMA FINANZAS"
npm install
```

Crea el archivo `.env` con tus credenciales Firebase:

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

## Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activar **Authentication** → Email/Password y Google
3. Activar **Firestore Database**
4. Copiar credenciales a `.env`

### Reglas Firestore

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

## Despliegue en Netlify

1. Conectar repo en [Netlify](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Agregar variables de entorno en Netlify Dashboard
5. El archivo `netlify.toml` ya está configurado para SPA routing

## Estructura

```
src/
├── components/
│   ├── auth/       # ProtectedRoute
│   ├── layout/     # Sidebar, AppLayout
│   ├── onboarding/ # Onboarding flow
│   └── ui/         # Spinner
├── context/        # AuthContext
├── hooks/          # useFinance
├── lib/            # firebase.js, firestore.js
├── pages/          # Login, Register, Dashboard, Gastos, etc.
└── utils/          # format.js, constantes
```
