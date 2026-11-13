# HÁBITAT · Nimus × Biofilium

Landing de colección en preventa. HTML, CSS y JS sin build ni dependencias, lista para Vercel.

## Estructura

```
index.html          Página
styles.css          Tokens (Carbón, Marfil, Biofilium), componentes y motion
main.js             Entradas, nav, visor de la pieza, archivo y formulario
api/waitlist.js     Función serverless POST /api/waitlist
vercel.json         Cache de /assets y headers de seguridad
assets/img/         Fotogramas HAB 001 (WebP, ≤1200 px)
assets/renders/     Renders V3: {130,180}/{negro,beige}/{01,02,03,04,05,06}.webp
assets/logos/       biofilium.png (máscara, se colorea con CSS). Nimus va inline en index.html
assets/og.jpg       Imagen para compartir (1200×630)
```

## Publicar

1. Sube esta carpeta a un repo o arrástrala en vercel.com/new (Framework: Other, sin build command).
2. En Settings → Environment Variables agrega `WAITLIST_WEBHOOK_URL`: la URL que recibe cada registro
   como JSON (`email, name, habitat, size, consent, source, ts`). Sirve un Google Apps Script que
   escriba en una hoja, o un webhook de Make, Zapier o Formspree.
3. Sin esa variable el formulario responde con error (503): no finge que el registro se guardó.

## Pendientes de contenido

- Confirmar fecha de avance o lanzamiento (el texto evita prometer una fecha).
- Validar con Biofilium el texto botánico y las plantas recomendadas.
- Sustituir los fotogramas micro y macro (recreaciones digitales) por micrografías o macros reales.
- Reemplazar `assets/logos/biofilium.png` por el vector oficial cuando esté disponible.
- Ajustar `og:image` a URL absoluta cuando exista el dominio final.

## Local

```
python -m http.server 4173
```

El servidor local no ejecuta `/api`; para probar el formulario completo usa `vercel dev`.
