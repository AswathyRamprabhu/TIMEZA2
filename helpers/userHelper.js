const userModel = require("../models/userModel");
const dbConnect = require("../config/dbConnection")
const bcrypt = require("bcrypt");

module.exports.addUser = async (userData, callback) => {
  //console.log("Entered data in the form by user- in addUser helper fn- 1- ", userData)
  
  let user1 = {
    name: userData.name,
    email: userData.email,
    phonenumber: userData.phonenumber,
    password: userData.password,
  };

  user1.password = await bcrypt.hash(userData.password, 10)
  //console.log(user1, " checking before adding user to db");
  dbConnect().then(() => {
    userModel.create(user1)
      .then(() => {
        callback("DONE");
      })
      .catch(() => {
        callback("FAILED");
      });
  });
  //}
}

module.exports.getUser = (data) => {
  //console.log(data, "- now at the userhelper getuser");
  return new Promise((resolve, reject) => {
    dbConnect()
      .then(() => {
        userModel.findOne({ email: data.email })
          .then((user) => {
            // console.log(data,"lll");
            if (user) {
              //console.log("At getuserHelper, user from DB - password:", data.password, "&&&&&", "user.Password:", user.password);
              bcrypt.compare(data.password, user.password)
                .then((isMatch) => {
                  if (isMatch) {

                    resolve(user);
                  } else {

                    resolve(null);
                  }
                })
                .catch((error) => {
                  console.log('Error comparing passwords:', error);
                  reject(error);
                });
            } else {

              resolve(null);
            }
          })
          .catch((error) => {
            console.log('Failed to retrieve users:', error);
            reject(error);
          });
      })
      .catch((error) => {
        // console.log('haiiiiiii1234');
        console.log('Failed to connect to the database:', error);
        reject(error);
      });
  });
};


