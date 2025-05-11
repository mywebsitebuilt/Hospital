const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(
    'mongodb+srv://sfayazmr:Abcdef067@cluster01.ibbs2.mongodb.net/wehealth?retryWrites=true&w=majority&appName=Cluster01',
    { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Patient Model Schema
const patientSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    sex: String,
    height: Number,
    weight: Number,
    maritalStatus: String,
    contactNumber: String,
    email: { type: String, unique: true, required: true },
    streetAddress: String,
    streetAddressLine2: String,
    city: String,
    stateProvince: String,
    postalZipCode: String,
    takingMedications: String,
    password: { type: String, required: true }, // Password for registration
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true }); // Enable automatic createdAt and updatedAt

const Patient = mongoose.model("Patient", patientSchema);

// --- User Registration Endpoint (New Patient Enrollment) ---
app.post("/api/register", async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            sex,
            height,
            weight,
            maritalStatus,
            contactNumber,
            email,
            streetAddress,
            streetAddressLine2,
            city,
            stateProvince,
            postalZipCode,
            takingMedications,
            password
        } = req.body;

        // Validate input data (basic example)
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields." });
        }

        // Check if the email is already registered
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(409).json({ message: "Email already exists." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new patient
        const newPatient = new Patient({
            firstName,
            lastName,
            dateOfBirth,
            sex,
            height,
            weight,
            maritalStatus,
            contactNumber,
            email,
            streetAddress,
            streetAddressLine2,
            city,
            stateProvince,
            postalZipCode,
            takingMedications,
            password: hashedPassword,
        });

        // Save the patient to the database
        const savedPatient = await newPatient.save();

        // Generate a JWT token upon successful registration (optional, for immediate login)
        const token = jwt.sign({ patientId: savedPatient._id, email: savedPatient.email }, 'your-secret-key', { expiresIn: '1h' });

        res.status(201).json({ message: "Registration successful.", token, patientId: savedPatient._id });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "An error occurred during registration." });
    }
});

// --- User Login Endpoint ---
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input data
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password." });
        }

        // Find the patient by email
        const patient = await Patient.findOne({ email });
        if (!patient) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordMatch = await bcrypt.compare(password, patient.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate a JWT token
        const token = jwt.sign({ patientId: patient._id, email: patient.email }, 'your-secret-key', { expiresIn: '1h' });

        res.status(200).json({ message: "Login successful.", token, patientId: patient._id });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});

const port = process.env.PORT || 5010;
app.listen(port, () => console.log(`Server running on port ${port}`));
