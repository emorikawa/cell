{exec} = require 'child_process'

task 'build', ->
  exec 'coffee --join cell.js -c coffee/*.coffee', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr

task 'watch', ->
  exec 'coffee --join cell.js -wc coffee/*.coffee', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
