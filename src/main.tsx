// Importa o React, necessário para trabalhar com JSX e componentes
import React from 'react';
// Importa o createRoot, a nova API de renderização do React 18
import { createRoot } from 'react-dom/client';
// Importa o componente principal da aplicação
import App from './App';
// Importa os estilos globais definidos no index.css
import './index.css';

// Obtém o elemento HTML onde a aplicação React será montada
const container = document.getElementById("root");

// Caso o elemento não exista, lança um erro para evitar falhas silenciosas
if (!container) {
  throw new Error("Root element not found");
}

// Cria a raiz React usando a API moderna do React 18
const root = createRoot(container);

// Renderiza a aplicação dentro do StrictMode
// StrictMode ativa verificações adicionais durante o desenvolvimento
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
