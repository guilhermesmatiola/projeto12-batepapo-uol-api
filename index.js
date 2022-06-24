import express  from "express";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from "dotenv";
import {MongoClient} from "mongodb";
import chalk from "chalk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URL);
let db;

mongoClient.connect().then(()=> {
    db=mongoClient.db("batepapouol");
});

app.post("/participants", async (req, res)=>{

    const {name} = req.body;

    try {
        //salvar participante
        await db.collection("users").insertOne(
            {
                name:name,
                lastStatus: Date.now()
            }
        );
        //salvar mensagem de entrada do participante
        await db.collection("messages").insertOne(
            {
                from: name,
                to: "Todos",
                text: " entra na sala...",
                type: "status",
                time: dayjs().format("HH:mm:ss")
            }
        );

        res.sendStatus(201);
    }
    catch (error){
        res.sendStatus(500);
    }
    
});

app.get("/participants", async (req, res)=>{

    try {
        const usuarios = db.collection("users").find().toArray();
        res.sendStatus(usuarios);

    }
    catch (error){
        res.sendStatus(500);
    }
    
});

app.post("/messages", async (req,res)=> {

    const {to, text, type} = req.body;
    const from = req.header("user");

    try{
        await db.collection("messages").insertOne(
            {
                from,
                to,
                text,
                type,
                time: dayjs().format("HH:mm:ss")
            }
        );res.sendStatus(201);

    }
    catch (error){
        res.sendStatus(500);
    }
});

app.get("/messages", async (req, res) => { //
    
    const limit = parseInt(req.query.limit);
    const user = req.header("user");

    try{
        const messages = await db.collection("messages").find({}).toArray();
        const messagesFilter = messages.filter( (message)=>{
            const {from,to,type} = message;
            if(from === user || to === "Todos" || type === 'status'|| type === 'message' || (type === 'private_message' && to === user)){
                return true;
            }
            else{
                return false;
            }
        });

        if (limit) {
            const messagesLimit = messagesFilter.slice(-limit);
            return res.send(messagesLimit);
          }
      
          res.send(messagesFilter);

    }
    catch (error){
        res.sendStatus(500);
    }

});

app.post("/status", (req, res) => {
    
});


app.listen(5000, ()=>{
    console.log(chalk.bold.yellow("server on"));
});