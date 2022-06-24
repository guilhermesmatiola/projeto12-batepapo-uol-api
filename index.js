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

    const promise = db.collection('users').find().toArray();
    
    promise.then(participants => res.send(participants));
    
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
    const { user } = req.headers;
    const promise = db.collection('users').find({name:user}).toArray();
    promise.then(userdata => {
       if(userdata){
        db.collection('users').updateOne({name:user},{ $set:{ lastStatus: Date.now()}});
        res.sendStatus(200);
       }else{
        res.sendStatus(404);
       }
    });
});

setInterval(isOnline, 15000);

async function isOnline(){

    try{
        const participants = await db.collection("users").find().toArray();

        for(let i=0;i<participants.length;i++){
            if( (Date.now()-participants[i].lastStatus) > 10000 ){
                const message = {from: participants[i].name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format("HH:mm:ss")};
                
                //await 
                db.collection('messages').insertOne(message);
                //await 
                db.collection('users').deleteOne(participants[i]);
            }
        }
    }
    catch (error){
        res.sendStatus(500);
    }
}

app.listen(5000, ()=>{
    console.log(chalk.bold.yellow("server on"));
});