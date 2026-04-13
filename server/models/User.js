const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },

    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    // sentRequests: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    // }],
});

module.exports = mongoose.model("User", userSchema);