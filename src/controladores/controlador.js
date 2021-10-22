const { format } = require('date-fns');
const dados = require('../bancodedados');

function listarContas(req, res) {
    const {senha_banco} = req.query

    if (!senha_banco){
        return res.status(400).json("Por favor, informe a senha.")
    }

    if (senha_banco !== "Cubos123Bank") {
        return res.status(400).json("Senha está incorreta, tente novamente")
    }

    res.json(dados.contas);
}

function criarConta(req, res) {
    const {nome, cpf, data_nascimento, telefone, email, senha} = req.body;

    const id = dados.contas.length == 0? 1: Number(dados.contas[dados.contas.length - 1].numero) + 1;

    if (!nome) return res.status(400).json({mensagem: 'Informe o nome do usuario'});
    if (!cpf) return res.status(400).json({mensagem: 'Informe o CPF do usuario'});
    if (!data_nascimento) return res.status(400).json({mensagem: 'Informe a data de nascimento do usuario'});
    if (!telefone) return res.status(400).json({mensagem: 'Informe o telefone do usuario'});
    if (!email) return res.status(400).json({mensagem: 'Informe o email do usuario'});
    if (!senha) return res.status(400).json({mensagem: 'Informe a senha do usuario'});

    if (dados.contas.length > 0) {
        const cpfExistente = dados.contas.find(valor => valor.usuario.cpf === cpf)
        const emailExistente = dados.contas.find(valor => valor.usuario.email === email)

        if (cpfExistente || emailExistente) {
            return res.status(400).json({
                mensagem: `CPF ou Email já existente no sistema.` 
            })
        }
    }

    let contaCriada = {
        numero:  id.toString(),
        saldo: 0,
        usuario: req.body
    }

    dados.contas.push(contaCriada)

    res.status(201).json(contaCriada)
}

function atualizarUsuarioConta (req, res) {
    const { numeroConta } = req.params;
    const validaNumero = dados.contas.find(valor => valor.numero === numeroConta);
    const {nome, cpf, data_nascimento, telefone, email, senha} = req.body;

    if (!validaNumero) {
        return res.status(404).json({
            mensagem: "O usuario não foi encontrado."
        })
    }

    if (!nome && !cpf && !data_nascimento && !telefone && !email && !senha) {
        res.status(400).json({
            mensagem: "Informe ao menos um campo para atualização."
        })
    }
    
    if (cpf || email) {
        const cpfExistente = dados.contas.find(valor => valor.usuario.cpf === cpf)
        const emailExistente = dados.contas.find(valor => valor.usuario.email === email)

        if (cpfExistente || emailExistente) {
            return res.status(400).json({
                mensagem: `CPF ou Email já existente no sistema.` 
            })
        }
    }

    const index = dados.contas.findIndex(valor => valor.numero === numeroConta);
    const contaInfo = dados.contas[index];

    if (nome) {
        contaInfo.usuario.nome = nome
    }
    if (cpf) {

        contaInfo.usuario.cpf = cpf
    }
     if (data_nascimento) {

        contaInfo.usuario.data_nascimento = data_nascimento
    } 
    if (telefone) {

        contaInfo.usuario.telefone = telefone
    }
    if (email) {

        contaInfo.usuario.email = email
    }
    if (senha) {

        contaInfo.usuario.senha = senha
    }

    res.status(200).json({
        mensagem: "Conta atualizada com sucesso!"
    })

}

function excluirConta(req, res) {
    const { numeroConta } = req.params;
    const validaNumero = dados.contas.find(valor => valor.numero === numeroConta);

    if (!validaNumero) {
        return res.status(404).json({
            mensagem: "O usuario não foi encontrado."
        })
    }

    const index = dados.contas.findIndex(valor => valor.numero === numeroConta);
    const contaInfo = dados.contas[index];

    if (contaInfo.saldo > 0) {
        return res.status(400).json({
            mensagem: "Existe saldo positivo na conta, zere antes de poder apagar!"
        })
    }

    dados.contas.splice(index, 1)
    res.status(200).json({
        mensagem: "Conta excluída com sucesso!"
    })

}

function depositar(req, res) {
    const { numero_conta, valor } = req.body;

    if (!numero_conta || !valor){
        return res.status(400).json({
            mensagem: "Informe o numero da conta e o valor a ser depositado!"
        })
    }

    const validaNumero = dados.contas.find(infos => infos.numero === numero_conta);

    if (!validaNumero) {
        return res.status(404).json({
            mensagem: "O usuario não foi encontrado."
        })
    }

    if (valor <= 0) {
        return res.status(400).json({
            mensagem: "O valor informado para depósito não pode ser zero ou negativo."
        })
    }

    const index = dados.contas.findIndex(infos => infos.numero === numero_conta);
    const contaInfo = dados.contas[index];

    contaInfo.saldo += valor;
    dados.depositos.push({
        data: format(new Date(), 'yyyy-MM-dd, HH:mm:ss' ),
        numero_conta: numero_conta,
        valor: valor
    })

    res.status(200).json({
        mensagem: "Depósito realizado com sucesso!"
    })
}

function sacar(req, res) {
    const {numero_conta, valor, senha} = req.body;

    if (!numero_conta || !valor || !senha){
        return res.status(400).json({
            mensagem: "Informe o numero da conta, valor e a senha para realizar o saque!"
        })
    }

    const validaNumero = dados.contas.find(infos => infos.numero === numero_conta);

    if (!validaNumero) {
        return res.status(404).json({
            mensagem: "O usuario não foi encontrado."
        })
    }

    if (senha !== validaNumero.usuario.senha) {
        return res.status(400).json({
            mensagem: "Senha está incorreta, tente novamente."
        })
    }

    if (validaNumero.saldo < valor) {
        return res.status(400).json({
            mensagem: "Não existe saldo suficiente para o saque."
        })
    }

    const index = dados.contas.findIndex(infos => infos.numero === numero_conta);
    const contaInfo = dados.contas[index];

    contaInfo.saldo -= valor;
    dados.saques.push({
        data: format(new Date(), 'yyyy-MM-dd, HH:mm:ss' ),
        numero_conta: numero_conta,
        valor: valor
    })

    res.status(200).json({
        mensagem: "Saque realizado com sucesso!"
    })

}

function transferir(req, res) {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body

    if (!numero_conta_origem || !numero_conta_destino || !valor || !senha){
        return res.status(400).json({
            mensagem: "Informe todos os campos necessarios para a transferência!"
        })
    }

    const validaContaOrigem = dados.contas.find(infos => infos.numero === numero_conta_origem);
    const validaContaDestino = dados.contas.find(infos => infos.numero === numero_conta_destino);

    if (!validaContaOrigem) {
        return res.status(404).json({
            mensagem: "A conta de origem não foi encontrado."
        })
    }

    if (!validaContaDestino) {
        return res.status(404).json({
            mensagem: "A conta de destino não foi encontrado."
        })
    }

    if (senha !== validaContaOrigem.usuario.senha) {
        return res.status(400).json({
            mensagem: "Senha está incorreta, tente novamente."
        })
    }

    if (validaContaOrigem.saldo < valor) {
        return res.status(400).json({
            mensagem: "Não existe saldo suficiente na conta de origem para a transferência."
        })
    }

    const indexOrig = dados.contas.findIndex(infos => infos.numero === numero_conta_origem);
    const contaOrig = dados.contas[indexOrig];
    contaOrig.saldo -= valor;

    const indexDest = dados.contas.findIndex(infos => infos.numero === numero_conta_destino);
    const contaDest = dados.contas[indexDest];
    contaDest.saldo += valor;

    dados.transferencias.push({
        data: format(new Date(), 'yyyy-MM-dd, HH:mm:ss' ),
        numero_conta_origem: numero_conta_origem,
        numero_conta_destino: numero_conta_destino,
        valor: valor
    })

    res.status(200).json({
        mensagem: "Transferência realizada com sucesso!"
    })

}

function saldo(req, res) {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha){
        return res.status(400).json({
            mensagem: "Informe o numero da conta e a senha para consultar o saldo!"
        })
    }

    const validaNumero = dados.contas.find(infos => infos.numero === numero_conta);

    if (!validaNumero) {
        return res.status(404).json({
            mensagem: "O usuario não foi encontrado."
        })
    }

    if (senha !== validaNumero.usuario.senha) {
        return res.status(400).json({
            mensagem: "Senha está incorreta, tente novamente."
        })
    }

    res.status(200).json({
        saldo: validaNumero.saldo
    })
}

function extrato(req, res) {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha){
        return res.status(400).json({
            mensagem: "Informe o numero da conta e a senha para consultar o extrato!"
        })
    }

    const validaNumero = dados.contas.find(infos => infos.numero === numero_conta);

    if (!validaNumero) {
        return res.status(404).json({
            mensagem: "O usuario não foi encontrado."
        })
    }

    if (senha !== validaNumero.usuario.senha) {
        return res.status(400).json({
            mensagem: "Senha está incorreta, tente novamente."
        })
    }

    const listaSaques = dados.saques.filter(valor => valor.numero_conta === numero_conta);
    const listaDepositos = dados.depositos.filter(valor => valor.numero_conta === numero_conta);
    const transferenciasEnviadas = dados.transferencias.filter(valor => valor.numero_conta_origem === numero_conta);
    const transferenciasRecebidas = dados.transferencias.filter(valor => valor.numero_conta_destino === numero_conta);

    res.json({
        depositos: listaDepositos,
        saques: listaSaques,
        transferenciasEnviadas: transferenciasEnviadas,
        transferenciasRecebidas: transferenciasRecebidas
    })

}


module.exports = { listarContas, criarConta, atualizarUsuarioConta, excluirConta, depositar, sacar, transferir, saldo, extrato }