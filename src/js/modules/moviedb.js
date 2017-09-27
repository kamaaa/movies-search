/**
 * MovieDB module
*/

export default class MovieDB {
   /**
    * @Constructor 
    */
   constructor(){
      // secret API key
      this._apiKey = "xxxx";
   }
   
   /**
    * Internal API key
    *
    * @readonly
    * @return {string}
    */
   get apiKey(){
      return this._apiKey;
   }
   
   /**
    * Get data from The Movie DB according to request
    * Available properties for request parameter:
    * - action {string} defines how many items are needed
    * - type   {string} determines what kind of data is requested [movie, tv, person, all of them]
    * - query  {string} /only when action = list/
    * - page   {number} /only when action = list/
    * - id     {number} /only when action = single/
    *
    * @param {Object} request - specifies request arguments
    *
    * @return {Promise} 
    */
   get(request){
      let url = "";
      
      try{
         url = this._buildQuery(request);
      } catch(e){
         return Promise.reject(e.message);
      }
      
      return this._getData(url);
   }
   
   /**
    * Build URL to remote images stored in tmdb server
    *
    * @param {number} width - requested width
    * @param {string} image - name of image
    *
    * @return {string} full URL to image on remote server or to local "empty" image (if second parameter is null)
   */
   getImageURL(width, image){
      if(!image) return "images/empty-"+width+".png";
      return "https://image.tmdb.org/t/p/w"+width+"/"+image;
   }
   
   /**
    * Fetch data from server in JSON format using AJAX 
    *
    * @param {string} src - URL in accordance with themoviedb API
    *
    * @return {Promise} 
    */
   _getData (src){
      return new Promise(function(resolve, reject){
         let xhr = new XMLHttpRequest();

         xhr.ontimeout = function(){
            reject(JSON.parse('{"status_code":408,"status_message":"Request timed out"}'));
         };

         xhr.onerror = function(){
           reject(xhr.responseText); 
         };

         xhr.onload = function(){
            if(xhr.readyState === XMLHttpRequest.DONE){
               if(xhr.status === 200){
                  resolve(JSON.parse(xhr.response));
               }else{
                  reject(JSON.parse('{"status_code":408,"status_message":"'+xhr.statusText+'"}'));
               }
            }
         };

         xhr.timeout = 5000;
         xhr.open("GET", src, true);
         xhr.send(null);
      });
   }
   
   /**
    * Build URL compatible with The Movie DB API
    * For available properties @see get method
    *
    * @param {Object} options - specifies request arguments
    *
    * @return {string} url ready to use
    * @throws {ReferenceError}
   */
   _buildQuery(options){
      let dataURL = "https://api.themoviedb.org/3/";

      if(!options.action || !options.type){
         throw new ReferenceError("Action or type is not defined");
      }

      switch(options.action){
        case "list":
            dataURL += 'search/' + options.type + '?api_key=' + this._apiKey + '&query=' + encodeURIComponent(options.query) + '&page=' + (options.page || 1);
            break;
        case "single":
            dataURL += options.type + '/' + options.id + '?api_key=' + this._apiKey;
            break;

      }
      return dataURL;
   }
}