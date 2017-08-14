/**
 * MovieDB application
 * Kamil Armatys
 */

/* jshint strict: false */
/* globals App, describe, it, beforeAll, beforeEach, afterEach, expect */

describe("Application", function(){
   var app;
   
   beforeAll(function(){
      app = new App();
   });
   
   describe("MovieDB API integration", function(){
      var apiKey = "xxxxx";
      
      it("should generate full URL to find list of movies which name start by transf", function(){
         expect(app._buildQuery({action: "list", type: "movie", query: "transf"})).toBe("https://api.themoviedb.org/3/search/movie?api_key="+apiKey+"&query=transf&page=1");
      });
      
      it("should generate full URL to find single movie by ID", function(){
         expect(app._buildQuery({action: "single", type: "movie", id: 1000})).toBe("https://api.themoviedb.org/3/movie/1000?api_key="+apiKey);
      });
      
      it("should throw error when action and/or type is not given in request", function(){
         expect(function(){
            app._buildQuery({action: "list", query: "transf"});
         }).toThrowError(ReferenceError);
         
         expect(function(){
            app._buildQuery({type: "movie", query: "transf"});
         }).toThrowError(ReferenceError);
      });
      
      it("should encode input query to URL format", function(){
         expect(app._buildQuery({action: "list", type: "person", query: "Johnny Depp"})).toBe("https://api.themoviedb.org/3/search/person?api_key="+apiKey+"&query=Johnny%20Depp&page=1");
         
      });
      
      it("should generate image URL which indicates to themoviedb server", function(){
         expect(app.getImageURL(154, 'sun.jpg')).toBe("https://image.tmdb.org/t/p/w154/sun.jpg");
      });
      
      it("should generate image URL which indicates to local \"empty\" image when its name is undefined or null", function(){
         expect(app.getImageURL(154, null)).toBe("images/empty-154.png");
         expect(app.getImageURL(154, undefined)).toBe("images/empty-154.png");
      });
   });
   
   describe("DOM Manipulation", function(){
      var root;
      
      beforeEach(function(){
         root = document.createElement("div");
         root.innerHTML = '<form id="inputform"><input type="text"></form><div id="pages"><div id="list"></div><div id="single"></div></div>';
         document.body.appendChild(root);
      });
      
      afterEach(function(){
         document.body.removeChild(root);
      });
      
      it("should remove all nodes in given element", function(){
         expect(root.children.length).toBe(2);
         app._empty(root);
         expect(root.children.length).toBe(0);
      });
   });
});