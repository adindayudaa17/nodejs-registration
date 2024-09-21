const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');


// Fungsi untuk mengirim email approval ke admin
const sendApprovalEmailToAdmin = async (user) => {
    const approvalToken = generateApprovalToken(user);
    const approvalLink = `${process.env.FE_URL}/approval/${approvalToken}`;

    // Array untuk menyimpan dokumen lampiran
    const attachments = [];

    // Menambahkan surat izin usaha sebagai lampiran jika ada
    if (user.documents && user.documents.suratIzinUsaha) {
        attachments.push({
            filename: user.documents.suratIzinUsaha.fileName, // Nama file asli
            path: user.documents.suratIzinUsaha.filePath // Path file di server
        });
    }

    // Menambahkan NPWP sebagai lampiran jika ada
    if (user.documents && user.documents.npwp) {
        attachments.push({
            filename: user.documents.npwp.fileName,
            path: user.documents.npwp.filePath
        });
    }

    // Menambahkan KTP sebagai lampiran jika ada
    if (user.documents && user.documents.ktp) {
        attachments.push({
            filename: user.documents.ktp.fileName,
            path: user.documents.ktp.filePath
        });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'adindayudaa17@gmail.com',
        subject: 'New User Registration Approval',
        html: `
            <p>A new user has registered:</p>
            <ul>
                <li>Name: ${user.name}</li>
                <li>Email: ${user.email}</li>
                <li>Business Name: ${user.businessName}</li>
                <li>Business Type: ${user.businessType}</li>
            </ul>
            <p>Click the following link to approve or reject the user:</p>
            <a href="${approvalLink}">Approve User</a>
        `,
        attachments
    };

    await transporter.sendMail(mailOptions);
};

// Fungsi untuk mengirim email ke user setelah approval
const sendApprovalEmailToUser = async (user) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Logee Account is Approved',
        html: `
            <p>Dear ${user.name},</p>
            <p>Your account has been approved. You can now log in and use the platform.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Fungsi untuk mengirim email ke user setelah rejection
const sendRejectionEmailToUser = async (user, reason) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Logee Account Registration was Rejected',
        html: `
            <p>Dear ${user.name},</p>
            <p>We regret to inform you that your account registration has been rejected for the following reason:</p>
            <blockquote>${reason}</blockquote>
            <p>You may attempt to register again after addressing the above reason.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Helper untuk membuat token approval
const generateApprovalToken = (user) => {
    return jwt.sign({
            name: user.name,
            email: user.email,
            businessName: user.businessName,
        },
        process.env.JWT_SECRET, {
            expiresIn: '1d'
        }
    );
};

const registerUser = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        password,
        phone,
        businessName,
        businessType,
        businessAddress
    } = req.body;
    const isActive = false;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({
        email
    });
    if (existingUser) {
        // Delete uploaded files if they exist
        if (req.files) {
            Object.keys(req.files).forEach(fieldName => {
                req.files[fieldName].forEach(file => {
                    fs.unlinkSync(file.path); // Delete the file
                });
            });
        }

        res.status(400);
        throw new Error('Email already registered');
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inisialisasi objek dokumen
    let documents = {};
    if (req.files) {
        if (req.files.suratIzinUsaha) {
            documents.suratIzinUsaha = {
                fileName: req.files.suratIzinUsaha[0].originalname,
                filePath: req.files.suratIzinUsaha[0].path,
            };
        }
        if (req.files.npwp) {
            documents.npwp = {
                fileName: req.files.npwp[0].originalname,
                filePath: req.files.npwp[0].path,
            };
        }
        if (req.files.ktp) {
            documents.ktp = {
                fileName: req.files.ktp[0].originalname,
                filePath: req.files.ktp[0].path,
            };
        }
    }

    // Buat user baru
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        businessName,
        businessType,
        businessAddress,
        documents,
        isActive
    });

    // Mengirim email ke admin untuk approval
    try {
        await sendApprovalEmailToAdmin(user);
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                businessType: user.businessType,
            }
        });
    } catch (error) {
        console.error('Failed to send email to admin:', error);
        // Masih mengembalikan respons sukses registrasi, namun dengan catatan gagal mengirim email
        res.status(201).json({
            message: 'User registered successfully, but failed to send email to admin',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                businessType: user.businessType,
            }
        });
    }
});

const approveUser = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { action, rejectReason } = req.body;

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (action === 'approve') {
            // If the action is 'approve', mark the user as active
            user.isActive = true;
            await user.save();

            // Send approval email to user
            await sendApprovalEmailToUser(user);

            return res.status(200).json({ message: 'User approved and email sent' });
        } else if (action === 'reject') {
            if (!rejectReason) {
                return res.status(400).json({ message: 'Rejection reason is required' });
            }

            // Send rejection email with reason to the user
            await sendRejectionEmailToUser(user, rejectReason);

            // Delete the user from the database so they can register again
            await User.deleteOne({ _id: user._id });

            return res.status(200).json({ message: 'User rejected and email sent' });
        } else {
            return res.status(400).json({ message: 'Invalid action. Use approve or reject.' });
        }
    } catch (error) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }
});

module.exports = {
    registerUser,
    approveUser,
};