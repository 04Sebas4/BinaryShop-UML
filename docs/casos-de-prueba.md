# BinaryShop — Casos de prueba

Pruebas manuales del prototipo. Se ejecutan en el navegador abriendo `html/login.html`.

**Antes de empezar:** abrir la consola (F12) y ejecutar `localStorage.clear()`; recargar. Así se parte de los datos de ejemplo.

**Cuentas de ejemplo:** `comprador / 1234` · `vendedor / 1234` · `admin / admin123`.
**Tarjeta de prueba válida:** titular cualquiera · `1234 5678 9012 3456` · vence `08/28` · CVV `123`.

Cada fila: **ID**, **qué se prueba**, **pasos**, **resultado esperado**. Marca la columna *OK* al ejecutarla.

> **Orden recomendado:** los casos del administrador (sección 9) eliminan cuentas y productos de ejemplo. Ejecútalos al final
> o vuelve a hacer `localStorage.clear()` antes de seguir con otra sección.

---

## 1. Registro

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| R1 | Registrar comprador | En `registro.html` llenar todo, rol *Comprador*, nickname `ana`, contraseña `abcd` → Registrarme | Aviso verde "Listo: ana ya es comprador…" y redirige a `login.html`. En Local Storage, `binary_usuarios` tiene 4 usuarios | |
| R2 | Registrar vendedor | Igual que R1 con nickname `luis` y rol *Vendedor* | Aviso verde "…luis ya es vendedor…"; la cuenta existe con rol `vendedor` | |
| R3 | Nickname repetido | Registrar nickname `comprador` con contraseña `xxxx` | Aviso rojo "Ese nickname ya está registrado." No se crea otra cuenta | |
| R4 | Repetir rol ya existente | Registrar nickname `comprador`, contraseña `1234`, rol *Comprador* | Aviso rojo "Ese nickname ya está registrado." | |
| R5 | Comprador pasa a vendedor | Registrar nickname `comprador`, contraseña `1234`, rol *Vendedor* | Aviso verde "…comprador ya es vendedor…". Al iniciar sesión con esa cuenta se llega a `vendedor.html` (ya no es comprador) y conserva el mismo `idUsuario` | |
| R6 | Comprador→vendedor con contraseña incorrecta | Registrar nickname `comprador`, contraseña `mala`, rol *Vendedor* | Aviso rojo "Ese nickname ya está registrado." La cuenta no cambia | |
| R7 | Campos vacíos | Dejar nombre vacío y enviar | El navegador marca el campo como obligatorio; no se envía | |
| R8 | Nickname sin distinguir mayúsculas | Registrar `COMPRADOR` con otra contraseña | Se rechaza como nickname repetido (R3) | |

## 2. Inicio y cierre de sesión

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| L1 | Login comprador | `comprador / 1234` | Va a `catalogo.html`; la barra muestra "comprador (comprador)" | |
| L2 | Login vendedor | `vendedor / 1234` | Va a `vendedor.html` | |
| L3 | Login administrador | `admin / admin123` | Va a `admin.html` | |
| L4 | Contraseña incorrecta | `comprador / 9999` | Aviso rojo "Nickname o contraseña incorrectos." Se queda en el login | |
| L5 | Nickname inexistente | `nadie / 1234` | Mismo aviso rojo que L4 | |
| L6 | Campos vacíos | Enviar sin llenar | El navegador marca los campos obligatorios | |
| L7 | Cerrar sesión | Estando logueado pulsar **Salir** | Vuelve a `login.html`. `binary_sesion` desaparece de Local Storage | |
| L8 | Sesión ya activa | Logueado, abrir `login.html` a mano | Redirige solo a la página del usuario | |
| L9 | Persistencia de sesión | Logueado, recargar la página (F5) | Sigue logueado en la misma página | |

## 3. Protección de páginas por rol

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| P1 | Sin sesión | Sin sesión abrir `catalogo.html`, `vendedor.html`, `admin.html`, `compras.html` | Cada una redirige a `login.html` | |
| P2 | Comprador en página de vendedor | Logueado como comprador, abrir `vendedor.html` | Redirige a `catalogo.html` | |
| P3 | Vendedor en página de comprador | Logueado como vendedor, abrir `catalogo.html` | Redirige a `vendedor.html` | |
| P4 | Comprador en página de admin | Logueado como comprador, abrir `admin.html` | Redirige a `catalogo.html` | |
| P5 | Menú según rol | Iniciar sesión con cada rol | Comprador: Catálogo, Mis compras y 🛒. Vendedor: Panel de vendedor. Admin: Administración | |

## 4. Catálogo y búsqueda (comprador)

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| C1 | Ver productos | Entrar como comprador | 12 productos con imagen, nombre, precio, vendedor y los botones "Añadir al carrito" y "Comprar de inmediato" | |
| C2 | Buscar | Escribir `iphone` en el buscador | Quedan solo los 3 iPhone; se actualiza al escribir | |
| C3 | Búsqueda sin resultados | Escribir `zzzz` | Aparece "No hay productos para mostrar." | |
| C4 | Búsqueda sin distinguir mayúsculas | Escribir `IPAD` | Aparece "iPad Mini 2021 Starlight" | |
| C5 | Borrar búsqueda | Vaciar el buscador | Vuelven los 12 productos | |

## 5. Carrito

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| K1 | Añadir producto | "Añadir al carrito" en *iPhone 6* | Aviso "Añadido al carrito."; el contador del 🛒 pasa a 1 | |
| K2 | Añadir el mismo producto | Repetir K1 | El contador pasa a 2; en el desplegable hay **una** línea con cantidad 2 | |
| K3 | Ver detalle | Abrir el 🛒 | Lista con imagen, nombre, precio unitario, cantidad, total y los botones de pagar/vaciar | |
| K4 | Botón + | En el carrito pulsar **+** | La cantidad y el total suben | |
| K5 | Botón − | Pulsar **−** hasta 0 | La línea desaparece; si no quedan líneas, "Tu carrito está vacío." | |
| K6 | Quitar (✕) | Pulsar ✕ en una línea | La línea desaparece y el contador baja | |
| K7 | Vaciar | Pulsar "Vaciar" | Carrito vacío, contador en 0 | |
| K8 | Total correcto | Añadir *iPhone 6* (299.99) ×2 y *Apple Airpods* (129.99) ×1 | Total **$729.97**, "3 artículos" | |
| K9 | Persistencia | Con items en el carrito, recargar (F5) | Los items y el contador siguen | |
| K10 | Carrito por usuario | Cerrar sesión, entrar con otro comprador | Su carrito es distinto (vacío) | |
| K11 | Cerrar el desplegable | Con el carrito abierto, hacer clic fuera | Se cierra | |

## 6. Pago y compra

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| B1 | Compra inmediata válida | "Comprar de inmediato" en *iPhone 5s* → datos de la tarjeta de prueba → Pagar | Aviso "¡Compra realizada con éxito!". Aparece en *Mis compras* con estado **Pagada** y `**** 3456` | |
| B2 | Pagar el carrito | Añadir 2 productos → 🛒 → "Pagar carrito" → tarjeta válida | Compra registrada con ambos productos; el carrito queda vacío | |
| B3 | La compra inmediata no toca el carrito | Con items en el carrito hacer B1 | Los items del carrito siguen ahí | |
| B4 | Tarjeta de menos de 16 dígitos | Número `1234` | Aviso rojo "La tarjeta debe tener 16 dígitos." No se registra compra | |
| B5 | Tarjeta con letras | Número `abcd efgh ijkl mnop` | Mismo aviso que B4 | |
| B6 | Vencimiento inválido | Vence `13/28` y luego `0828` | Aviso rojo "Vencimiento inválido (formato MM/AA)." | |
| B7 | CVV inválido | CVV `12` | Aviso rojo "CVV inválido." | |
| B8 | Titular vacío | Titular con solo espacios | Aviso rojo "Indica el titular de la tarjeta." | |
| B9 | Cancelar pago | Abrir el pago y pulsar Cancelar | Se cierra; no se registra compra | |
| B10 | Titular prellenado | Hacer una compra con titular `Juan Pérez` y abrir otro pago | El titular aparece prellenado con `Juan Pérez` (el número y el CVV **no**) | |
| B11 | Total del formulario | Pagar un carrito de varios productos | El total del diálogo coincide con el del carrito | |
| B12 | No se guarda el número completo | Tras una compra, revisar `binary_compras` en Local Storage | Solo está `tarjeta: "3456"`; no aparece el número completo ni el CVV | |

## 7. Mis compras (comprador)

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| H1 | Sin compras | Comprador nuevo abre *Mis compras* | "Aún no has comprado nada." | |
| H2 | Con compras | Tras B1 y B2 abrir *Mis compras* | Una fila por compra, la más reciente primero; fecha, productos con cantidad, total, estado, tarjeta | |
| H3 | Aislamiento | Otro comprador abre *Mis compras* | No ve las compras del primero | |

## 8. Panel de vendedor

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| V1 | Publicar producto | Nombre `Cable USB`, descripción opcional, precio `5.50`, una imagen → Publicar | Aviso "Producto publicado."; aparece en *Mis productos*; el formulario se limpia | |
| V2 | Aparece en el catálogo | Después de V1 entrar como comprador | `Cable USB` aparece en el catálogo con su imagen y "Vendedor: …" | |
| V3 | Vista previa | Elegir una imagen en el formulario | Se muestra una miniatura | |
| V4 | Sin imagen | Enviar sin elegir imagen | El navegador exige el campo; no se envía | |
| V5 | Precio inválido | Precio `0` o negativo | El navegador lo rechaza (mínimo 0.01) | |
| V6 | Archivo que no es imagen | Intentar subir un `.pdf` o `.txt` (cambiando el filtro del selector a "Todos los archivos") | Aviso rojo "El archivo no es una imagen." | |
| V7 | Quitar producto | "Quitar" en un producto propio | Desaparece de *Mis productos* y del catálogo | |
| V8 | Solo ve sus productos | Vendedor nuevo (R2) abre su panel | "Mis productos (0)" — no ve los 12 del vendedor de ejemplo | |
| V9 | Historial de ventas vacío | Vendedor sin ventas | "Aún no tienes ventas." | |
| V10 | Historial con ventas | Un comprador compra un producto de `vendedor`; entrar como `vendedor` | En el historial: fecha, producto, cantidad, total y nombre del comprador; el título muestra el total acumulado | |
| V11 | Solo ventas propias | Entrar como otro vendedor | No ve las ventas del primero | |
| V12 | Almacenamiento lleno | Subir muchas imágenes grandes hasta llenar el `localStorage` | Aviso rojo "Almacenamiento lleno. Usa una imagen más pequeña." (la imagen se reduce a 400 px, por lo que cuesta llegar al límite) | |

## 9. Panel de administrador

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| A1 | Ver usuarios | Entrar como admin | Tabla con los usuarios **menos él mismo**, con nickname, nombre y rol | |
| A2 | Eliminar comprador | "Eliminar" en `comprador` → aceptar | Aviso "Cuenta eliminada."; desaparece de la tabla; ya no puede iniciar sesión | |
| A3 | Cancelar eliminación | "Eliminar" → cancelar en el cuadro de confirmación | No pasa nada | |
| A4 | Eliminar vendedor | "Eliminar" en `vendedor` → aceptar | Se elimina la cuenta **y sus productos**; la tabla de productos queda vacía y el catálogo del comprador muestra "No hay productos para mostrar." | |
| A5 | Remover producto | "Remover" en un producto → aceptar | Aviso "Producto removido."; desaparece del catálogo | |
| A6 | Producto removido en carritos | Un comprador tiene el producto en su carrito; el admin lo remueve; el comprador recarga | El producto ya no aparece en el carrito ni en el contador | |
| A7 | Historial conservado | Un vendedor con ventas es eliminado | Las compras del comprador siguen en *Mis compras* (el detalle guarda copia del nombre y precio) | |
| A8 | Listas vacías | Eliminar todos los usuarios y productos | Mensajes "No hay otros usuarios." y "No hay productos." | |

## 10. Persistencia y reinicio

| ID | Caso | Pasos | Resultado esperado | OK |
|---|---|---|---|---|
| D1 | Datos persisten | Hacer cambios, cerrar y volver a abrir la pestaña | Usuarios, productos, compras y carrito siguen | |
| D2 | Reinicio | `localStorage.clear()` y recargar `login.html` | Se vuelven a crear los 3 usuarios y los 12 productos de ejemplo | |
| D3 | Datos de ejemplo no se duplican | Recargar varias veces seguidas | Siempre 3 usuarios y 12 productos (no se repiten) | |
| D4 | Datos solo en este navegador | Abrir el sitio en otro navegador | Aparece el estado inicial, sin los cambios del primero | |

## 11. Recorrido completo (prueba de punta a punta)

1. `localStorage.clear()` y recargar.
2. Registrar `ana` como **comprador** (R1) y `luis` como **vendedor** (R2).
3. Entrar como `luis`, publicar *Cable USB* a $5.50 con imagen (V1). Cerrar sesión.
4. Entrar como `ana`; buscar `cable`, añadirlo ×2 al carrito y comprar *iPhone 6* de inmediato (K2, B1).
5. Pagar el carrito (B2). Revisar *Mis compras* (H2).
6. Entrar como `luis`: el historial muestra la venta del *Cable USB* y **no** la del iPhone (V10, V11).
7. Entrar como `admin`: eliminar a `luis` (A4) y comprobar que *Cable USB* ya no está en el catálogo de `ana`.
8. Entrar como `ana`: *Mis compras* conserva la compra del cable (A7).
