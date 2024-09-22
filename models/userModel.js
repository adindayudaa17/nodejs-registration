const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
    },
    businessManager: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    businessAddress: {
        type: String,
        required: true,
    },
    bankName: {
        type: String,
        required: true,
    },
    bankLocation: {
        type: String,
        required: true,
    },
    bankNumber: {
        type: Number,
        required: true,
    },
    bankAccount: {
        type: String,
        required: true,
    },
    // Field untuk menyimpan informasi dokumen
    documents: {
        companyLogo: {
            fileName: String,
            filePath: String,
        },
        nidTdp: {
            fileName: String,
            filePath: String,
        },
        npwp: {
            fileName: String,
            filePath: String,
        },
        sipNib: {
            fileName: String,
            filePath: String,
        },
        ktp: {
            fileName: String,
            filePath: String,
        },
        aktaPendirian: {
            fileName: String,
            filePath: String,
        },
        aktaPengesahanPendirian: {
            fileName: String,
            filePath: String,
        },
        othersFile: {
            fileName: String,
            filePath: String,
        },
    },
    isActive: {
        type: Boolean,
        required: true,
    }
}, {
    timestamp: true,
});

module.exports = mongoose.model('User', userSchema, 'users');
