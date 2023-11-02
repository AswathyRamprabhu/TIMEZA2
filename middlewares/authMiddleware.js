const User = require("../models/userModel");

module.exports = {
    login: async (req, res, next) => {
        try {
            if (req.session.user) res.redirect("/");
            else next();
        } catch (error) {
            console.log(error.message);
        }
    },
    checkSession: async (req, res, next) => {
        if (req.session.user) {
            const user = await User.findById(req.session.user);

            if (!user || !user.isActive) {
                req.session.destroy();
                return res.redirect("/");
            }
            next();
        } else {
            res.redirect("/home");
        }
    },
    adminlogin: async (req, res, next) => {
        try {
            if (req.session.user) {
                res.redirect("/admin/dashboard"); 
            } else {
                next();
            }
        } catch (error) {
            console.log(error.message);
        }
    },
    isAdminAuthorized: (req, res, next) => {
                if (req.session.admin) next()
                else res.redirect('/admin/login')
            },
};