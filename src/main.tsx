
import { createRoot } from "react-dom/client";
import { Toaster } from 'sonner';
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <Toaster richColors position="top-right" />
    <App />
  </>
);
  