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
        try {
            if (req.session.user) {
                const user = await User.findById(req.session.user);
    
                if (!user || !user.isActive) {
                    req.session.destroy();
                    return res.redirect("/");
                }
    
                // User is authenticated, and their session is valid
                next();
            } else {
                // User is not logged in, or the session has expired
                res.redirect("/");
            }
        } catch (error) {
            console.error(error);
            res.redirect("/error-page"); // Handle the error appropriately
        }
    },
    setCacheControl: (req, res, next) => {
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		res.setHeader('Surrogate-Control', 'no-store');
		next()
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