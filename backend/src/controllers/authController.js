const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  address: user.address || "",
  city: user.city || "",
  roles: user.roles
});

const signToken = (user) =>
  jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

const validPhone = (phone) =>
  typeof phone === "string" &&
  phone.replace(/\D/g, "").length >= 10 &&
  phone.replace(/\D/g, "").length <= 15;

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

    if (phone !== undefined && !validPhone(phone)) {
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

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication is not configured"
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

    const token = signToken(user);
    res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: "lax" });
    res.cookie("sevora_token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: "lax" });

    // Return a token so the person is logged in straight after signup.
    return res.status(201).json({
      message: "Registration successful",
      token,
      user: publicUser(user)
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

    const token = signToken(user);
    res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: "lax" });
    res.cookie("sevora_token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: "lax" });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// GET /api/auth/me - the frontend calls this on load so roles never go stale.
const getMe = (req, res) => {
  return res.status(200).json({ user: publicUser(req.user) });
};

// PATCH /api/auth/me - name, phone, address, city (only fields that are sent)
const updateMe = async (req, res) => {
  try {
    const { name, phone, address, city, role } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        return res.status(400).json({
          message: "Name is required and must be 100 characters or fewer"
        });
      }
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      if (!validPhone(phone)) {
        return res.status(400).json({
          message: "Phone number must contain 10 to 15 digits"
        });
      }
      updates.phone = phone.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string" || address.trim().length > 300) {
        return res.status(400).json({
          message: "Address must be 300 characters or fewer"
        });
      }
      updates.address = address.trim();
    }

    if (city !== undefined) {
      if (typeof city !== "string" || city.trim().length > 100) {
        return res.status(400).json({
          message: "City must be 100 characters or fewer"
        });
      }
      updates.city = city.trim();
    }

    if (role !== undefined) {
      const allowedRoles = ["customer", "provider", "driver", "employer"];
      if (allowedRoles.includes(role)) {
        const currentRoles = req.user.roles || [];
        updates.roles = [role, ...currentRoles.filter(r => r !== role)];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Profile updated",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters"
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    // 400 (not 401) so the frontend does not treat it as an expired session.
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({
        message: "New password must be different from the current one"
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ message: "Password changed" });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };