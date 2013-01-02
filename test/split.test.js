if (typeof require !== "undefined") {
    require('../lib/csg.js');
    var assert = require('chai').assert,
        requirejs = require('requirejs');

    requirejs.config({
        baseUrl: '..',
        nodeRequire: require,
    });

    var carve = requirejs('../lib/carve.js');
} else {
    var carve = Carve,
        assert = chai.assert;

}

describe('CSG', function() {

    it('can create a BSP tree', function() {

        var sphere1 = new CSG.sphere({center: [0, 0, 0], radius: 10, resolution: 1});
        // console.log(sphere1);
        // new CSG.Tree(sphere1.toPolygons());

    });

});

describe('Carve', function() {

    var polygonToArray = function(polygon, index) {
        var result = [];
        for (var i = 0; i < 9; ++i) {
            result[i] = polygon[index*9 + i];
        }
        return result;
    }

    it('can create a sphere', function() {

        var sphere1 = new carve.createSphere({center: [0, 0, 0], radius: 10, resolution: 1});

        assert.equal(sphere1.size, 4);
        assert.deepEqual([0, 10, 0, 0, 0, 10, 10, 0, 0], polygonToArray(sphere1.polygons, 0));
        assert.deepEqual([-10, 0, 0, 0, 0, 10, 0, 10, 0], polygonToArray(sphere1.polygons, 1));
        assert.deepEqual([0, -10, 0, 0, 0, 10, -10, 0, 0], polygonToArray(sphere1.polygons, 2));
        assert.deepEqual([10, 0, 0, 0, 0, 10, 0, -10, 0], polygonToArray(sphere1.polygons, 3));
        // ]);

    });

});
