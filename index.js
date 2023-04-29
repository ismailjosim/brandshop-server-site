const express = require('express');
const app = express();
const cors = require('cors');
require('colors');
const port = process.env.PORT || 5000;


// get local data
const chefData = require('./data/chefList.json');

app.use(cors());

// default route
app.get('/', (req, res) => {
    res.send("<h2 style='text-align: center; margin-top: 1rem;'>chef Server Running 🚩</h2>");
});

// get all chef List
app.get('/cheflist', (req, res) => {
    try {
        res.send({
            success: true,
            data: chefData.length,
            cheflist: chefData
        })


    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// get Single Chef list
app.get('/cheflist/:id', (req, res) => {
    try {
        const id = req.params.id;
        const result = chefData.find(d => d.id === id);

        res.send({
            success: true,
            singleChef: result
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})




app.listen(port, () => {
    console.log(`chef Server Running on Port: ${ port }`.bgCyan.bold);
},)
