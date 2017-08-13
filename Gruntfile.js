module.exports = function(grunt){
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine : {
      src : 'js/*.js',
      options : {
        specs : 'tests/*.js'
      }
    }
  });

  // Load the plugin that provides the "jasmine" task.
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Default task(s).
  grunt.registerTask('default', ['jasmine']);
};