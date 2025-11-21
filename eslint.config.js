import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignora a pasta de build 'dist' para que o ESLint não a verifique
  { ignores: ["dist"] },

  {
    // Estende as configurações recomendadas do ESLint e do TypeScript ESLint
    extends: [js.configs.recommended, ...tseslint.configs.recommended],

    // Aplica estas regras a todos os arquivos .ts e .tsx
    files: ["**/*.{ts,tsx}"],

    // Configurações da linguagem
    languageOptions: {
      ecmaVersion: 2020, // Define a versão do ECMAScript
      globals: globals.browser, // Define as variáveis globais do ambiente do navegador
    },

    // Plugins utilizados
    plugins: {
      "react-hooks": reactHooks, // Plugin para regras de React Hooks
      "react-refresh": reactRefresh, // Plugin para o React Refresh
    },

    // Regras específicas do ESLint
    rules: {
      // Aplica as regras recomendadas do plugin de React Hooks
      ...reactHooks.configs.recommended.rules,

      // Adverte sobre componentes que não são exportados corretamente para o React Refresh
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true }, // Permite a exportação de constantes
      ],

      // Desativa a regra de variáveis não utilizadas do TypeScript, pois pode gerar falsos positivos
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
