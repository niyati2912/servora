const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "Invalid input types" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const allowedRoles = ["customer", "provider", "driver", "employer"];
    const selectedRole = role || "customer";

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (
      phone !== undefined &&
      (
        typeof phone !== "string" ||
        phone.replace(/\D/g, "").length < 10 ||
        phone.replace(/\D/g, "").length > 15
      )
    ) {
      return res.status(400).json({
        message: "Phone number must contain 10 to 15 digits"
      });
    }

    if (
      address !== undefined &&
      (typeof address !== "string" || address.trim().length > 300)
    ) {
      return res.status(400).json({
        message: "Address must be 300 characters or fewer"
      });
    }

    if (
      city !== undefined &&
      (typeof city !== "string" || city.trim().length > 100)
    ) {
      return res.status(400).json({
        message: "City must be 100 characters or fewer"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      roles: [selectedRole]
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        roles: user.roles
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is inactive"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication is not configured"
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        roles: user.roles
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = { register, login };