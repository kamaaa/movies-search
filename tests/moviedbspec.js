/**
 * MovieDB application
 * Kamil Armatys
 */
/* globals MovieDB, describe, it, expect */

describe("MovieDB class", function(){
   var db     = new MovieDB(),
       apiKey = db.apiKey;
      
   it("should generate full URL to find list of movies which name start by \"transf\"", function(){
      expect(db._buildQuery({action: "list", type: "movie", query: "transf"})).toBe("https://api.themoviedb.org/3/search/movie?api_key="+apiKey+"&query=transf&page=1");
   });

   it("should generate full URL to find single movie by ID", function(){
      expect(db._buildQuery({action: "single", type: "movie", id: 1000})).toBe("https://api.themoviedb.org/3/movie/1000?api_key="+apiKey);
   });

   it("should throw error when action and/or type is not given in request", function(){
      expect(function(){
         db._buildQuery({action: "list", query: "transf"});
      }).toThrowError(ReferenceError);

      expect(function(){
         db._buildQuery({type: "movie", query: "transf"});
      }).toThrowError(ReferenceError);
   });

   it("should encode input query to URL format", function(){
      expect(db._buildQuery({action: "list", type: "person", query: "Johnny Depp"})).toBe("https://api.themoviedb.org/3/search/person?api_key="+apiKey+"&query=Johnny%20Depp&page=1");

   });

   it("should generate image URL which indicates to themoviedb server", function(){
      expect(db.getImageURL(154, 'sun.jpg')).toBe("https://image.tmdb.org/t/p/w154/sun.jpg");
   });

   it("should generate image URL which indicates to local \"empty\" image when its name is undefined or null", function(){
      expect(db.getImageURL(154, null)).toBe("images/empty-154.png");
      expect(db.getImageURL(154, undefined)).toBe("images/empty-154.png");
   });
});