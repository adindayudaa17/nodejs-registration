const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    businessType: {
        type: String,
        required: true,
    },
    businessAddress: {
        type: String,
        required: true,
    },
    // Field untuk menyimpan informasi dokumen
    documents: {
        suratIzinUsaha: {
            fileName: String,
            filePath: String,
        },
        npwp: {
            fileName: String,
            filePath: String,
        },
        ktp: {
            fileName: String,
            filePath: String,
        }
    },
    isActive: {
        type: Boolean,
        required: true,
    }
}, {
    timestamp: true,
});

module.exports = mongoose.model('User', userSchema, 'users');
