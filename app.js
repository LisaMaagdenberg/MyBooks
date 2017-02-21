const express = require('express');
const app = express();
const connectionString = 'postgres://' + 
	process.env.POSTGRES_USER + ':' + 
	process.env.POSTGRES_PASSWORD + '@localhost/mybooks';
const Sequelize = require('sequelize')
const sequelize = new Sequelize(connectionString)
const bodyParser = require('body-parser');

app.use(express.static('static'));
app.use(bodyParser.urlencoded({extended: true}));  
app.use(bodyParser.json());
app.set('views', './views');
app.set('view engine', 'pug');

//set table ownedBooks
var OwnedBooks = sequelize.define('ownedbooks', {
	authorfirstname: Sequelize.STRING,
	authorlastname: Sequelize.STRING,
	title: Sequelize.STRING,
	genre: Sequelize.STRING,
	language: Sequelize.STRING,
	lastread: Sequelize.STRING
});

//set table wishlist
var Wishlist = sequelize.define('wishlist', {
	title: Sequelize.STRING,
	authorfirstname: Sequelize.STRING,
	authorlastname: Sequelize.STRING,
	language: Sequelize.STRING,
	price: Sequelize.STRING
})

//get home '/' page
app.get('/', (req, res) => {
	res.render('index');
});

// for testing: makes a new row
// app.get('/', (req, res) => {
// 	OwnedBooks.create({
// 		authorfirstname: "J.K.",
// 		authorlastname: "Rowling",
// 		title: "Harry Potter en de Geheime Kamer",
// 		genre: "fantasy",
// 		language: "Dutch",
// 		lastread: "2015"
// 	})
// 	.then(function(){
// 		res.render('index')
// 	})
// })

//get books '/books' page
app.get('/books', (req, res) => {
	OwnedBooks.findAll({order: 'authorLastName'})
	.then(function(result){
		// console.log(booksWeHave)
		const allTheBooks = {allBooks: result}
		res.render('books', allTheBooks);
	})
});

//post books '/books' page (after searching)
app.post('/books', (req, res) => {
	const searching = req.body.search;
	OwnedBooks.findAll({order: 'authorLastName'})
	.then(function(result){
		var booksWeSeek = []
		for (var i = 0; i < result.length; i++) {
			if (result[i].authorfirstname === !undefined && result[i].authorfirstname.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].authorlastname === !undefined && result[i].authorlastname.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].title === !undefined && result[i].title.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].genre === !undefined && result[i].genre.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].language === !undefined && result[i].language.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].lastread === !undefined && result[i].lastread.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			}
		}
		const SeekingBooks = {allBooks: booksWeSeek}
		res.render('books', SeekingBooks);
	})
})

//get wishlist '/wishlist' page
app.get('/wishlist', (req, res) => {
	Wishlist.findAll({order: 'title'})
	.then(function(result){
		const theWholeWishlist = {wishingThis: result}
		res.render('wishlist', theWholeWishlist);
	})
});

//get about '/about' page
app.get('/about', (req, res) => {
	res.render('about');
});

//server
sequelize.sync()
	.then(function(){
		app.listen(3000, () => {
			console.log('server has started');
		});
	})
