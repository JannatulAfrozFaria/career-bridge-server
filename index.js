const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb/lib/bson');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
    origin: ['http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

console.log(process.env.CAREER_PASS) //

//MONGODB
const uri = `mongodb+srv://${process.env.CAREER_USER}:${process.env.CAREER_PASS}@cluster0.sirqfba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middlewares initiated by Us
const logger = async(req,res,next)=>{
    console.log('called', req.hostname,req.originalUrl,req.method )
    next();
}
const verifyToken = async(req,res,next) =>{
    const token = req?.cookies?.token;
    console.log('value of token in middleware: ' , token)
    //if no token is available
    if(!token){
        return res.status(401).send({message: 'not authorized'})
    }
    //verifying jwt
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
        //error
        if (err){
            console.log(err);
            return res.status(401).send({message: 'unauthorized access'})
        }
        //if token is valid, then it would be decoded
        console.log('value in the token', decoded)
        req.user = decoded;
        next();
    })
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollection = client.db('careerDB').collection('job');
    const appliedJobCollection = client.db('careerDB').collection('appliedJob');
    const userCollection = client.db('careerDB').collection('user');
    // const jobCategoryCollection = client.db('careerDB').collection('jobCategory');

      //-----USING JWT--------
      app.post('/jwt', logger, async (req,res)=>{
        const user = req.body;
        console.log( 'user for token', user);
        //token generation with jwt
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'} )
        
        res.cookie('token',token,{
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
        .send({success: true})
    })

    app.post('/logout',async(req,res)=>{
        const user = req.body;
        console.log('logging out', user)
        res.clearCookie('token', {maxAge: 0} ).send({success: true})
    })

    //--------CREATE----SECTION--------//
    //add A new Job
    app.post('/job',async(req,res)=>{
        const newJob = req.body;
        console.log(newJob);
        const result = await jobCollection.insertOne(newJob);
        res.send(result);
    })

    //---------READ----SECTION-----
    //all Jobs section
    app.get('/job', logger, async(req,res)=>{
        //using -----JWT-----START-----///
        // console.log('token of Job By Category', req.cookies.token);
        //--------  JWT CODE ENDS--------//
        const cursor = jobCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    
  

    // job -----DETAILS------
    app.get('/job/:id', logger, async(req,res)=>{
        // console.log('cook cookies',req.cookies)
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobCollection.findOne(query);
        res.send(result);
    })
    //myJobs-------
    app.get("/myJobs/:email",async(req,res)=>{
        const query = {email: req.params.email }
        const result = await jobCollection.find(query).toArray();
        res.send(result);
    })

    //Update Job-------
    app.put('/job/:id', async(req,res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true};
        const updatedJob = req.body;
        const job = {
            $set:{
                 photo: updatedJob.photo,
                 job: updatedJob.job,
                  description: updatedJob.description,
                  category: updatedJob.category,
                  postdate: updatedJob.postdate,
                  range: updatedJob.range,
                  deadline: updatedJob.deadline,
            }
        }
        const result = await jobCollection.updateOne(filter,job,options);
        res.send(result);
    })
    //DELETE JOB-------
    app.delete('/job/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobCollection.deleteOne(query);
        res.send(result);
    })

    //Submit Application
    app.post('/appliedJobs',async(req,res)=>{
        const appliedJob = req.body;
        console.log(appliedJob);
        const result = await appliedJobCollection.insertOne(appliedJob);
        res.send(result);
    })

    //API ------For USER--------
    //receiving data from register.jsx -----step---1
    app.post ('/user',async (req,res)=>{
        const user = req.body;
        console.log(user);
        const result = await userCollection.insertOne(user);
        res.send(result);
    })
    //step-----2--------
    app.get('/user' , async (req,res)=>{
        const cursor = userCollection.find();
        const users = await cursor.toArray();
        res.send(users);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Career Bridge Server is running')
})
app.listen(port,()=>{
    console.log(`Career Bridge Server is running on port ${port}`)
})