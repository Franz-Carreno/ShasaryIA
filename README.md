Shasary.IA — Local test proxy and UI

Instrucciones rápidas:

1) Instala dependencias y arranca el proxy local (lee la API key desde `.env`):

```powershell
cd d:\PAG_NUTRI\stitch_downloads
npm install
npm start
```

2) Abre en el navegador desde el proxy:

http://localhost:3000/Shasary_IA_Chat_Interface.html

3) El servidor expondrá POST /api/respond y la UI ya está configurada para usar una ruta relativa en el origen actual (`/api/respond`).

Notas:
- El archivo `.env` ya incluido puede contener `GEMINI_API_KEY`. El servidor lo recupera mediante `process.env.GEMINI_API_KEY`.
- El proxy también puede usar credenciales de cuenta de servicio si defines `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un JSON de servicio válido de Google Cloud.
- Si usas cuenta de servicio, haz:
  ```powershell
  $env:GOOGLE_APPLICATION_CREDENTIALS="D:\ruta\a\service-account.json"
  npm start
  ```
- Si usas API key, asegúrate de que `Generative Language API` esté habilitada en Google Cloud y que la clave no tenga restricciones que bloqueen `generativelanguage.googleapis.com`.
