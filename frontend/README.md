# Interfaz web del motor de horarios

Proyecto Angular 18 con componentes independientes. Se comunica con el backend por la API REST
descrita en `CONTRATO_M3.md` y envía el token JWT en cada solicitud.

Desarrollo local con el backend corriendo en el puerto 8080:

```
npm install
npm start
```

Abre http://localhost:4200. Las rutas `/api` se redirigen al backend con `proxy.conf.json`.
En Docker la interfaz la sirve nginx y la redirección la hace `nginx.conf`.
