// import axios from 'axios';



// const axiosInstance = axios.create({
//     baseURL:import.meta.env.VITE_API_URL,
//     headers: {
//         "Authorization" : `Bearer ${localStorage.getItem("token")}`
//     }
// })

// export default axiosInstance;


import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token dynamically before each request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization; // clean up if no token
  }
  return config;
});

export default axiosInstance;
