
# The Bulletin Times – Live News Feed

A modern newspaper-style news platform built using pure HTML, CSS, and JavaScript. The application fetches real-time news from NewsAPI and presents it in a professional, responsive layout inspired by leading digital newspapers.

## Features

* Live news fetching using NewsAPI
* Featured headline section
* Breaking news banner
* Search news by title
* Category-based filtering
* Trending news sidebar
* Responsive newspaper layout
* Loading spinner during API requests
* Error handling with try-catch-finally
* Mobile, tablet, and desktop support
* Smooth hover animations

## Technologies

* HTML5
* CSS3
* JavaScript (ES6)

## JavaScript Concepts Used

### DOM Manipulation

* getElementById()
* querySelector()
* querySelectorAll()
* createElement()
* appendChild()
* innerHTML
* innerText
* classList.add()

### Event Handling

* addEventListener()
* click events
* input events

### Async JavaScript

* fetch()
* async/await
* Promises

### JSON Handling

* response.json()

### Error Handling

* try
* catch
* finally
* Error object

### Array Methods

* forEach()
* filter()
* find()
* includes()

### ES6 Features

* let & const
* Arrow functions
* Template literals
* Destructuring

## Project Structure

```text
The-Bulletin-Times/
│
├── index.html
├── style.css
├── script.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Environment Variables

Create a `.env.example` file:

```env
NEWS_API_KEY=YOUR_API_KEY
```

## API Endpoint

```text
https://newsapi.org/v2/top-headlines
```


## License

This project is intended for educational and learning purposes.
