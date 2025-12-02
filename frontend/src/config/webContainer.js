// import { WebContainer } from '@webcontainer/api';

// let webContainerInstance = null;

// export const getWebContainer =async () =>{
//     if(webContainerInstance === null){
//         webContainerInstance= await WebContainer.boot();
//     }
//     return webContainerInstance;
// }

// import { WebContainer } from "@webcontainer/api";

// let webContainerInstance = null;

// export const getWebContainer = async () => {
//   if (!webContainerInstance) {
//     webContainerInstance = await WebContainer.boot();
//   }
//   return webContainerInstance;
// };


import { WebContainer } from "@webcontainer/api";

let webContainerInstance = null;

export const getWebContainer = async () => {
  if (!webContainerInstance) {
    webContainerInstance = await WebContainer.boot();
    console.log("WebContainer booted ✅");
  }
  return webContainerInstance;
};
