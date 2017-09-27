/**
 * Page Module
 */
/* jshint devel: true */

class Page {
   /**
    * @Constructor
    */
   constructor(dbAdapter){
      // database adapter
      this._db = dbAdapter;

      // current request
      this._request = {};

      // last request which was sent to database (needed for back button)
      this._lastRequest = {};

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
   init (options){
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
      this._preloader  = document.getElementById("preloader");
      this._pagination = document.getElementById("pagination");
      this._filters    = document.getElementById("filters");

      // reference to current active page
      this._activePage = this._resultPages.querySelector('page-active') || this._resultPages.children[0];

      // add listeners
      this._addEvents();
   }
   
   /**
    * Open new page according to ID element.
    *
    * @param {string} id - page's id 
    */
   openPage (id){
      let newPage = document.getElementById(id);

      this._activePage.classList.add('fadeout');
      this._activePage.style.display = "";
      newPage.style.display = "block";

      window.setTimeout(() => {
         this._activePage.classList.remove('fadeout', 'page-active');

         newPage.classList.add("page-active");
         this._activePage = newPage;
      }, 500);
   }
   
   /**
    * Hide currently displayed page. This method is useful when we want to update content on the same page.
    *
    * @param {string} next - optional. name of next page. 
    *
    * @return {Promise}
    */
   hidePage(next = ""){
      if(this._activePage.id !== next){
         return Promise.resolve();
      }
      
      return new Promise((resolve) => {
         this._activePage.classList.remove('page-active');
         window.setTimeout(() => {
            resolve();
         }, 500);
      });
   }
   
   /**
    * Add events for input form and back buttons (if they exists)
    */
   _addEvents(){
      let self = this;

      function onSubmit(e){
         // reset filters
         if(self._filters){
            self._filters.querySelector('.active').classList.remove('active');
            self._filters.children[0].children[0].classList.add('active');
         }

         // send request
         self._request = { action: "list", type: "multi", query: this.children[0].value };
         self._updateList();

         e.preventDefault();
      }

      function onClickBack(e){
         console.log(e.target);
         if(e.target.tagName !== "A") return false;
         self.openPage(e.target.hash.substring(1));
         self._request = Object.assign({}, self._lastRequest);
         
         e.preventDefault();
      }

      function onFiltersClick(e){
         if(e.target.tagName !== "A") return false;

         e.currentTarget.querySelector('.active').classList.remove('active');
         e.target.classList.add('active');

         self._request.type = e.target.hash.substring(1);
         self._request.page = 1;

         self._updateList();
         e.preventDefault();
      }

      function onPaginationClick (e){
         var target = e.target;
         if(target.nodeName !== "A") return false;

         e.currentTarget.querySelector('.active').classList.remove('active');
         target.classList.add('active');

         // change page and update view
         self._request.page = target.hash.split(":")[1];
         self._updateList();

         e.preventDefault();
      }
      
      function onResultItemClick(e){
         if(e.target === e.currentTarget) return false;
         
         let target = (e.target.tagName === "A") ? e.target : e.target.parentNode,
             [type, id] = target.hash.substr(1).split(":");
         
         // store previous request
         self._lastRequest = Object.assign({}, self._request);
         self._request = { action: "single", type, id };
         
         self._updateSingle();
         e.preventDefault();
      }

      // find all back buttons and add events
      for(let elem of document.querySelectorAll('.back-btn')){
         elem.addEventListener("click", onClickBack);
      }

      if(this._pagination){
         this._pagination.addEventListener("click", onPaginationClick);
      }

      if(this._filters){
         this._filters.addEventListener("click", onFiltersClick);
      }

      // capture submit event
      this._inputForm.addEventListener("submit", onSubmit);
      
      this._resultList.addEventListener("click", onResultItemClick);
   }

   /**
    * Update page for search results and display on screen
    */
   _updateList(){
      let req  = this._request,
          self = this;

      // show preloader
      this._startPreloader();

      this.hidePage(req.action).then(function(){
         // send request
         return self._db.get(req);
      }).then(function(data){
         // add pagination
         self._addPagination(data);

         // update view
         return self._renderList(data);
      }).then(function(){
         // show loaded content
         self.openPage(req.action);
      }).catch(function(err){
         // display errors
         console.log(err);
      }).then(function(){
         // hide preloader
         self._stopPreloader();
      });
   }
   
   /**
    * Update single page and display on screen
    */
   _updateSingle(){
      let req  = this._request;

      // show preloader
      this._startPreloader();
      
      // get data from database
      this._db.get(req).then(data => {
         return this._renderSingle(data);
      }).then(() => {
         this.openPage(req.action);
      }).catch(err => {
         console.log(err);
      }).then(() => {
         // hide preloader
         this._stopPreloader();
      });
   }
   
   /**
    * Render DOM for search result
    *
    * @param {Object} data - fetched data from database
    *
    * @return {Promise}
    */
   _renderList (data) {
      let parent    = this._resultList,
          dfItem    = document.createDocumentFragment(),
          link      = document.createElement('a'),
          imgLength = data.results.length,
          imgLoaded = 0,
          mediaType = "",
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
            parent.classList.add('empty-page');
            parent.appendChild(clone); 

            return resolve();
         } else {
            parent.classList.remove('empty-page');
         }

         link.appendChild(document.createElement('img'));
         link.appendChild(document.createElement('p'));

         // set common class for all images
         link.children[0].className = "img-responsive";
         
         for(let item of data.results){
            clone = link.cloneNode(true);
            let [img, caption] = clone.children;
            
            // item media type
            mediaType = item.media_type || self._request.type;

            // url href
            clone.href = "#"+ mediaType + ":" + item.id;

            switch(mediaType){
               case "movie":
                  img.src = self._db.getImageURL(154, item.poster_path);
                  caption.textContent = item.title;
                  break;
               case "person":
                  img.src = self._db.getImageURL(154, item.profile_path);
                  caption.textContent = item.name;
                  break;
               case "tv":
                  img.src = self._db.getImageURL(154, item.poster_path);
                  caption.textContent = item.name;
                  break;
            }

            // add to container
            dfItem.appendChild(clone);

            // add onload event
            img.addEventListener('load', onImgLoaded);
         }

         // append results to document
         parent.appendChild(dfItem);
      });
   }
   
   /**
    * Render DOM for single item (movie, tv, person)
    *
    * @param {Object} data - fetched data from database
    *
    * @return {Promise}
    */
   _renderSingle(data){
      let parent   = this._resultSingle;
      
      // fetch important data
      let { sections, prop } = this._getDetailsForSingle(this._request.type, data),
          { poster_path: imgURL, original_title: title, tagline: tag = "" } = prop;
      
      // DOM elements
      let dfItem  = document.createDocumentFragment(),
          section = document.createElement('section'),
          image   = document.createElement('img'),
          [header, container] = parent.children,
          clone;
      
      // clear parent
      this._empty(container);
      
      // create section model
      section.className = "item-sect";
      section.appendChild(document.createElement('h3'));
      section.appendChild(document.createElement('p'));
      
      // create container template
      container.innerHTML = '<div class="item-image col-sm-4 col-xs-12"></div><div class="item-details col-sm-8 col-xs-12"></div>';
      
      return new Promise((resolve) => {
         var onImgLoaded = function(e){
            e.target.removeEventListener("load", onImgLoaded);
            resolve();
         };
         
         var prepareTitle = function(title){
            let first = title.charAt(0).toUpperCase();
            return first + title.substr(1).replace("_", " ");
         };
         
         // insert template
         header.children[0].textContent = prepareTitle(title);
         header.children[1].textContent = (tag !== "") ? `(${tag})` : "";
         
         for(let sectionName of sections){
            // 
            clone = section.cloneNode(true); 
            let [header, content] = clone.children;
            
            header.textContent  = prepareTitle(sectionName);
            if(!(sectionName in prop)){
               content.textContent = "no data";
            } else if(prop[sectionName] === null){
               content.textContent = "-";
            } else {
               content.textContent = prop[sectionName]; 
            }
            
            dfItem.appendChild(clone);
         }
         
         // insert img
         image.src = this._db.getImageURL(300, imgURL);
         image.className = "img-responsive";
         image.addEventListener("load", onImgLoaded);
         
         container.children[0].appendChild(image);
         container.children[1].appendChild(dfItem);
      });
   }
   
   /**
    * Show preloader in document
   */
   _startPreloader(){
      if(!this._preloader) return false;
      this._preloader.innerHTML = '<div class="indeterminate"></div>';
      return true;
   }
   
   /**
    * Hide preloader
   */
   _stopPreloader(){
      if(!this._preloader) return false;
      this._preloader.removeChild(this._preloader.firstChild);
      return true;
   }
   
   /**
    * Generate pagination 
    *
    * @param {Object} data - fetched data from database
    */
   _addPagination(data){
      if(this._pagination.children.length === data.total_pages){
         return;
      } else{
         this._empty(this._pagination);

         if(data.total_pages === 1){
            return;
         }
      }

      let items = "",
          active;

      // render pagination
      for(var i=0; i<data.total_pages; i++){
         items += "<li><a href=\"#page:"+(i+1)+"\">" + (i+1) + "</a></li>";
      }

      // add to document
      this._pagination.innerHTML = items;

      active = this._pagination.firstChild.firstChild;
      active.className = 'active';
   }
   
   /**
    * Remove all child nodes in given element
    *
    * @param {Element} parent - element to clean
    */
   _empty(parent){
      while(parent.firstChild){
         parent.removeChild(parent.firstChild);
      }
   }
   
   /**
    * Specifies, which informations should be presented in single element page according to its type (movie, tv, person). It 
    * also standardize data fetched from TMDB to keep compatibility with all types
    *
    * @param {string} type - type of item (available options: movie, tv, person)
    * @param {object} properties - JSON data fetched from database to normalize
    *
    * @return {object} sections which should be displayed on page and corrected data
   */
   _getDetailsForSingle(type, properties){
      let sections = [],
          prop = Object.assign({}, properties);
      
      switch(type){
         case "tv":
            sections = ["overview", "popularity", "first_air_date", "last_air_date", "number_of_episodes", "number_of_seasons"];
            prop.original_title = properties.original_name;
            break;
         case "person":
            sections = ["biography", "birthday", "deathday", "place_of_birth", "popularity"];
            prop.original_title = properties.name;
            prop.poster_path    = properties.profile_path;
            break;
         default:
            sections = ["overview", "popularity", "release_date", "revenue", "runtime", "vote_average"];
      }
      
      return {
         sections,
         prop
      };
   }
}

export default Page;