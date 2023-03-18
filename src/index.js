const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser)
const { connection } = require('./connector')


app.get("/totalRecovered", (req, res)=> {
    connection.find().then((data)=> {
        let total = 0;
        for(let i=0; i<data.length; i++){
            total += data[i].recovered
        }
        res.status(200).json({
            data:{_id: "total", recovered: total}
        })
    }).catch((err)=> {
        console.log(err)
        res.status(500).json({
            status:'failed',
            message: 'Unable to fetch total number of recovered data'
        })
    })
})

app.get("/totalActive", (req, res)=> {
    connection.find().then((data)=> {
        let totalInfected = 0;
        let totalRecovered = 0;
        for(let i=0; i<data.length; i++){
            totalInfected += data[i].infected
            totalRecovered += data[i].recovered
        }
        const totalActive = totalInfected - totalRecovered
        res.status(200).json({
            data:{_id: "total", active: totalActive},
        })
    }).catch(err =>{
        console.log(err);
        res.status(500).json({
            status: 'failed',
            message: 'Unable to fetch total number of active patients'
        })
    })
})

app.get("/totalDeath", (req, res)=> {
    connection.find().then((data)=> {
        let totalDeath = 0;
        for(let i=0; i<data.length; i++){
            totalDeath += data[i].death
        }
        res.status(200).json({
            data: {_id: "total", death: totalDeath}
        })
    })
})

app.get("/hotspotStates", async(req, res)=> {
    try{
        const hotspotStates = await connection.aggregate([
            {
                $project: {
                    state: 1,
                    rate: {
                        $round: [
                            {$divide: [{$subtract: ["$infected" - "$recovered"]}, "$infected"]},5
                        ]
                    }
                }
            },
            {
                $match: {
                    rate: {$gt: 0.1}
                }
            },
            {
                $project: {
                    id:0,
                    state: 1,
                    rate: 1
                }
            }
        ])
    
        res.status(200).json({
            data: hotspotStates
        })
    }catch(err){
        res.status(500).json({
            status: "failed",
            message: err.message
        })
    }
})
app.get("/healthyStates", async(req, res)=> {
    try{
        const healthyState = await connection.aggregate([
            {
                $project: {
                    state: 1,
                    death: 1,
                    infected:1,
                    mortality: {
                        $round: [{$divide: ['$death', '$infected']}, 5]
                    }
                }
            },
            {
                $match: {
                    mortality: {$lt: 0.005}
                }
            },
            {
                $project:{
                    _id: 0,
                    state: 1,
                    mortality: 1
                }
            }
        ]);

        res.status(200).json({data: healthyState})
    }catch(err){
        res.status(500).json({
            status: "failed",
            message: err.message
        })
    }
}) 


app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;