const mongoose = require('mongoose');

const RegisterNumberSchema = new mongoose.Schema({
    registerNumbers: { type: [Number], required: true } // Store all numbers in a single array
});

module.exports = mongoose.model('RegisterNumber', RegisterNumberSchema);
