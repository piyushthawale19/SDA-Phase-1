// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import 'remixicon/fonts/remixicon.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
 
 
//     <App />
  
  
// )
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "remixicon/fonts/remixicon.css";
import App from "./App.jsx";

import { ThemeProvider } from "./context/theme.context";
import { UserProvider } from "./context/user.context";

createRoot(document.getElementById("root")).render(
  <UserProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </UserProvider>
);
