if (typeof require !== "undefined") {
    require('../lib/csg.js');
    var chai = require('chai'),
        requirejs = require('requirejs');

    requirejs.config({
        baseUrl: '..',
        nodeRequire: require,
    });

    var carve = requirejs('../lib/carve.js');
} else {
    var carve = Carve;
}

var assert = chai.assert;
chai.Assertion.includeStack = true;

describe('CSG', function() {

    it('can create spheres', function() {
        for (var i = 0; i < 100; ++i) {
            new CSG.sphere({center: [0, 0, 0], radius: 10, resolution: 40});
        }
    })

    it('can create a BSP tree', function() {
        var sphere1 = new CSG.sphere({center: [0, 0, 0], radius: 10, resolution: 100});
        var tree = new CSG.Tree(sphere1.toPolygons());
    });

});

describe('Carve', function() {

    var triangleToArray = function(mesh, triangleNumber) {
        var result = [];
        for (var i = 0; i < 3; ++i) {
            var positionIndex = mesh.indices[triangleNumber*3+i];
            for (var j = 0; j < 3; ++j) {
                result.push(mesh.positions[positionIndex*3+j]);
            }
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
        assert.deepEqual([0,0,0,10,10,10,0,0,10], triangleToArray(mesh, 0));

        mesh.addTriangle([[0,0,0],[10,10,10],[0,0,10]]);
        assert.equal(mesh.numPositions, 6);
        assert.equal(mesh.numTriangles, 2);
        assert.deepEqual([0,0,0,10,10,10,0,0,10], triangleToArray(mesh, 0));
        assert.deepEqual([0,0,0,10,10,10,0,0,10], triangleToArray(mesh, 1));

    });

    it('can create a sphere', function() {

        var sphere1 = carve.createSphere({center: [0, 0, 0], radius: 10, resolution: 1});

        assert.equal(sphere1.numTriangles, 8);
        assert.deepEqual([0  , 10,  0,  0,  0, 10, 10,  0, 0], triangleToArray(sphere1, 0));
        assert.deepEqual([0  ,  0,-10,  0, 10,  0, 10,  0, 0], triangleToArray(sphere1, 1));
        assert.deepEqual([-10,  0,  0,  0,  0, 10,  0, 10, 0], triangleToArray(sphere1, 2));
        assert.deepEqual([0  ,  0,-10,-10,  0,  0,  0, 10, 0], triangleToArray(sphere1, 3));
        assert.deepEqual([0  ,-10,  0,  0,  0, 10,-10,  0, 0], triangleToArray(sphere1, 4));
        assert.deepEqual([0  ,  0,-10,  0,-10,  0,-10,  0, 0], triangleToArray(sphere1, 5));
        assert.deepEqual([10 ,  0,  0,  0,  0, 10,  0,-10, 0], triangleToArray(sphere1, 6));
        assert.deepEqual([0  ,  0,-10, 10,  0,  0,  0,-10, 0], triangleToArray(sphere1, 7));

    });
 
    it('can create spheres', function() {
        for (var i = 0; i < 100; ++i) {
            new carve.createSphere({center: [0, 0, 0], radius: 10, resolution: 40});
        }
    })

    it('can classify a front polygon');
    it('can classify a back polygon');
    it('can classify a coplanar polygon');
    it('can classify a polygon with on vertex on the plane');
    it('can classify a polygon with two vertices on the plane');


    it('can split a straddling polygon', function() {

        var mesh = new carve.Mesh();
        mesh.addTriangle([[0, 0,  0], [10, 0, 0], [10, 10, 0]]);
        mesh.addTriangle([[0, 0,-10], [ 5, 0, 3], [ 0,  0,10]]);

        var plane = new carve.Plane().fromTriangle(mesh, 0);
        var classification = plane.classifyPolygon(mesh, 1);

        var result = plane.splitPolygonNoneCoplanar(mesh, classification);

        assert.deepEqual([[6,4,7], [4,5,7]], result.front);
        assert.deepEqual([[3,6,7]], result.back);
    });

    it('can split a polygon with a vertex on the plane', function() {

        var mesh = new carve.Mesh();
        mesh.addTriangle([[0, 0,   0], [10, 0, 0], [10, 10, 0]]);
        mesh.addTriangle([[0, 0, -10], [0, 0, 0],[10,  0,10]]);

        var plane = new carve.Plane().fromTriangle(mesh, 0);
        var classification = plane.classifyPolygon(mesh, 1);
        assert.equal(1, classification.type);
        var result = plane.splitPolygonOneCoplanar(mesh, classification);

        assert.deepEqual([[4,5,6]], result.front);
        assert.deepEqual([[6,3,4]], result.back);
    });

    it('can create a simple BSP tree', function() {

        var mesh = new carve.Mesh();
        mesh.addTriangle([[0, 0,  0], [10, 0,  0], [10, 10, 0]]);
        mesh.addTriangle([[0, 0, 10], [10, 0, 10], [10, 10, 10]]);
        mesh.addTriangle([[0, 0,-10], [10, 0,-10], [10, 10,-10]]);

        assert.deepEqual({
            0: {
                front: 1,
                back:  2
            }
        }, carve.createBSPTree(mesh));

    });

    it('can create a sphere BSP tree', function() {

        var mesh = carve.createSphere({center: [0, 0, 0], radius: 10, resolution: 100});
        var bsp  = carve.createBSPTree(mesh);
    });

});
