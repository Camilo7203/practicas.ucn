import axios from 'axios';

const API = axios.create({
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  }
});

API.interceptors.request.use(
  (config: any) => {
    return config;
  },
  (error: any) => {
    console.error('Error en el request:', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    console.error('Error en la respuesta del API:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default API;