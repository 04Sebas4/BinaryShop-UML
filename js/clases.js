"use strict";

/* =====================================================================
   Modelo de BinaryShop (sigue el diagrama de clases).
   Todo se guarda en localStorage con el prefijo "binary_".
   ===================================================================== */

const Rol = { COMPRADOR: "comprador", VENDEDOR: "vendedor", ADMIN: "administrador" };

/** Acceso simple a localStorage (guarda y lee JSON). */
class BD {
  static leer(clave, defecto) {
    try {
      const v = localStorage.getItem("binary_" + clave);
      return v === null ? defecto : JSON.parse(v);
    } catch (e) { return defecto; }
  }
  static guardar(clave, valor) { localStorage.setItem("binary_" + clave, JSON.stringify(valor)); }
  static borrar(clave) { localStorage.removeItem("binary_" + clave); }
  static nuevoId(prefijo) { return prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
}

/* ---------------------------- Producto ---------------------------- */

class Producto {
  constructor(d = {}) {
    this.idProducto = d.idProducto || BD.nuevoId("p");
    this.nombre = d.nombre || "";
    this.descripcion = d.descripcion || "";
    this.imagen = d.imagen || "";
    this.precio = Number(d.precio) || 0;
    this.idVendedor = d.idVendedor || "";
    this.nombreVendedor = d.nombreVendedor || "";
  }
  obtenerDetalles() { return this.descripcion ? `${this.nombre}: ${this.descripcion}` : this.nombre; }

  static todos() { return BD.leer("productos", []).map(d => new Producto(d)); }
  static buscar(id) { return Producto.todos().find(p => p.idProducto === id) || null; }
  guardar() {
    const lista = BD.leer("productos", []);
    lista.push(this);
    BD.guardar("productos", lista);
  }
  static eliminar(id) { BD.guardar("productos", BD.leer("productos", []).filter(p => p.idProducto !== id)); }
}

/* ---------------------------- Catalogo ---------------------------- */

class Catalogo {
  constructor() { this.listaProducto = Producto.todos(); }
  mostrarProducto() { return this.listaProducto; }
  buscarProducto(texto = "") {
    const t = texto.trim().toLowerCase();
    return this.listaProducto.filter(p => p.nombre.toLowerCase().includes(t));
  }
}

/* ------------------- Carrito de compras e items ------------------- */

class ItemCarrito {
  constructor(d = {}) {
    this.idItem = d.idItem || BD.nuevoId("i");
    this.idProducto = d.idProducto;
    this.cantidad = d.cantidad || 1;
  }
  get producto() { return Producto.buscar(this.idProducto); }
  subtotal() { return this.cantidad * this.producto.precio; }
}

class CarritoCompras {
  constructor(idComprador) {
    this.idCarrito = "carrito_" + idComprador;
    // Se descartan los items cuyo producto ya no existe (p. ej. lo removió el administrador).
    this.items = BD.leer(this.idCarrito, []).map(d => new ItemCarrito(d)).filter(i => i.producto);
  }
  guardar() { BD.guardar(this.idCarrito, this.items); }

  /** Suma `cantidad` al producto (puede ser negativa); si llega a 0 el item se quita. */
  agregarItem(producto, cantidad = 1) {
    const item = this.items.find(i => i.idProducto === producto.idProducto);
    if (item) item.cantidad += cantidad;
    else this.items.push(new ItemCarrito({ idProducto: producto.idProducto, cantidad }));
    this.items = this.items.filter(i => i.cantidad > 0);
    this.guardar();
  }
  eliminarItem(idProducto) {
    this.items = this.items.filter(i => i.idProducto !== idProducto);
    this.guardar();
  }
  calcularTotal() { return this.items.reduce((suma, i) => suma + i.subtotal(), 0); }
  cantidadTotal() { return this.items.reduce((suma, i) => suma + i.cantidad, 0); }
  vaciarCarrito() { this.items = []; this.guardar(); }
}

/* ------------------- Compra, detalle y metodo de pago ------------------- */

class MetodoPago {
  constructor(d = {}) {
    this.idMetodo = d.idMetodo || BD.nuevoId("m");
    this.tipoPago = d.tipoPago || "Tarjeta";
    this.datosCapturados = d.datosCapturados || {}; // { titular, numero, vence, cvv }
  }
  validarMetodo() {
    const { titular = "", numero = "", vence = "", cvv = "" } = this.datosCapturados;
    if (!titular.trim()) throw new Error("Indica el titular de la tarjeta.");
    if (!/^\d{16}$/.test(numero.replace(/\s/g, ""))) throw new Error("La tarjeta debe tener 16 dígitos.");
    const m = /^(\d{2})\/(\d{2})$/.exec(vence);
    if (!m || +m[1] < 1 || +m[1] > 12) throw new Error("Vencimiento inválido (formato MM/AA).");
    if (!/^\d{3,4}$/.test(cvv)) throw new Error("CVV inválido.");
    return true;
  }
  ultimosDigitos() { return this.datosCapturados.numero.replace(/\s/g, "").slice(-4); }
}

class DetalleCompra {
  constructor(d = {}) {
    this.idDetalle = d.idDetalle || BD.nuevoId("d");
    this.idProducto = d.idProducto;
    this.nombreProducto = d.nombreProducto;
    this.idVendedor = d.idVendedor;
    this.precioUnitario = d.precioUnitario;
    this.cantidad = d.cantidad;
    this.precioTotal = this.subtotal();
  }
  subtotal() { return this.cantidad * this.precioUnitario; }
}

class Compra {
  constructor(d = {}) {
    this.idCompra = d.idCompra || BD.nuevoId("c");
    this.fecha = d.fecha || new Date().toISOString();
    this.montoTotal = d.montoTotal || 0;
    this.estado = d.estado || "Pendiente";
    this.idComprador = d.idComprador;
    this.nombreComprador = d.nombreComprador;
    this.tarjeta = d.tarjeta || ""; // solo los ultimos 4 digitos
    this.detalles = (d.detalles || []).map(x => new DetalleCompra(x));
  }
  calcularTotal() {
    this.montoTotal = this.detalles.reduce((suma, d) => suma + d.subtotal(), 0);
    return this.montoTotal;
  }
  /** Valida el metodo de pago y, si es correcto, registra la compra como pagada. */
  procesarPago(metodoPago) {
    metodoPago.validarMetodo();
    this.calcularTotal();
    this.tarjeta = metodoPago.ultimosDigitos();
    this.estado = "Pagada";
    const lista = BD.leer("compras", []);
    lista.push(this);
    BD.guardar("compras", lista);
  }
  static todas() { return BD.leer("compras", []).map(d => new Compra(d)); }
  static deComprador(id) { return Compra.todas().filter(c => c.idComprador === id); }
}

/* ---------------------------- Usuarios ---------------------------- */

class Usuario {
  constructor(d = {}) {
    this.idUsuario = d.idUsuario || BD.nuevoId("u");
    this.nombre = d.nombre || "";
    this.apellido = d.apellido || "";
    this.direccion = d.direccion || "";
    this.nickname = d.nickname || "";
    this.contrasena = d.contrasena || "";
    this.datosBancarios = d.datosBancarios || "";
  }
  get nombreCompleto() { return `${this.nombre} ${this.apellido}`.trim(); }

  /* --- almacenamiento --- */
  static desde(d) {
    if (d.rol === Rol.COMPRADOR) return new Comprador(d);
    if (d.rol === Rol.VENDEDOR) return new Vendedor(d);
    return new Administrador(d);
  }
  static todos() { return BD.leer("usuarios", []).map(d => Usuario.desde(d)); }
  static buscarPorNickname(nick) {
    return Usuario.todos().find(u => u.nickname.toLowerCase() === nick.trim().toLowerCase()) || null;
  }
  /** Inserta o reemplaza (por id) este usuario en localStorage. */
  guardar() {
    const lista = BD.leer("usuarios", []);
    const i = lista.findIndex(u => u.idUsuario === this.idUsuario);
    if (i >= 0) lista[i] = this; else lista.push(this);
    BD.guardar("usuarios", lista);
  }
  static eliminar(id) { BD.guardar("usuarios", BD.leer("usuarios", []).filter(u => u.idUsuario !== id)); }

  /* --- metodos del diagrama --- */

  /** Crea una cuenta de comprador o vendedor. Un comprador existente puede pasar a vendedor. */
  static registrarse(d) {
    const existente = Usuario.buscarPorNickname(d.nickname);
    if (existente) {
      if (existente instanceof Comprador && d.rol === Rol.VENDEDOR && existente.contrasena === d.contrasena) {
        return existente.habilitarVendedor();
      }
      throw new Error("Ese nickname ya está registrado.");
    }
    const usuario = d.rol === Rol.VENDEDOR ? new Vendedor(d) : new Comprador(d);
    usuario.guardar();
    return usuario;
  }

  /** El rol lo determina la cuenta: la clase del usuario decide a qué pagina va (paginaInicio). */
  static iniciarSesion(nickname, contrasena) {
    const usuario = Usuario.buscarPorNickname(nickname);
    if (!usuario || usuario.contrasena !== contrasena) throw new Error("Nickname o contraseña incorrectos.");
    BD.guardar("sesion", usuario.idUsuario);
    return usuario;
  }
  static cerrarSesion() { BD.borrar("sesion"); }
  /** Usuario con la sesion iniciada, o null. */
  static actual() {
    const id = BD.leer("sesion", null);
    return Usuario.todos().find(u => u.idUsuario === id) || null;
  }
}

class Comprador extends Usuario {
  constructor(d = {}) {
    super(d);
    this.rol = Rol.COMPRADOR;
    this.metodoPago = d.metodoPago || null; // { tipoPago, titular } usado la ultima vez
  }
  get paginaInicio() { return "catalogo.html"; }
  get carrito() { return new CarritoCompras(this.idUsuario); }

  explorarCatalogo(texto = "") { return new Catalogo().buscarProducto(texto); }

  agregarAlCarrito(producto, cantidad = 1) { this.carrito.agregarItem(producto, cantidad); }

  /** items: lista de ItemCarrito a comprar. Devuelve la Compra registrada. */
  realizarCompra(items, metodoPago) {
    const compra = new Compra({
      idComprador: this.idUsuario,
      nombreComprador: this.nombreCompleto,
      detalles: items.map(i => ({
        idProducto: i.idProducto, nombreProducto: i.producto.nombre, idVendedor: i.producto.idVendedor,
        precioUnitario: i.producto.precio, cantidad: i.cantidad,
      })),
    });
    compra.procesarPago(metodoPago);
    return compra;
  }

  /** Recuerda el metodo de pago (sin numero ni CVV) para prellenar el formulario. */
  gestionarMetodosPago(metodoPago) {
    this.metodoPago = { tipoPago: metodoPago.tipoPago, titular: metodoPago.datosCapturados.titular };
    this.guardar();
  }

  consultarHistorialCompras() { return Compra.deComprador(this.idUsuario).reverse(); }

  /** Convierte esta cuenta en cuenta de vendedor (conserva el mismo id). */
  habilitarVendedor() {
    const vendedor = new Vendedor(this);
    vendedor.guardar();
    return vendedor;
  }
}

class Vendedor extends Usuario {
  constructor(d = {}) {
    super(d);
    this.rol = Rol.VENDEDOR;
  }
  get paginaInicio() { return "vendedor.html"; }

  agregarNuevoProducto({ nombre, descripcion, precio, imagen }) {
    if (!nombre.trim()) throw new Error("El nombre es obligatorio.");
    if (!(Number(precio) > 0)) throw new Error("El precio debe ser mayor que 0.");
    if (!imagen) throw new Error("Selecciona una imagen.");
    const producto = new Producto({
      nombre: nombre.trim(), descripcion, precio, imagen,
      idVendedor: this.idUsuario, nombreVendedor: this.nombreCompleto,
    });
    producto.guardar();
    return producto;
  }
  misProductos() { return Producto.todos().filter(p => p.idVendedor === this.idUsuario); }
  eliminarProducto(idProducto) {
    const p = Producto.buscar(idProducto);
    if (!p || p.idVendedor !== this.idUsuario) throw new Error("Ese producto no es tuyo.");
    Producto.eliminar(idProducto);
  }
  /** Lineas vendidas: [{ fecha, comprador, detalle }] */
  historialVentas() {
    return Compra.todas().reverse().flatMap(c => c.detalles
      .filter(d => d.idVendedor === this.idUsuario)
      .map(d => ({ fecha: c.fecha, comprador: c.nombreComprador, detalle: d })));
  }
}

class Administrador extends Usuario {
  constructor(d = {}) {
    super(d);
    this.rol = Rol.ADMIN;
  }
  get paginaInicio() { return "admin.html"; }

  /** Elimina la cuenta (y los productos si era vendedor). */
  eliminarCuenta(idUsuario) {
    if (idUsuario === this.idUsuario) throw new Error("No puedes eliminar tu propia cuenta.");
    Producto.todos().filter(p => p.idVendedor === idUsuario).forEach(p => Producto.eliminar(p.idProducto));
    BD.borrar("carrito_" + idUsuario);
    Usuario.eliminar(idUsuario);
  }
  quitarProducto(idProducto) { Producto.eliminar(idProducto); }
  /** Todos los usuarios menos el propio administrador. */
  gestionarUsuarios() { return Usuario.todos().filter(u => u.idUsuario !== this.idUsuario); }
}

/* ------------- Datos de ejemplo (credenciales predefinidas) ------------- */

// Las imagenes estan en assets/productos/. Las paginas viven en html/, por eso la ruta empieza con "../".
const RUTA_IMAGENES = "../assets/productos/";

function cargarDatosDeEjemplo() {
  if (Usuario.todos().length) return;
  new Administrador({ nombre: "Admin", apellido: "Sistema", direccion: "Sede central", nickname: "admin", contrasena: "admin123" }).guardar();
  new Comprador({ nombre: "Carlos", apellido: "Comprador", direccion: "Av. Principal 123", nickname: "comprador",
    contrasena: "1234", datosBancarios: "Banco Demo - 0102030405" }).guardar();
  const vendedor = new Vendedor({ nombre: "Vera", apellido: "Vendedora", direccion: "Calle 5, Local 2", nickname: "vendedor",
    contrasena: "1234", datosBancarios: "Banco Demo - 0999888777" });
  vendedor.guardar();

  // [nombre, descripcion, precio, archivo de imagen]
  [
    ["Apple MacBook Pro 14 Inch Space Grey", "Portátil de 14 pulgadas, potente y elegante", 1999.99, "apple-macbook-pro-14-inch-space-grey.webp"],
    ["Asus Zenbook Pro Dual Screen Laptop", "Portátil de alto rendimiento con doble pantalla", 1799.99, "asus-zenbook-pro-dual-screen-laptop.webp"],
    ["Huawei Matebook X Pro", "Ultraligero, pantalla táctil y gran batería", 1399.99, "huawei-matebook-x-pro.webp"],
    ["iPhone 5s", "Smartphone clásico con Touch ID", 199.99, "iphone-5s.webp"],
    ["iPhone 6", "Pantalla de 4.7 pulgadas y cámara de 8 MP", 299.99, "iphone-6.webp"],
    ["iPhone 13 Pro", "Pantalla Super Retina y triple cámara", 1099.99, "iphone-13-pro.webp"],
    ["Amazon Echo Plus", "Altavoz inteligente con asistente de voz", 99.99, "amazon-echo-plus.webp"],
    ["Apple Airpods", "Auriculares inalámbricos con estuche de carga", 129.99, "apple-airpods.webp"],
    ["Apple AirPods Max Silver", "Auriculares de diadema con cancelación de ruido", 549.99, "apple-airpods-max-silver.webp"],
    ["iPad Mini 2021 Starlight", "Tablet compacta de 8.3 pulgadas", 499.99, "ipad-mini-2021-starlight.webp"],
    ["Samsung Galaxy Tab S8 Plus Grey", "Tablet AMOLED de 12.4 pulgadas con S Pen", 599.99, "samsung-galaxy-tab-s8-plus-grey.webp"],
    ["Samsung Galaxy Tab White", "Tablet ligera para trabajo y entretenimiento", 349.99, "samsung-galaxy-tab-white.webp"],
  ].forEach(([nombre, descripcion, precio, archivo]) =>
    vendedor.agregarNuevoProducto({ nombre, descripcion, precio, imagen: RUTA_IMAGENES + archivo }));
}
cargarDatosDeEjemplo();
