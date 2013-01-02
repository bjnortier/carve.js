if (typeof require !== "undefined") {
    require('../lib/csg.js');
    var chai = require('chai'),
        assert = chai.assert,
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

chai.Assertion.includeStack = true;

describe('CSG', function() {

    it.skip('can create spheres', function() {
        for (var i = 0; i < 100; ++i) {
            new CSG.sphere({center: [0, 0, 0], radius: 10, resolution: 40});
        }
    })

    it('can create a BSP tree', function() {

        var sphere1 = new CSG.sphere({center: [0, 0, 0], radius: 10, resolution: 1});
        var tree = new CSG.Tree(sphere1.toPolygons());
    });

});

describe('Carve', function() {

    var triangleToArray = function(polygon, index) {
        var result = [];
        for (var i = 0; i < 9; ++i) {
            result[i] = polygon[index*9 + i];
        }
        return result;
    }

    it('can add points to meshes', function() {
        var mesh = new carve.Mesh();
        assert.equal(0, mesh.numPositions);
        assert.equal(0, mesh.numTriangles);

        var index = mesh.addPosition([0,0,0]);
        assert.equal(0, index);
        assert.equal(1, mesh.numPositions);
        assert.equal(0, mesh.numTriangles);

    });

    it('can create meshes that automatically resize', function() {
        var mesh = new carve.Mesh(1);
        assert.equal(0, mesh.numPositions);

        mesh.addTriangle([[0,0,0],[10,10,10],[0,0,10]]);
        assert.equal(mesh.numPositions, 3);
        assert.equal(mesh.numTriangles, 1);
        assert.deepEqual([0,0,0,10,10,10,0,0,10], triangleToArray(mesh.positions, 0));

        mesh.addTriangle([[0,0,0],[10,10,10],[0,0,10]]);
        assert.equal(mesh.numPositions, 6);
        assert.equal(mesh.numTriangles, 2);
        assert.deepEqual([0,0,0,10,10,10,0,0,10], triangleToArray(mesh.positions, 0));
        assert.deepEqual([0,0,0,10,10,10,0,0,10], triangleToArray(mesh.positions, 1));

    });
 
    it.skip('can create spheres', function() {
        for (var i = 0; i < 100; ++i) {
            new carve.createSphere({center: [0, 0, 0], radius: 10, resolution: 40});
        }
    })

    it('can create a sphere', function() {

        var sphere1 = new carve.createSphere({center: [0, 0, 0], radius: 10, resolution: 1});

        assert.equal(sphere1.size, 4);
        assert.deepEqual([0, 10, 0, 0, 0, 10, 10, 0, 0], triangleToArray(sphere1.positions, 0));
        assert.deepEqual([-10, 0, 0, 0, 0, 10, 0, 10, 0], triangleToArray(sphere1.positions, 1));
        assert.deepEqual([0, -10, 0, 0, 0, 10, -10, 0, 0], triangleToArray(sphere1.positions, 2));
        assert.deepEqual([10, 0, 0, 0, 0, 10, 0, -10, 0], triangleToArray(sphere1.positions, 3));

    });

    it('can split polygons', function() {

        var mesh = new carve.Mesh();
        mesh.addTriangle([[0, 0,  0], [10, 0, 0], [10, 10, 0]]);
        mesh.addTriangle([[0, 0,-10], [ 5, 0, 3], [ 0,  0,10]]);

        var plane = new carve.Plane().fromPolygon(mesh.positions, [0,1,2]);
        var classification = plane.classifyPolygon(mesh.positions, [3,4,5]);

        var result = plane.splitPolygon(mesh, classification);

        assert.deepEqual([[6,4,7], [4,5,7]], result.front);
        assert.deepEqual([[3,6,7]], result.back);
    });

    it.only('can create a BSP tree', function() {

        var mesh = new carve.Mesh();
        mesh.addTriangle([[0, 0,  0], [10, 0,  0], [10, 10, 0]]);
        mesh.addTriangle([[0, 0, 10], [10, 0, 10], [10, 10, 10]]);
        mesh.addTriangle([[0, 0,-10], [10, 0,-10], [10, 10,-10]]);

        assert.deepEqual({
            indices: [0,1,2], front: [[3,4,5]], back:[[6,7,8]],
        }, carve.createBSPTree(mesh));

    });

});
