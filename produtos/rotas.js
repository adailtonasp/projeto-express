const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');

const auth = require('../middleware/autenticaUsuario');
const autenticacao = auth.autenticacao_token
const salt = auth.salt
const secret_key = auth.secret_key


//funcao para salvar as alteracoes dos usuarios no json
function salvarProdutoJson(usuario){

    const arquivo = fs.readFileSync('./usuariosBD.json',{encoding:'utf8'})
    const usuarios = JSON.parse(arquivo)

    const usuarioIndex = usuarios.findIndex(e => {return e.id == usuario.id})

    if(usuarioIndex == -1)
        return false
    
    usuarios[usuarioIndex] = usuario

    fs.writeFileSync('./usuariosBD.json',JSON.stringify(usuarios))

    return true
    
}

const upload = multer({
    //propriedade para limitar o tipo de arquivo para imagem
    fileFilter : (req,file,callback) => {
        if(!file.mimetype.startsWith('image')){
            callback('Formato de arquivo invalido',false)
        }
        callback(null,true);
    },
    //propriedade para limitar tamanho a 1 megabyte
    limits: {
        fileSize: 1024 * 1024, //bytes

    },
    //propriedade para definir o local de armazenamento e nome da foto
    storage : multer.diskStorage({
        filename: (req,file,callback) => {
            req.body.img_code = crypto.randomUUID(),
            callback(null,req.body.img_code + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        },
        destination: (req,file,callback) => {
            callback(null, __dirname + '/uploads')
        }
    })
})

router.get('/',(req,res)=>{
    res.sendFile(__dirname + '/assets/cadastrar_produtos.html');
});

//cadastro de produto
router.post('/',autenticacao,upload.single('foto'),(req,res,next)=>{

    const id = crypto.randomUUID();
    produto = {
        id,
        ...req.body,
        imagem: req.file.originalname
    }

    //adicionando produto na lista de produtos do usuario
    req.headers.usuario.produtos.push(produto)

    //salvar o usuario no json
    if(!salvarProdutoJson(req.headers.usuario)){
        const err = new Error('Erro ao adicionar produto ao usuario');
        err.statusCode = 400
        return next(err)
    }

    res.sendFile(__dirname+'/assets/cadastrar_produtos.html')

    // return next()

})

//a edicao do produto é feita inserido um novo produto no lugar
router.put('/:id',autenticacao,(req,res,next) => {
    const id = req.params.id;
    const produto_indice = produtos.findIndex(e => e.id == id);
    if(produto_indice == -1){
        const err = new Error('Produto nao encontrado')
        err.statusCode = 204
        return next(err)
    }
    produtos[produto_indice] = {
        id,
        ...req.body
    }

    res.send(produtos);

})

//remocao de produto
const deletarProduto = (req,res,next) => {

    const id = req.body.id;

    const usuario = req.headers.usuario

    const produtos = usuario.produtos

    const index = produtos.findIndex(e => {e.id == id})

    usuario.produtos.splice(index,1)  

    if(!salvarProdutoJson(req.headers.usuario)){
        const err = new Error('Erro ao adicionar produto ao usuario');
        err.statusCode = 400
        return next(err)
    }    
    
    res.send({message: 'produto excluido'})
}

router.post('/deletar',autenticacao,deletarProduto)

//download de produto
router.get('/:id',(req,res,next) => {
    const userAgent = req.headers['user-agent']

    const id = req.params.id

    const arquivo = fs.readFileSync('./usuariosBD.json',{encoding:'utf8'})

    const usuarios = JSON.parse(arquivo)

    const produtos = []

    for(let i = 0; i < usuarios.length; i++){
        for(let j = 0; j < usuarios[i].produtos.length;j++){
            produtos.push(usuarios[i].produtos[j])
        }
    }

    const produto_indice = produtos.findIndex(e => e.id == id)
    if(produto_indice == -1){
        const err = new Error('Produto nao encontrado')
        err.statusCode = 204
        return next(err);
    }

    if(userAgent.startsWith('insomnia')){
        res.sendFile(__dirname + '/uploads/' + produtos[produto_indice].img_code + '.' +produtos[produto_indice].imagem.split('.')[produtos[produto_indice].imagem.split('.').length-1])
    }else{
        res.download(__dirname + '/uploads/' + produtos[produto_indice].img_code + '.' +produtos[produto_indice].imagem.split('.')[produtos[produto_indice].imagem.split('.').length-1])
    }

    return next();
})

module.exports = {
    router
}