const mongoose = require('mongoose')

const dbConnect = () => {
	return mongoose.connect(process.env.DB_HOST, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
		.then(data => {
			console.log(`Mongodb connected with server: ${data.connection.host}`)
		})
		.catch(error => {
			console.error('Error connecting to MongoDB:', error)
		})
}

module.exports = dbConnect
