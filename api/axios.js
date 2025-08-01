// src/api/axios.js

import axios from 'axios';

// Helper function to get cookie by name
// function getCookie(name) {
//   const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//   if (match) return match[2];
//   return null;
// }

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_APP_API_URL}/api`, 
    withCredentials: true, // send cookies

});

instance.interceptors.request.use(
  (config) => {
    // console.log("document.cookie", document.cookie);

    // const token = getCookie('token');
    // console.log("token", token);

    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
