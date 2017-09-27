/**
 * MovieDB application
 * Kamil Armatys
 *
 * Entry point
 */

import Page from './modules/page.js';
import MovieDB from './modules/moviedb.js';

let movieDB = new MovieDB(),
    page    = new Page(movieDB);

// run page
page.init({
   inputForm: "h-form", // ID for input form
   result:    "pages"   // ID for result pages (parent node for #list and #single)
});