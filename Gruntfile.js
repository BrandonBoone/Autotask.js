module.exports = function (grunt) {
  
    grunt.initConfig({
        jshint: {
            dev: {
                files: {
                    src: 'autotask.js'
                }
            },
            options: {
                laxcomma: true,
                ignores: ['lib/templates.js', 'Gruntfile.js']
            }
        },

        handlebars: {
            dev: {
                files: {
                    "lib/templates.js": ["templates/*.hbr"]
                }
            },
            release: {
                files: {
                    "lib/templates.js": ["templates/*.hbr"]
                }
            },
            options: {
                commonjs:true
            }
        },
        watch: {
            files: ['**/*.js', 'templates/*.hbr', '!templates.js', '!Gruntfile.js'],
            tasks: ['handlebars:dev', 'jshint:dev'],
            options: {
                livereload: true
            }
        }
    });


    [
        , 'grunt-contrib-jshint'
        , 'grunt-contrib-handlebars'
        , 'grunt-contrib-watch'
    ].forEach(function (item) {
        grunt.loadNpmTasks(item);
    });


    var previous_force_state = grunt.option("force");

    grunt.registerTask("force", function (set) {
        if (set === "on") {
            grunt.option("force", true);
        }
        else if (set === "off") {
            grunt.option("force", false);
        }
        else if (set === "restore") {
            grunt.option("force", previous_force_state);
        }
    });

    // Default task(s).
    grunt.registerTask('dev', ['handlebars:dev', 'jshint:dev']);
    grunt.registerTask('release', ['handlebars:release']);


};