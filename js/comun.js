"use strict";

/* Utilidades compartidas por las paginas HTML. */

/** Crea un elemento DOM (usa textContent, nunca innerHTML). */
function el(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "class") e.className = v;
    else if (v != null && v !== false) e.setAttribute(k, v === true ? "" : v);
  }
  hijos.flat().forEach(h => { if (h != null && h !== false) e.append(h.nodeType ? h : document.createTextNode(h)); });
  return e;
}

const dinero = n => "$" + Number(n).toFixed(2);
const fechaLocal = iso => new Date(iso).toLocaleString();

/** Mensaje temporal (verde = ok, rojo = error). */
function mostrarAviso(mensaje, ok = true) {
  let a = document.getElementById("aviso");
  if (!a) { a = el("div", { id: "aviso" }); document.body.append(a); }
  a.textContent = mensaje;
  a.className = "aviso " + (ok ? "ok" : "err");
  a.hidden = false;
  clearTimeout(mostrarAviso.t);
  mostrarAviso.t = setTimeout(() => (a.hidden = true), 2800);
}

/**
 * Protege una pagina: devuelve el usuario si tiene el rol pedido; si no, redirige y devuelve null.
 * Tambien rellena el nombre en la barra y activa el boton "Salir".
 */
function requerirRol(rol) {
  const usuario = Usuario.actual();
  if (!usuario) { location.replace("login.html"); return null; }
  if (usuario.rol !== rol) { location.replace(usuario.paginaInicio); return null; }

  document.getElementById("usuario-nombre").textContent = `${usuario.nickname} (${usuario.rol})`;
  document.getElementById("btn-salir").addEventListener("click", () => {
    Usuario.cerrarSesion();
    location.replace("login.html");
  });
  const actual = location.pathname.split("/").pop();
  document.querySelectorAll(".barra .enlace").forEach(a => {
    if (a.getAttribute("href") === actual) a.classList.add("activo");
  });
  return usuario;
}

/** Reduce la imagen subida (max 400 px) para no llenar el localStorage. Devuelve un data URI. */
function comprimirImagen(archivo, max = 400) {
  return new Promise((resolve, reject) => {
    if (!archivo || !archivo.type.startsWith("image/")) return reject(new Error("El archivo no es una imagen."));
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen inválida."));
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.75));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
