"use strict";
// Este é um script Node.js para atribuir privilégios de administrador a um usuário no Firestore.
// ATENÇÃO: Este arquivo parece ser um JavaScript compilado a partir de TypeScript. 
// As alterações devem, idealmente, ser feitas no arquivo-fonte TypeScript original.

// Polyfills e helpers para código assíncrono (gerados pelo compilador TypeScript)
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });

// Importa as funções necessárias do Firestore e a configuração do cliente Firebase
var firestore_1 = require("firebase/firestore");
var client_1 = require("./src/integrations/firebase/client");

// --- CONFIGURAÇÃO ---
// Defina aqui o email do usuário que você deseja tornar administrador.
var emailToMakeAdmin = 'leticiaconforte@gmail.com';

// Função assíncrona que executa a lógica para dar privilégios de admin
var grantAdminPrivileges = function () { return __awaiter(void 0, void 0, void 0, function () {
    var profilesRef, q, querySnapshot, batch_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Procurando usuário com o email: ".concat(emailToMakeAdmin));
                
                // Cria uma referência à coleção 'profiles' no Firestore
                profilesRef = (0, firestore_1.collection)(client_1.db, 'profiles');
                
                // Cria uma consulta para encontrar documentos onde o campo 'email' é igual ao email especificado
                q = (0, firestore_1.query)(profilesRef, (0, firestore_1.where)('email', '==', emailToMakeAdmin));
                
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                // Executa a consulta
                return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
            case 2:
                querySnapshot = _a.sent();
                
                // Verifica se algum usuário foi encontrado
                if (querySnapshot.empty) {
                    console.error('ERRO: Nenhum usuário encontrado com este email.');
                    return [2 /*return*/];
                }
                
                // Inicia um lote de gravação para garantir que todas as atualizações sejam atômicas
                batch_1 = (0, firestore_1.writeBatch)(client_1.db);
                
                // Itera sobre os resultados da busca (pode haver mais de um, embora seja improvável para emails)
                querySnapshot.forEach(function (doc) {
                    console.log("Usuário encontrado: ".concat(doc.id, ". Atualizando para admin..."));
                    // Adiciona uma operação de atualização ao lote para definir 'access_type' como 'admin'
                    batch_1.update(doc.ref, { access_type: 'admin' });
                });
                
                // Executa todas as operações no lote
                return [4 /*yield*/, batch_1.commit()];
            case 3:
                _a.sent();
                console.log('Sucesso! O usuário agora tem permissões de administrador.');
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('Ocorreu um erro ao tentar atualizar o usuário:', error_1);
                return [3 /*break*/, 5];
            case 5:
                // Encerra o processo Node.js para evitar que o script fique em execução
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); };

// Executa a função principal
grantAdminPrivileges();
