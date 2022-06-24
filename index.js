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
    }catch (error){
        res.sendStatus(500);
    }
    
});

app.get("/participants", async (req, res)=>{


    try {
        const usuarios = db.collection("users").find().toArray();
        res.sendStatus(usuarios);

    }catch (error){
        res.sendStatus(500);
    }
    
});

app.post("/messages", (req,res)=> {

});

app.get("/messages", (req, res) => {
    
});

app.post("/status", (req, res) => {
    
});


app.listen(5000, ()=>{
    console.log(chalk.bold.yellow("server on"));
});