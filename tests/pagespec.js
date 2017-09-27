/**
 * MovieDB application
 * Kamil Armatys
 */
/* globals Page, describe, it, beforeEach, afterEach, expect */

describe("Page DOM Manipulation", function(){
   var page = new Page(null),
       root;

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
      page._empty(root);
      expect(root.children.length).toBe(0);
   });
});