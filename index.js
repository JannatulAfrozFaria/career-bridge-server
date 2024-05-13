const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb/lib/bson');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollection = client.db('careerDB').collection('job');
    const appliedJobCollection = client.db('careerDB').collection('appliedJob');
    const jobCategoryCollection = client.db('careerDB').collection('jobCategory');

    //-------HOME PAGE-----JOB CATEGORY SECTION-----//
    app.get('/jobCategory',async(req,res)=>{
        const cursor = jobCategoryCollection.find();
        const result = await cursor.toArray();
        res.send(result);
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
    app.get('/job',async(req,res)=>{
        const cursor = jobCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    // job -----DETAILS------
    app.get('/job/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobCollection.findOne(query);
        res.send(result);
    })
    //myJobs-------
    app.get("/myJobs/:email", async(req,res)=>{
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