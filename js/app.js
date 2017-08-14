/**
 * MovieDB application
 * Kamil Armatys
 */

(function(window){
   "use strict";
   
   /**
    * Constructor
   */
   function App(){
      // secret API key
      this._apiKey = "xxxxx";
      
      // last request which was sent to database
      this._request = {};
      
      // last data fetched from server
      this._lastData = [];
      
      // reference to current active page
      this._activePage = "";
   }
   
   /**
    * Initialize application and validate input data
    *
    * @param {Object} options - input data
    *
    * @throws {Error} 
    */
   App.prototype.init = function(options){
      // required options
      this._inputForm    = document.getElementById(options.inputForm);
      this._resultPages  = document.getElementById(options.result);
      
      if(!this._inputForm || !this._resultPages){
         throw new Error("Cannot find at least one required element: input form or pages");
      }
      
      // key references
      this._resultList   = this._resultPages.querySelector('div[data-target="list"]') || this._resultPages.querySelector('#list');
      this._resultSingle = this._resultPages.querySelector('div[data-target="single"]') || this._resultPages.querySelector('#single');
      
      if(!this._resultList || !this._resultSingle){
         throw new Error("Cannot find at least one required element: list page, single page");
      }
      
      // optional references
      this._preloader = document.getElementById("preloader");
      
      
      // reference to current active page
      this._activePage = this._resultPages.querySelector('page-active') || this._resultPages.children[0];
      
      // add listeners
      this._addEvents();
   };
   
   /**
    * Add events for input form and back buttons (if they exists)
    */
   App.prototype._addEvents = function(){
      var self = this;
      
      function onSubmit(e){
         // send request
         self._renderList({ action: "list", type: "multi", query: this.children[0].value });
         e.preventDefault();
      }
      
      function onClickBack(e){
         if(e.target.tagName !== "A") return false;
         self.openPage(e.target.hash.substring(1));
         e.preventDefault();
      }
      
      // find all back buttons and add events
      var backBtns = Array.prototype.slice.call(document.querySelectorAll('.back-btn'));
      backBtns.forEach(function(elem){
         elem.addEventListener("click", onClickBack);
      });
      
      // capture submit event
      this._inputForm.addEventListener("submit", onSubmit);
   };
   
   /**
    * Fetch data from server in JSON format using AJAX 
    *
    * @param {string} src - URL in accordance with themoviedb API
    *
    * @return {Promise} 
    */
   App.prototype._getData = function(src){
      return new Promise(function(resolve, reject){
         var xhr = new XMLHttpRequest();
         
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
   };
   
   /**
    * Build URL compatible with The Movie DB API
    * Available properties:
    * - action {string} defines how many items are needed
    * - type   {string} determines what kind of data is requested [movie, tv, person, all of them]
    * - query  {string} /only when action = list/
    * - id     {number} /only when action = single/
    *
    * @param {Object} options - specifies request arguments
    *
    * @return {string} url ready to use
   */
   App.prototype._buildQuery = function(options){
      var dataURL = "https://api.themoviedb.org/3/";
      
      switch(options.action){
        case "list":
            dataURL += 'search/' + options.type + '?api_key=' + this._apiKey + '&query=' + decodeURIComponent(options.query) + '&page=' + (options.page || 1);
            break;
        case "single":
            dataURL += options.type + '/' + options.id + '?api_key=' + this._apiKey;
            break;
         
      }
      return dataURL;
   };
   
   /*App.prototype._getByID = function(type, id){
      
   };*/
   
   /**
    * 
   */
   App.prototype.openPage = function(name){
      var newPage = document.getElementById(name),
          self    = this;
      
      this._activePage.classList.add('fadeout');
      this._activePage.style.display = "";
      newPage.style.display = "block";
      
      window.setTimeout(function(){
         self._activePage.classList.remove('fadeout');
         self._activePage.classList.remove('page-active');
         
         newPage.classList.add("page-active");
         self._activePage = newPage;
      }, 500);
   };
   
   /**
    * 
    */
   App.prototype._renderList = function(req){
      var url  = this._buildQuery(req),
          self = this;
      
      // show preloader
      this._startPreloader();
      
      // send request
      this._getData(url).then(function(data){
         // update DOM
         return self._updateList(data);
      }).then(function(){
         // show loaded content
         self.openPage('list');
         console.log("complete!");
      }).catch(function(err){
         // display errors
         console.log(err);
      }).then(function(){
         // hide preloader
         self._stopPreloader();
      });
      
      // store request
      this._request = req;
   };
   
   /**
    * 
    */
   App.prototype._updateList = function(data){
      var parent    = this._resultList,
          dfItem    = document.createDocumentFragment(),
          link      = document.createElement('a'),
          imgLength = data.results.length,
          imgLoaded = 0,
          self      = this,
          clone;
      
      // clear container
      this._empty(parent);
      
      return new Promise(function(resolve){
         var onImgLoaded = function(e){
            e.target.removeEventListener('load', onImgLoaded);
            if(imgLength === ++imgLoaded) return resolve();
         };
         
         if(imgLength === 0){
            clone = document.createElement('p');
            clone.textContent = "Nothing found";
            parent.appendChild(clone); 
            
            return resolve();
         }
         
         link.appendChild(document.createElement('img'));
         link.appendChild(document.createElement('p'));

         for(var i=0; i<imgLength; i++){
            clone = link.cloneNode(true);

            // url href
            clone.href = "#"+ data.results[i].media_type + ":" + data.results[i].id;

            switch(data.results[i].media_type){
               case "movie":
                  clone.children[0].src = self.getImageURL(154, data.results[i].poster_path);
                  clone.children[1].textContent = data.results[i].title;
                  break;
               case "person":
                  clone.children[0].src = self.getImageURL(154, data.results[i].profile_path);
                  clone.children[1].textContent = data.results[i].name;
                  break;
               case "tv":
                  clone.children[0].src = self.getImageURL(154, data.results[i].poster_path);
                  clone.children[1].textContent = data.results[i].name;
                  break;
            }

            // add to container
            dfItem.appendChild(clone);
            
            // add onload event
            clone.children[0].addEventListener('load', onImgLoaded);
         }
         
         // append results to document
         parent.appendChild(dfItem);
         
      });
   };
   
   /**
    * Show preloader in document
   */
   App.prototype._startPreloader = function(){
      if(!this._preloader) return false;
      this._preloader.innerHTML = '<div class="indeterminate"></div>';
      return true;
   };
   
   /**
    * Hide preloader
   */
   App.prototype._stopPreloader = function(){
      if(!this._preloader) return false;
      this._preloader.removeChild(this._preloader.firstChild);
      return true;
   };
   
   /**
    * Remove all child nodes in given element
    *
    * @param {Element} parent - element to clean
    */
   App.prototype._empty = function(parent){
      while(parent.firstChild){
         parent.removeChild(parent.firstChild);
      }
   };
   
   /**
    * Build URL to remote images stored in tmdb server
    *
    * @param {number} width - requested width
    * @param {string} image - name of image
    *
    * @return {string} full URL to image on remote server or to local "empty" image (if second parameter is null)
   */
   App.prototype.getImageURL = function(width, image){
      if(!image) return "images/empty-"+width+".png";
      return "https://image.tmdb.org/t/p/w"+width+"/"+image;
   };
   
   window.App = App;
})(window);