export const createCorsConfig = () => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Configuraciones para evitar problemas de CORS
    withCredentials: false,
    timeout: 60000,
    // Agregar configuración para manejar preflight
    maxRedirects: 0,
  };
};