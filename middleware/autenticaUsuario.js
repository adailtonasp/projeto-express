
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { isUtf8 } = require('buffer');

const salt = '$2b$10$/h92w.9hShA4FObYJcQtdu'

const secret_key = 'super_senha_secreta_123'

const autenticacao_token = (req,res,next) => {
    //vai precisar abrir o arquivo

    const arquivo = fs.readFileSync('./usuarios/tokens/login.json',{encoding:'utf8'})
    const dado = JSON.parse(arquivo)
    const token = dado.token
    const usuario = dado.usuario

    jwt.verify(token,secret_key,(err,payload)=>{
        if(err){
            // response.status(401).send('token invalido')
            const err = new Error('token invalido')
            err.statusCode = 401
            return next(err)
        }else{
            req.headers.usuario = usuario 
            return next()
        }
        
    })
}

module.exports = {
    autenticacao_token,
    secret_key, 
    salt
}