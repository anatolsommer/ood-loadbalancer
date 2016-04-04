/*!
 * ood-loadbalancer
 * Copyright(c) 2016 Anatol Sommer <anatol@anatol.at>
 * MIT Licensed
 */
/* globals require,exports */
/* jshint strict:global */

'use strict';

var net=require('net'), server;

exports.load=function(log, api, config) {
  config=config || {};
  server=net.createServer(function requestHandler(conn) {
    var ok=0, fatal=0;

    api('config', {get:'maintenance'}, function(err, res) {
      if (err || res.value) {
        return ko(err, res.value);
      }
      api.status(function(err, status) {
        if (err) {
          return ko(err);
        }
        Object.keys(status).forEach(function(app) {
          var state=status[app].master.state;
          if (state==='fatal') {
            ++fatal;
          } else if (state==='running') {
            ++ok;
          }
        });
        if (ok<fatal) {
          return ko(null, null, fatal);
        }
        log.debug('OK');
        conn.end('200 OK\n');
      });
    });

    function ko(err, maintenance, fatal) {
      log.debug('KO', {
        error:(err ? err.message : null),
        maintenance:!!maintenance,
        fatal:fatal
      });
      conn.end('302 KO\n');
    }
  });
  server.listen(config.port || 79);
};

exports.unload=function(log) {
  server.close();
};
