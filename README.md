# Daxsp TV — Web de venta del curso

Plataforma para vender un curso online: video de entrada, página de venta, registro con Google, pago por **transferencia** (con comprobante) o **tarjeta/PayPal**, panel de administración y área del alumno con los archivos del curso.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Firebase (Authentication, Firestore, Storage, Admin SDK) · PayPal · Resend · Vercel.

---

## Cómo funciona

1. El visitante ve el **video de entrada** (o pulsa «Entrar») y llega a la página de venta.
2. Se **registra con Google**. Sin cuenta de Google no puede pagar.
3. En el **checkout** elige:
   - **Transferencia:** ve tus cuentas bancarias, sube hasta 3 fotos del comprobante → su compra queda **pendiente**.
   - **Tarjeta/PayPal:** pago verificado en el servidor → **aprobado** al instante.
4. En **Mi cuenta** ve el estado de su compra (Registrado → Pago enviado → En revisión → Aprobado/Rechazado).
5. Cuando un administrador **aprueba** el pago, en *Mi cuenta* se desbloquea **«Tu curso»** (guía, kit, plantillas, videos). Los archivos se entregan con enlaces que caducan en 15 minutos.

## Panel de administración (`/admin`)

- **Pedidos:** ver comprobantes, aprobar o rechazar (con motivo), avisar por WhatsApp.
- **Precios:** precio con tarjeta (US$), por transferencia (RD$), precio tachado y **oferta con cronómetro**.
- **Cuentas:** cuentas bancarias que ven los clientes (añadir, editar, ocultar, ordenar).
- **Admins:** invitar o quitar administradores (cada uno crea su propia contraseña).
- La sesión del panel se mantiene en el dispositivo y se cierra sola a las **5 horas**.

---

## Puesta en marcha

### 1. Requisitos
- Node.js 20 o superior
- Un proyecto de Firebase en plan **Blaze** (Storage lo requiere; el uso pequeño es gratis)

### 2. Instalar
```bash
npm install
cp .env.example .env.local
```

### 3. Firebase
1. Consola de Firebase → **Agregar app web** → copia la configuración en las variables `NEXT_PUBLIC_FIREBASE_*` de `.env.local`.
2. **Authentication → Método de acceso:** activa **Google** y **Correo/contraseña**.
3. Crea **Firestore** (modo producción) y **Storage**.
4. Publica las reglas de `firestore.rules` y `storage.rules` (pestaña *Reglas* de cada producto).
5. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**, y luego:
   ```bash
   npm run configurar-firebase -- ruta/al/archivo.json
   ```
   (copia la clave a `.env.local` sin mostrarla; **nunca subas ese JSON a git**).
6. Comprueba la conexión:
   ```bash
   npm run probar-conexion
   ```

### 4. Primer administrador
```bash
npm run crear-admin -- tu@correo.com "Tu Nombre"
```
Abre el enlace que aparece para crear tu contraseña. Los demás administradores se invitan desde el panel.

### 5. Contenido del curso
Pon los archivos en la carpeta `arvhivos curso/` (no se sube a git) y ejecuta:
```bash
npm run subir-curso
```
Títulos y descripciones opcionales en `arvhivos curso/titulos.json`.

### 6. Arrancar
```bash
npm run dev
```
Abre http://localhost:3000

---

## PayPal (tarjeta de crédito/débito)
1. En **developer.paypal.com → Apps & Credentials** crea una app (empieza en *Sandbox*).
2. Pon `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_ENV=sandbox` en `.env.local`.
3. Crea un **webhook** a `https://TU-DOMINIO/api/paypal/webhook` con el evento `PAYMENT.CAPTURE.COMPLETED` y pon su ID en `PAYPAL_WEBHOOK_ID`.
4. Para cobrar de verdad, cambia a las credenciales *Live* y `PAYPAL_ENV=live`.

## Correos (Resend)
Crea una cuenta en resend.com, verifica tu dominio y pon `RESEND_API_KEY`, `CORREO_REMITENTE` y `ADMIN_EMAIL`. Sin esto la web funciona igual, pero no envía correos.

## Desplegar en Vercel
1. Importa este repositorio en vercel.com.
2. Copia **todas** las variables de `.env.local` en *Settings → Environment Variables* (la clave privada entre comillas, con los `\n`).
3. Cambia `NEXT_PUBLIC_SITE_URL` a tu dominio.
4. En Firebase → **Authentication → Configuración → Dominios autorizados**, añade tu dominio de Vercel.
5. Para que el login con Google funcione bien en móviles, usa tu dominio como `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (la web ya incluye el proxy `/__/auth/*`) y añade `https://TU-DOMINIO/__/auth/handler` como URI de redirección del cliente OAuth en Google Cloud.

---

## Pruebas sin tocar el Firebase real (emuladores)
```bash
npm run emuladores          # en una terminal
npm run dev:emuladores      # en otra
```
Requiere Java 11+ (el proyecto usa firebase-tools 13).

## Comandos útiles
| Comando | Para qué |
|---|---|
| `npm run dev` | Web en modo desarrollo |
| `npm run build` | Compilar para producción |
| `npm run crear-admin -- correo "Nombre"` | Crear el primer administrador |
| `npm run subir-curso` | Subir/actualizar los archivos del curso |
| `npm run probar-conexion` | Comprobar Firestore, Storage y Auth |
| `npm run ver-pedidos` | Ver los últimos pedidos en la terminal |

## Seguridad
- Claves solo en `.env.local` / Vercel (nunca en el código).
- El navegador no puede escribir en Firestore: todo lo hace el servidor con el Admin SDK.
- Cada cliente solo lee su propia cuenta y su pedido; no puede cambiar su estado.
- Comprobantes en carpeta privada por usuario; archivos del curso solo con URLs firmadas de 15 minutos.
