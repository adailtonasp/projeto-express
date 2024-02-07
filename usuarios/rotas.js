const express = require('express');
const router = express.Router();
const router_loginON = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs')

const auth = require('../middleware/autenticaUsuario');
const salt = auth.salt
const secret_key = auth.secret_key


function abrirUsuarios(){
    const arquivo = fs.readFileSync('./usuariosBD.json',{encoding: 'utf8'})
    return JSON.parse(arquivo)
}

function salvarUsuarios(){
    fs.writeFileSync( './usuariosBD.json',JSON.stringify(usuarios) )
}

let usuarios = abrirUsuarios()

//funcao para salvar hash do usuario no body do usuario
const salvarHash = (req,res,next) => {
    req.body.senha = bcrypt.hashSync(req.body.senha,salt);
    // req.body.senha = crypto.createHash('sha256').update(req.body.senha).digest('hex');
    return next()
}

//middleware para verificacao de body de cadastro
const verificaBodyCadastro = (req,res,next) =>{

    if(!req.body.usuario || !req.body.email || !req.body.senha){
        const err = new Error('Erro no body ao cadastrar usuario')
        err.statusCode = 400 
        return next(err)
    }
    return next()
}

//middleware para verificar body no login
const verificaBodyLogin = (req,res,next) =>{

    if(!req.body.email || !req.body.senha){
        const err = new Error('Erro no body ao efetuar login')
        err.statusCode = 400 
        return next(err)
    }
    return next()
}

//middleware para verificar usuario ja existente
const verificaUsuarioExistente = (req,res,next) =>{
    
    const email = req.body.email;

    const usuario = usuarios.find((e) => {return e.email == email})

    if(usuario){
        const err = new Error('Email informado ja em uso');
        err.statusCode = 406
        return next(err)
    }

    return next();
}

//rota para mostrar cadastro de usuario
router.get('/cadastrar',(req,res,next)=>{
    res.sendFile(__dirname + '/assets/cadastra_usuario.html');
})


//rota para cadastrar um usuario
router.post('/cadastrar',verificaBodyCadastro,verificaUsuarioExistente,salvarHash,(req,res,next)=>{

    const id = crypto.randomUUID();
    usuarios.push({
        id,
        ...req.body,
        produtos : []
    })

    res.send({
        id
    });

    salvarUsuarios()
})

//rota para mostrar os produtos de um usuario
router.post('/pesquisar',(req,res,next) => {
    usuarios = abrirUsuarios()
    
    const email = req.body.email;

    const usuario = usuarios.find(e => e.email == email)

    if(!usuario){
        const err = new Error('Usuario nao encontrado');
        err.statusCode = 204
        return next(err)
    }

    res.send({
        usuario: usuario.usuario,
        email: usuario.email,
        produtos: usuario.produtos
    }); 
    
})

//efetuar login do usuario
router.post('/login',verificaBodyLogin,(req,res,next)=>{
    usuarios = abrirUsuarios()
    
    //forma o hash
    const hash  = bcrypt.hashSync(req.body.senha,salt)

    const email = req.body.email
    //compara com a hash do usuario
    const usuarioIndice = usuarios.findIndex(e => e.email == email)

    if(usuarioIndice == -1){
        const err = new Error('Usuario nao encontrado');
        err.statusCode = 204
        return next(err)
    }

    const usuario = usuarios[usuarioIndice];

    if(hash == usuario.senha){

        const token = jwt.sign({
            id: usuario.id,
            email: usuario.email,
            senha: usuario.senha
        }, secret_key)

        fs.writeFileSync('./usuarios/tokens/login.json',JSON.stringify({token,usuario}),{flag:'w'})

        let caminho = __dirname.split('\\')
        caminho.pop()
        caminho = caminho.join('/')

        res.sendFile(caminho +'/produtos/assets/cadastrar_produtos.html')

    }else{
        const err = new Error('Senha incorreta')
        err.statusCode = 400
        return next(err)
    }
    
})

//efetuar logoff do usuario
router.get('/logoff',(req,res,next)=>{

    //limpa o json que guarda o token
    fs.writeFileSync('./usuarios/tokens/login.json',JSON.stringify(''),{flag:'w'})

    //salva os dados do usuario no json do banco
    salvarUsuarios()

    let caminho = __dirname.split('\\')
    caminho.pop()

    caminho = caminho.join('/')

    res.sendFile(caminho+'/assets/index.html')
    
})

module.exports = {
    router
}