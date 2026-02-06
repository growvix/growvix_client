import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import App from "./App";
import "./index.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { apolloClient } from "@/lib/apolloClient";

ReactDOM.createRoot(document.getElementById("root")!).render(

  <ApolloProvider client={apolloClient}>
    <BrowserRouter>
      <ThemeProvider storageKey="vite-ui-theme" defaultTheme="system">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </ApolloProvider>

);

