const express = require('express');
const app = express();
const porta = 3000;

app.use(express.json());
app.use(express.urlencoded({
    extended:true
}))

const routerUsuarios = require('./usuarios/rotas');
const routerProdutos = require('./produtos/rotas');

app.use('/usuarios',routerUsuarios.router);
app.use('/produtos',routerProdutos.router);



app.use((error,req,res,next) => {
    console.log(error.message)
    res.status(error.statusCode).sendFile(__dirname+'/assets/'+error.statusCode+'-cat.jpg')
})

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/assets/index.html')
})

//metodo para fazer o vinculo de um produto a um cliente
app.post('/comprar',(req,res) => {
    res.send('OK');
})

app.listen(porta,() => {console.log('Servidor iniciado na porta',porta)});