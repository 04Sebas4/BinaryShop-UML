# BinaryShop — Documentación del sistema (Fase II)

Prototipo web de comercio electrónico hecho solo con **HTML5, CSS3 y JavaScript puro** (sin librerías ni frameworks).
No hay base de datos ni servidor: todo se guarda en el **`localStorage`** del navegador y el código usa
**programación orientada a objetos** siguiendo el diagrama de clases de la Fase I.

Para usarlo: abrir `html/login.html` en el navegador (doble clic).

---

## 1. Estructura de carpetas

```
Sebas/
├── assets/
│   └── productos/        Imágenes de los 12 productos de ejemplo (.webp)
├── css/
│   └── styles.css        Estilos de todas las páginas
├── docs/
│   ├── documentacion.md  (este archivo)
│   └── casos-de-prueba.md
├── html/                 Una página por vista
│   ├── login.html        Inicio de sesión
│   ├── registro.html     Registro de usuarios
│   ├── catalogo.html     Catálogo + carrito + pago        (comprador)
│   ├── compras.html      Historial de compras             (comprador)
│   ├── vendedor.html     Publicar productos + ventas      (vendedor)
│   └── admin.html        Eliminar cuentas y productos     (administrador)
├── js/
│   ├── clases.js         TODAS las clases del dominio y los datos de ejemplo
│   ├── comun.js          Utilidades compartidas por las páginas
│   ├── login.js          Lógica de login.html
│   ├── registro.js       Lógica de registro.html
│   ├── catalogo.js       Lógica de catalogo.html (catálogo, carrito, pago)
│   ├── compras.js        Lógica de compras.html
│   ├── vendedor.js       Lógica de vendedor.html
│   └── admin.js          Lógica de admin.html
└── proyect/              (vacía)
```

**Regla general:** cada `html/X.html` carga, en este orden, `js/clases.js`, `js/comun.js` y `js/X.js`.
Las **clases** viven en `clases.js`; los scripts de cada página solo conectan botones y formularios con esas clases.

---

## 2. Cómo se guardan los datos (localStorage)

Todas las claves llevan el prefijo `binary_`. Los valores se guardan como JSON.

| Clave | Contenido |
|---|---|
| `binary_usuarios` | Arreglo con todos los usuarios (compradores, vendedores y administradores) |
| `binary_productos` | Arreglo con los productos de **todos** los vendedores |
| `binary_compras` | Arreglo con todas las compras realizadas |
| `binary_sesion` | `idUsuario` del usuario que tiene la sesión iniciada |
| `binary_carrito_<idUsuario>` | Items del carrito de ese comprador |

La clase `BD` (en `clases.js`) es el único punto que toca `localStorage`: `leer`, `guardar`, `borrar`, `nuevoId`.

**Datos de ejemplo.** Al cargar cualquier página, `cargarDatosDeEjemplo()` crea los usuarios y productos de ejemplo
**solo si no existe ningún usuario**. Para volver al estado inicial: abrir la consola del navegador (F12) y ejecutar
`localStorage.clear()`, luego recargar.

Cuentas predefinidas:

| Nickname | Contraseña | Rol |
|---|---|---|
| `comprador` | `1234` | Comprador |
| `vendedor` | `1234` | Vendedor (dueño de los 12 productos de ejemplo) |
| `admin` | `admin123` | Administrador |

Para ver los datos: F12 → pestaña **Application** → **Local Storage**.

---

## 3. Las clases (`js/clases.js`)

### 3.1 Jerarquía de usuarios

```
Usuario  (clase madre)
 ├── Comprador
 ├── Vendedor
 └── Administrador
```

**`Usuario`** — atributos: `idUsuario, nombre, apellido, direccion, nickname, contrasena, datosBancarios`.

| Método | Qué hace |
|---|---|
| `static registrarse(datos)` | Crea un `Comprador` o `Vendedor` y lo guarda. Si el nickname existe, la contraseña coincide, la cuenta es de comprador y se pide rol vendedor → llama a `habilitarVendedor()`. En cualquier otro caso con nickname repetido lanza error. |
| `static iniciarSesion(nickname, contrasena)` | Busca el usuario, compara la contraseña y guarda su id en `binary_sesion`. Lanza error si no coinciden. |
| `static cerrarSesion()` | Borra `binary_sesion`. |
| `static actual()` | Devuelve el usuario con sesión iniciada (o `null`). |
| `static todos()` / `buscarPorNickname()` | Lectura de `binary_usuarios`. Cada objeto guardado se convierte en la subclase correcta con `Usuario.desde()`, según su campo `rol`. |
| `guardar()` / `static eliminar(id)` | Inserta o reemplaza (por id) / elimina. |

Cada subclase fija su propio `rol` y su `paginaInicio` (a qué página va tras iniciar sesión). **El rol sale de la cuenta**:
el login no pregunta el rol, la clase del usuario decide qué página y qué recursos se muestran.

**`Comprador`** (`catalogo.html`)

| Método | Qué hace |
|---|---|
| `explorarCatalogo(texto)` | Devuelve los productos cuyo nombre contiene el texto. |
| `agregarAlCarrito(producto, cantidad)` | Agrega al carrito persistente del comprador. |
| `realizarCompra(items, metodoPago)` | Crea una `Compra` con sus `DetalleCompra` y llama a `procesarPago`. |
| `gestionarMetodosPago(metodoPago)` | Recuerda el titular para prellenar el formulario de pago (nunca guarda número ni CVV). |
| `consultarHistorialCompras()` | Compras del comprador, la más reciente primero. |
| `habilitarVendedor()` | Convierte la cuenta en `Vendedor` conservando el mismo id. |

**`Vendedor`** (`vendedor.html`)

| Método | Qué hace |
|---|---|
| `agregarNuevoProducto({nombre, descripcion, precio, imagen})` | Valida (nombre, precio > 0, imagen) y guarda el producto con el id del vendedor. |
| `misProductos()` | Filtra `binary_productos` por `idVendedor`. |
| `eliminarProducto(id)` | Solo permite quitar productos propios. |
| `historialVentas()` | Líneas de compras cuyo `idVendedor` es el suyo. |

**`Administrador`** (`admin.html`)

| Método | Qué hace |
|---|---|
| `gestionarUsuarios()` | Todos los usuarios menos él mismo. |
| `eliminarCuenta(id)` | Borra la cuenta; si era vendedor, borra también sus productos; borra su carrito. No puede borrarse a sí mismo. |
| `quitarProducto(id)` | Elimina un producto del catálogo. |

### 3.2 Productos y catálogo

- **`Producto`**: `idProducto, nombre, descripcion, imagen, precio, idVendedor, nombreVendedor`. Método `obtenerDetalles()`. Los métodos estáticos `todos()`, `buscar(id)`, `eliminar(id)` y `guardar()` leen/escriben `binary_productos`.
- **`Catalogo`**: carga todos los productos (`listaProducto`); `mostrarProducto()` los devuelve y `buscarProducto(texto)` filtra por nombre.

### 3.3 Carrito

- **`ItemCarrito`**: `idItem, idProducto, cantidad`. Guarda solo el id del producto; `producto` y `subtotal()` consultan el precio actual.
- **`CarritoCompras`**: guarda sus items en `binary_carrito_<idUsuario>`.
  - `agregarItem(producto, cantidad)`: suma la cantidad (puede ser negativa, para el botón "−"); si llega a 0 el item desaparece.
  - `eliminarItem(idProducto)`, `calcularTotal()`, `cantidadTotal()`, `vaciarCarrito()`.
  - Al cargarse descarta los items de productos que ya no existen (p. ej. los removió el administrador).

### 3.4 Compra y pago

- **`MetodoPago`**: `tipoPago` y `datosCapturados` (`titular, numero, vence, cvv`). `validarMetodo()` comprueba: titular no vacío, 16 dígitos, vencimiento `MM/AA` con mes 01–12 y CVV de 3–4 dígitos; lanza un error con el motivo si algo falla.
- **`DetalleCompra`**: una línea de la compra. Guarda una **copia** del nombre, precio e id del vendedor del producto (así el historial no cambia si el producto se elimina después).
- **`Compra`**: `fecha, montoTotal, estado, idComprador, nombreComprador, tarjeta, detalles`. `procesarPago(metodo)` valida el método, calcula el total, guarda solo los **últimos 4 dígitos** de la tarjeta y deja la compra en estado `Pagada`.

---

## 4. Utilidades compartidas (`js/comun.js`)

| Función | Para qué sirve |
|---|---|
| `el(tag, atributos, ...hijos)` | Crea elementos del DOM de forma segura (usa `textContent`, no `innerHTML`). |
| `dinero(n)` / `fechaLocal(iso)` | Formato de precio (`$12.50`) y de fecha. |
| `mostrarAviso(mensaje, ok)` | Mensaje temporal arriba: verde si `ok`, rojo si es error. |
| `requerirRol(rol)` | **Protege la página.** Sin sesión → manda a `login.html`; con otro rol → manda a la página de ese usuario. Si todo está bien, rellena el nombre en la barra, activa el botón "Salir" y marca el enlace activo. Devuelve el usuario. |
| `comprimirImagen(archivo)` | Convierte una imagen subida a un JPEG de máximo 400 px en base64 para guardarla en `localStorage`. |

---

## 5. Las páginas y su flujo

### `login.html` / `login.js`
Formulario de nickname y contraseña (sin elegir rol). Si ya hay sesión, redirige a la página del usuario.
`Usuario.iniciarSesion()` → `location.href = usuario.paginaInicio`. Tiene botón "Crear cuenta".

### `registro.html` / `registro.js`
Nombre, apellido, dirección, nickname, contraseña, datos bancarios y rol (comprador o vendedor).
Llama a `Usuario.registrarse()`; si sale bien muestra un aviso y vuelve al login.
Un comprador que se registra como vendedor con su mismo nickname y contraseña pasa a ser vendedor.

### `catalogo.html` / `catalogo.js` (comprador)
- Dibuja la rejilla clonando el `<template id="tpl-producto">` por cada producto.
- **Buscador**: vuelve a dibujar la rejilla con `explorarCatalogo(texto)` en cada tecla.
- **Carrito** (botón 🛒 de la barra): el contador muestra la cantidad total; el desplegable lista los productos con `+`, `−`, `✕`, total, "Pagar carrito" y "Vaciar".
- **Pago**: "Comprar de inmediato" (un producto) o "Pagar carrito" abren un `<dialog>` con el formulario de tarjeta. Al confirmar: `new MetodoPago` → `realizarCompra` → `gestionarMetodosPago`. Si el pago venía del carrito, se vacía.

### `compras.html` / `compras.js` (comprador)
Tabla con fecha, productos, total, estado y tarjeta (`**** 1234`) de cada compra.

### `vendedor.html` / `vendedor.js` (vendedor)
- Formulario de producto (nombre, descripción opcional, precio, imagen). Al elegir la imagen se comprime y se muestra una vista previa.
- "Mis productos" con botón "Quitar" y el historial de ventas con el total acumulado.

### `admin.html` / `admin.js` (administrador)
- Tabla de usuarios con "Eliminar" y tabla de productos con "Remover". Ambas piden confirmación (`confirm`).

---

## 6. Flujos principales (resumen)

**Registro → login:** `registro.js` → `Usuario.registrarse()` → guarda en `binary_usuarios` → `login.js` → `Usuario.iniciarSesion()` → guarda `binary_sesion` → redirige a `usuario.paginaInicio`.

**Compra:** botón del producto → `agregarAlCarrito()` (o item directo) → `<dialog>` de pago → `MetodoPago.validarMetodo()` → `Compra.procesarPago()` → se agrega a `binary_compras` → aparece en "Mis compras" del comprador y en el historial del vendedor.

**Publicar producto:** formulario → `comprimirImagen()` (base64) → `Vendedor.agregarNuevoProducto()` → se agrega a `binary_productos` → aparece en el catálogo.

**Eliminar cuenta (admin):** `Administrador.eliminarCuenta()` → borra productos del vendedor, su carrito y su usuario.

---

## 7. Decisiones de diseño y limitaciones

- **Un usuario, un rol.** Un comprador que quiere vender se convierte en vendedor (no tiene los dos roles a la vez).
- **Login sin selección de rol.** El enunciado y el diagrama de secuencia mencionan elegir el rol al iniciar sesión; aquí el rol lo determina la cuenta. Conviene justificarlo en la defensa.
- **"Banear" = eliminar.** El admin elimina cuentas (lo que pide el enunciado); no existe un baneo que conserve la cuenta.
- **No se simula "saldo insuficiente"** (aparece en el diagrama de secuencia): no hay saldo real.
- **Sin seguridad** (decisión consciente para el prototipo): las contraseñas se guardan en texto plano y la protección por rol se hace solo en el navegador.
- **Límite de almacenamiento:** `localStorage` permite ~5 MB por navegador. Las imágenes subidas por vendedores ocupan espacio (por eso se reducen a 400 px); si se llena, el panel avisa "Almacenamiento lleno".
- Los datos viven **en el navegador y el equipo donde se usan**: no se comparten entre navegadores ni equipos.
