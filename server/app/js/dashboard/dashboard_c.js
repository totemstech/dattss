'use strict';

function DashboardCtrl($scope, $location, _auth, _dashboard, _socket) {
  $scope.landing = true;

  $scope.user = _auth.user(true).then(function(data) {
    if(!data.logged_in) {
      $location.path('/auth/signin');
    }
    else {
      $scope.landing = false;
      return data;
    }
  });

  /****************************************************************************/
  /*                              INITIALIZATION                              */
  /****************************************************************************/
  $scope.status = _dashboard.get_status().then(function(data) {
    return data;
  });
  _socket.on('status:update', function(data) {
    $scope.status = data;
  });

  /****************************************************************************/
  /*                                 UPDATE                                   */
  /****************************************************************************/
  $scope.$watch('status', function(data) {
    /* Inline function that propagate the given path in an object             */
    var propagate = function(status, path, obj, depth) {
      if(path.length === 0)
        return obj;

      var name = path.shift();
      obj[name] = obj[name] || {
        $lbl: name,
        $dpt: depth,
        $sts: {
          'c': {},
          'g': {},
          'ms': {}
        }
      }
      if(path.length === 0) {
        obj[name].$sts[status.typ] = status;
        obj[name].$sts[status.typ].ok = true;
      }

      propagate(status, path, obj[name], depth + 1);
    };

    /* Transform the tree into an array:                                      */
    /* [ { status: {},                                                        */
    /*     label: {},                                                         */
    /*     depth: {},                                                         */
    /*     child: [] } ];                                                     */
    /* where `child` contains similar objects                                 */
    var tree_to_array = function(obj) {
      var arr = [];
      var reserved = [ '$sts', '$lbl', '$dpt' ];
      for(var child in obj) {
        if(obj.hasOwnProperty(child) &&
           reserved.indexOf(child) === -1) {
          var o = {
            status: obj[child].$sts,
            label: obj[child].$lbl,
            depth: obj[child].$dpt,
            child: tree_to_array(obj[child])
          };
          arr.push(o);
        }
      }
      arr.sort(function(a, b) {
        if(a.label < b.label) return -1;
        if(a.label > b.label) return 1;
        return 0;
      });
      return arr;
    };

    var tree;
    if(data && typeof data === 'object') {
      tree = {};
      for(var type in data) {
        if(data.hasOwnProperty(type)) {
          data[type].forEach(function(status) {
            var path = status.pth.split('.');

            propagate(status, path, tree, 0);
          });
        }
      }
    }

    $scope.current_status = tree_to_array(tree);
  }, true);
};
