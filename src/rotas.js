const express = require('express');
const controlador = require('./controladores/controlador')

const rotas = express();

rotas.get('/contas', controlador.listarContas);
rotas.post('/contas', controlador.criarConta);
rotas.put('/contas/:numeroConta/usuario', controlador.atualizarUsuarioConta);
rotas.delete('/contas/:numeroConta', controlador.excluirConta );
rotas.post('/transacoes/depositar', controlador.depositar);
rotas.post('/transacoes/sacar', controlador.sacar);
rotas.post('/transacoes/transferir', controlador.transferir);
rotas.get('/contas/saldo', controlador.saldo);
rotas.get('/contas/extrato', controlador.extrato);

module.exports = rotas