const express = require('express');
const app = express();
let connectionString = process.env.DATABASE_URL;
if(!process.env.DATABASE_URL) {
	connectionString = 'postgres://' + 
	process.env.POSTGRES_USER + ':' + 
	process.env.POSTGRES_PASSWORD + '@localhost/mybooks';
}

const Sequelize = require('sequelize')
const sequelize = new Sequelize(connectionString)
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const session = require('express-session')

app.use(express.static('static'));
app.use(express.static('static/js'));
app.use(bodyParser.urlencoded({extended: true}));  
app.use(bodyParser.json());
app.set('views', './views');
app.set('view engine', 'pug');
app.use(session({
	secret: 'oh no i will never guess this secret',
	resave: false,
	saveUninitialized: false
}))

//set table ownedBooks
var OwnedBooks = sequelize.define('ownedbooks', {
	authorfirstname: Sequelize.STRING,
	authorlastname: Sequelize.STRING,
	title: Sequelize.STRING,
	genre: Sequelize.STRING,
	language: Sequelize.STRING,
	lastread: Sequelize.STRING,
});

//set table wishlist
var Wishlist = sequelize.define('wishlist', {
	title: Sequelize.STRING,
	authorfirstname: Sequelize.STRING,
	authorlastname: Sequelize.STRING,
	language: Sequelize.STRING,
	price: Sequelize.STRING
})

//set table users
var Users = sequelize.define('users', {
	username: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING
})

//get home '/' page
app.get('/', (req, res) => {
	Wishlist.findAll({limit: 5})
	.then(function(result){
		const wishHomepage = {
			fiveBooks: result, 
			user: req.session.user
		}
		res.render('index', wishHomepage);
	})
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
		const allTheBooks = {
			allBooks: result,
			user: req.session.user
		}
		res.render('books', allTheBooks);
	})
});

//post books '/books' page (after searching)
app.post('/books', (req, res) => {
	const searching = req.body.search;
	const findLanguage = req.body.language;
	const findGenre = req.body.genre;
	const allGenres = req.body.allGenres;
	OwnedBooks.findAll({order: 'authorLastName'})
	.then(function(result){
		var booksWeSeek = []
		for (var i = 0; i < result.length; i++) {
			var book = {
				authorfirstname: result[i].dataValues.authorfirstname,
				authorlastname: result[i].dataValues.authorlastname,
				title: result[i].dataValues.title,
				genre: result[i].dataValues.genre,
				language: result[i].dataValues.language,
				lastread: result[i].dataValues.lastread
			}
			var bookDoesExist = result[i].authorfirstname !== null && result[i].authorfirstname.includes(searching) ||
				result[i].authorlastname !== null && result[i].authorlastname.includes(searching)   ||
				result[i].title !== null && result[i].title.includes(searching)						||
				result[i].lastread !== null && result[i].lastread.includes(searching);
			if (findLanguage.includes(result[i].language)) {
				if (allGenres === "all") {
					if (bookDoesExist) {
						booksWeSeek.push(book)
					} 
				} else if (findGenre.includes(result[i].genre) || result[i].genre !== null && result[i].genre.includes(findGenre)){
					if (bookDoesExist) {
						booksWeSeek.push(book)
					} 
				}
			}
		}
		const SeekingBooks = {
			allBooks: booksWeSeek, 
			user: req.session.user
		}
		res.send(SeekingBooks);
	})
})

//get wishlist '/wishlist' page
app.get('/wishlist', (req, res) => {
	Wishlist.findAll({order: 'title'})
	.then(function(result){
		const theWholeWishlist = {
			wishingThis: result, 
			user: req.session.user
		}
		res.render('wishlist', theWholeWishlist);
	})
});

//get about '/about' page
app.get('/about', (req, res) => {
	res.render('about', {user: req.session.user});
});

//get login '/login' page
app.get('/login', (req, res) => {
	res.render('login', {user: req.session.user});
});

app.post('/login', (req, res) => {
	if (req.body.username.length === 0){
		res.redirect('/login/?message=' + encodeURIComponent("Please fill out your username."))
	}
	if (req.body.password.length === 0){
		res.redirect('/login/?message=' + encodeURIComponent("Please fill out your password."))
	}

	Users.findOne({
		where: {
			username: req.body.username
		}
	}).then(function(user){
		if(req.body.password === user.password) {
			req.session.user = user;
			res.redirect('/addbooks')
		} else {
			res.redirect('/login/?message=' + encodeURIComponent("Invalid username or password."))
		}
	})
})

app.get('/addbooks', (req, res) => {
	var activeUser = req.session.user;
	// console.log('user is:' + user)
	// console.log(activeUser)
	if (activeUser === undefined) {
		res.redirect('/login/?message=' + encodeURIComponent("Please log in to add books."));
	} else {
		const sendingthis = {user: activeUser}
		// console.log(sendingthis)
		res.render('add', sendingthis);
	}
})

app.post('/addbooks', (req, res) => {
	OwnedBooks.create({
		authorfirstname: req.body.authorfirstname,
		authorlastname: req.body.authorlastname,
		title: req.body.title,
		genre: req.body.genre,
		language: req.body.language,
		lastread: req.body.lastread
	})
	.then(function(){
		res.redirect('/books')
	})
})

app.get('/book/:bookId', (req, res)=>{
	console.log('console.logging bookId')
	console.log(req.params.bookId)
	OwnedBooks.findOne({
		where: {id: req.params.bookId}
	})
	.then(function(book){
		console.log('inside the .then')
		console.log(book)
		//here it goes back to the top of the get request and fill in js.cookie and jquery file as req.params.bookId
		res.render('change', {result:book, user:req.session.user})
	})
})

app.get('/wishlist_to_books/:bookId', (req, res)=>{
	console.log('console.logging bookId')
	console.log(req.params.bookId)
	Wishlist.findOne({
		where: {id: req.params.bookId}
	})
	.then(function(book){
		console.log('inside the .then')
		console.log(book)
		res.render('transfer', {result:book, user:req.session.user})
	})
})

app.post('/wishlist', (req, res) => {
	Wishlist.create({
		title: req.body.titlewish,
		authorfirstname: req.body.authorfirstnamewish,
		authorlastname: req.body.authorlastnamewish,
		language: req.body.languagewish,
		price: req.body.pricewish
	})
	.then(function(){
		res.redirect('/wishlist')
	})
})

app.get('/logout', (req, res) => {
	req.session.destroy(function(error){
		if (error){
			throw error;
		}
		res.redirect('/');
	})
})

//server
sequelize.sync()
	.then(function(){
		app.listen(8000, () => {
			console.log('server has started');
		});
	})
