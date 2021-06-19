const express = require('express');
const app = express();
const cors = require('cors');
const mongodb = require('mongodb');
const DB = 'jobify';
const bcrypt = require('bcryptjs');
require('dotenv').config();
const URL = process.env.DB;
var applicants

app.use(cors());
app.use(express.json());

app.post('/login', async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let user = await db.collection(req.body.userType).findOne({ email: req.body.email });

        if (user) {
            let isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
            if (isPasswordCorrect) {
                id = user._id
                res.json({
                    message: "allow",
                    id,
                    email : req.body.email,
                    userType: req.body.userType
                })
            }
            else {
                res.status(404).json({
                    message: "Email or password incorrect"
                })
            }
        }
        else {
            res.status(404).json({
                message: "Email or password incorrect"
            })
        }
        connection.close

    }
    catch (error) {
        console.log(error);
    }
})

app.post('/postjob', async function (req, res) {
    try {
        let id = req.body.companyID;
        const ObjectId = require('mongodb').ObjectId;
        let o_id = new ObjectId(id)
        let connection = await mongodb.connect(URL);

        let db = connection.db(DB);

        let company = await db.collection('recruiter').findOne({ _id: o_id });
        console.log((await company).companyName)
        let cmpName = (await company).companyName
        console.log("------------" + cmpName)
        await db.collection('jobs').insertOne({
            companyName: cmpName,
            ...req.body,
            applications: []
        })
        res.json(
            { message: "job posted" }
        )
    }
    catch (error) {
        console.log(error);
    }
})

app.get('/viewjob', async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let jobs = await db.collection('jobs').find().toArray();
        res.json(jobs);
    } catch (error) {
        console.log(error)
    }
})


app.post('/apply', async function (req, res) {
    try {

        let id = req.body.employeeID;
        const ObjectId = require('mongodb').ObjectId;
        let o_id = new ObjectId(id)

        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let candidate = await db.collection('candidate').findOne({_id : o_id});
        delete candidate.password
        let j_ID = new ObjectId(req.body.jobID);
        db.collection('jobs').updateOne({ _id: j_ID }, { $push: { "applications": {...req.body,candidate} } });
        res.json({
            message: "application submitted"
        })

    } catch (error) {
        console.log(error)
    }
})

app.get('/candidatejob/:jobID', async function (req, res) {
    try {
        let id = req.params.jobID;
        const ObjectId = require('mongodb').ObjectId;
        let o_id = new ObjectId(id)

        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);

        let job = await db.collection('jobs').findOne({ _id: o_id })

        res.json(job)
    } catch (error) {
        console.log(error)
    }
})

app.get('/recruiterjob/:jobID', async function (req, res) {
    try {
        let id = req.params.jobID;
        const ObjectId = require('mongodb').ObjectId;
        let o_id = new ObjectId(id)

        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);

        let job = await db.collection('jobs').findOne({ _id: o_id })
        
        res.json(job);

    } catch (error) {
        console.log(error)
    }
})

app.get('/getjobposted/:companyID', async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let jobs = await db.collection('jobs').find({ companyID: req.params.companyID }).sort({ _id: -1 }).toArray();
        if (jobs.length > 0) {
            res.json(jobs)
        }
        else {
            res.json([])
        }
    } catch (error) {
        console.log(error)
    }
})

app.get('/appliedjobs/:userID',async function(req,res){
    try {

        let id = req.params.userID;
        const ObjectId = require('mongodb').ObjectId;
        let o_id = new ObjectId(id)

        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let appliedJobs = await db.collection('jobs').find({"applications.employeeID":id}).toArray();
        res.json(appliedJobs);
    } catch (error) {
        console.log(error)
    }
})

app.post('/signup', async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let email = await db.collection(req.body.userType).findOne({ email: req.body.email });
        if (!email) {
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password, salt);
            req.body.password = hash;
            db.collection(req.body.userType).insertOne(req.body);
            res.json({
                message: 'user registered'
            })
        }
        else {
            res.json({
                message: 'email exist'
            })
        }
        connection.close

    } catch (error) {
        console.log(error);
    }
})



app.listen(process.env.PORT || 3030)
