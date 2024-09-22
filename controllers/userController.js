const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const fs = require("fs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Function to send approval email to admin
const sendApprovalEmailToAdmin = async (user) => {
  const approvalToken = generateApprovalToken(user);
  const approvalLink = `https://register-logee.vercel.app/approval/${approvalToken}`;

  const attachments = [];

  // Add documents as attachments
  for (const [key, value] of Object.entries(user.documents)) {
    if (value) {
      attachments.push({
        filename: value.fileName,
        path: value.filePath,
      });
    }
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "adindayudaa17@gmail.com",
    subject: "New User Registration Approval",
    html: `
            <p>A new user has registered:</p>
            <ul>
                <li>Nama Perusahaan: ${user.businessName}</li>
                <li>Penanggung Jawab Perusahaan: ${user.businessManager}</li>
                <li>Alamat Perusahaan: ${user.businessAddress}</li>
                <li>Nama Bank: ${user.bankName}</li>
                <li>Email: ${user.email}</li>
            </ul>
            <p>Click the following link to approve or reject the user:</p>
            <a href="${approvalLink}">Approve User</a>
        `,
    attachments,
  };

  await transporter.sendMail(mailOptions);
};

// Function to send approval email to user
const sendApprovalEmailToUser = async (user) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your Logee Account is Approved",
    html: `
            <p>Dear ${user.businessManager},</p>
            <p>Your account has been approved. You can now log in and use the platform.</p>
        `,
  };

  await transporter.sendMail(mailOptions);
};

// Function to send rejection email to user
const sendRejectionEmailToUser = async (user, reason) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your Logee Account Registration was Rejected",
    html: `
            <p>Dear ${user.businessManager},</p>
            <p>We regret to inform you that your account registration has been rejected for the following reason:</p>
            <blockquote>${reason}</blockquote>
            <p>You may attempt to register again after addressing the above reason.</p>
        `,
  };

  await transporter.sendMail(mailOptions);
};

// Helper function to create approval token
const generateApprovalToken = (user) => {
  return jwt.sign(
    {
      businessName: user.businessName,
      businessManager: user.businessManager,
      businessAddress: user.businessAddress,
      email: user.email,
      bankName: user.bankName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const {
    businessName,
    businessManager,
    email,
    businessAddress,
    bankName,
    bankLocation,
    bankNumber,
    bankAccount,
  } = req.body;
  const isActive = false;

  // Check if email is already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Delete uploaded files if they exist
    if (req.files) {
      Object.keys(req.files).forEach((fieldName) => {
        req.files[fieldName].forEach((file) => {
          fs.unlinkSync(file.path); // Delete the file
        });
      });
    }

    res.status(400);
    throw new Error("Email already registered");
  }

  // Initialize document object
  let documents = {};
  if (req.files) {
    for (const field of Object.keys(req.files)) {
      documents[field] = {
        fileName: req.files[field][0].originalname,
        filePath: req.files[field][0].path,
      };
    }
  }

  // Create new user
  const user = await User.create({
    businessName,
    businessManager,
    email,
    businessAddress,
    bankName,
    bankLocation,
    bankNumber,
    bankAccount,
    documents,
    isActive,
  });

  // Send email to admin for approval
  try {
    await sendApprovalEmailToAdmin(user);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        businessName: user.businessName,
        businessManager: user.businessManager,
        bankName: user.bankName,
      },
    });
  } catch (error) {
    console.error("Failed to send email to admin:", error);
    res.status(201).json({
      message:
        "User registered successfully, but failed to send email to admin",
      user: {
        businessName: user.businessName,
        businessManager: user.businessManager,
        bankName: user.bankName,
      },
    });
  }
});

// Approve user
const approveUser = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { action, rejectReason } = req.body;

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (action === "approve") {
      // If the action is 'approve', mark the user as active
      user.isActive = true;
      await user.save();

      // Send approval email to user
      await sendApprovalEmailToUser(user);
      return res.status(200).json({ message: "User approved and email sent" });
    } else if (action === "reject") {
      if (!rejectReason) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });
      }

      // Send rejection email with reason to the user
      await sendRejectionEmailToUser(user, rejectReason);

      // Delete the user from the database so they can register again
      await User.deleteOne({ _id: user._id });
      return res.status(200).json({ message: "User rejected and email sent" });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use approve or reject." });
    }
  } catch (error) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }
});

module.exports = {
  registerUser,
  approveUser,
};
