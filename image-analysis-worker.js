import { analyzeImage } from './image-analysis.js?v=20260913-limit-100';
self.onmessage=({data})=>{
  try {const result=analyzeImage(data);self.postMessage(result,[result.preview.buffer]);}
  catch(error){self.postMessage({errorMessage:error.message});}
};
