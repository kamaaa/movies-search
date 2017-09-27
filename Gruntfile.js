/**
 * MovieDB application
 * Kamil Armatys
 */
/* jshint strict: global */
"use strict";

// Plugins for CSS
const autoprefixer = require('autoprefixer');

// Plugins for Rollup (JS)
const uglifyES = require('uglify-es'),
      uglify   = require('rollup-plugin-uglify'),
      babel    = require('rollup-plugin-babel');

module.exports = function (grunt) {
   // Project configuration.
   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      jasmine: {
         options: {
            specs: 'tests/*spec.js'
         },
         src: 'src/js/test.js'
      },
      concat: {
         options: {
            banner: '/* !<%= pkg.name %> | <%= pkg.author %> | <%= grunt.template.today("dd-mm-yyyy") %> */\n'
         },
         dist: {
            src: ['src/css/bootstrap.css', 'src/css/template.css'],
            dest: 'build/css/template.css',
         },
      },
      clean: {
         test: ['src/js/test.js']
      },
      postcss: {
         options: {
            map: false,
            processors: [
               autoprefixer({
                  browsers: ['last 3 version', 'ie >= 11']
               })
			   ]
         },
         dist: {
            files: {
               'build/css/template.css': 'src/css/template.css'
            }
         }
      },
      rollup: {
         test: {
            options: {
               format: "iife",
               sourceMap: false,
               plugins: [
                  babel({
                     exclude: './node_modules/**'
                  })
               ]
            },
            src: "tests/helper.js",
            dest: "src/js/test.js"
         },
         dev: {
            options: {
               format: "iife",
               sourceMap: "inline"
            },
            dest: "build/js/app.min.js",
            src: "src/js/app.js"
         },
         public: {
            options: {
               banner: '/* !<%= pkg.name %> | <%= pkg.author %> | <%= grunt.template.today("dd-mm-yyyy") %> */\n',
               format: "iife",
               sourceMap: false,
               plugins: [
                  uglify({}, uglifyES.minify)
               ]
            },
            dest: "build/js/app.min.js",
            src: "src/js/app.js"
         }
      }
   });

   // Load the plugin that provides the "jasmine" task.
   grunt.loadNpmTasks('grunt-contrib-jasmine');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-clean');
   grunt.loadNpmTasks('grunt-postcss');
   grunt.loadNpmTasks('grunt-rollup');

   // Default task runs unit tests. 
   grunt.registerTask('default', ['rollup:test', 'jasmine', 'clean']);

   // Build all project for publication
   grunt.registerTask('build', ['rollup:public', 'postcss', 'concat']);

   // Build for development
   grunt.registerTask('dev', ['rollup:dev', 'concat']);
};
