import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (projectId) => {
  socketInstance = socket(import.meta.env.VITE_API_URL, {
    auth: {
      token: localStorage.getItem("token"),
    },
    query: {
      projectId,
    },
    // Fast response timeout - results under 1 minute
    timeout: 70000, // 70 seconds (slightly more than AI timeout)
    reconnectionDelay: 1000,
    reconnectionDelayMax: 3000,
    reconnectionAttempts: 3,
  });
  return socketInstance;
};
export const receiveMessage = (eventName, cb) => {
  socketInstance.on(eventName, cb);
};
export const sendMessage = (eventName, data) => {
  socketInstance.emit(eventName, data);
};
