var Carve = {};

var Mesh = function(reservedSize) {
    // Init for 1000 points by default
    var initialNumTriangles = reservedSize || 1000;
    this.positions = new Float32Array(new ArrayBuffer(initialNumTriangles*36));
    this.indices = new Uint32Array(new ArrayBuffer(initialNumTriangles*12));
    this.numPositions = 0;
    this.numTriangles = 0;
}

var doubleAndCopyArrayBuffer = function(buf) {
    var bufView1 = new Uint8Array(buf);
    var buf2 = new ArrayBuffer(buf.byteLength*2);
    var buf2View = new Uint8Array(buf2);
    for (var i = 0; i < buf.byteLength; ++i) {
        buf2View[i] = bufView1[i];
    }
    return buf2;
}

Mesh.prototype.ensureSpaceAvailable = function() {
    if ((this.numPositions + 1)*12 > this.positions.buffer.byteLength) {
        this.positions = new Float32Array(doubleAndCopyArrayBuffer(this.positions.buffer));
    } 
    if ((this.numTriangles + 1)*12 > this.indices.buffer.byteLength) {
        this.indices = new Uint32Array(doubleAndCopyArrayBuffer(this.indices.buffer));
    }
}

Mesh.prototype.addTriangle = function(points) {
    this.indices[this.numTriangles*3] = this.addPosition(points[0]);
    this.indices[this.numTriangles*3+1] = this.addPosition(points[1]);
    this.indices[this.numTriangles*3+2] = this.addPosition(points[2]);
    this.numTriangles += 1;
}

Mesh.prototype.addPosition = function(point) {
    this.ensureSpaceAvailable();
    this.positions[this.numPositions*3    ] = point[0];
    this.positions[this.numPositions*3 + 1] = point[1];
    this.positions[this.numPositions*3 + 2] = point[2];
    return this.numPositions++;
}

Mesh.prototype.addTriangleUsingIndices = function(indices) {
    this.ensureSpaceAvailable();
    this.indices[this.numTriangles*3  ]   = indices[0];
    this.indices[this.numTriangles*3+1] = indices[1];
    this.indices[this.numTriangles*3+2] = indices[2];
    this.numTriangles += 1;
}

var CLASSIFICATION = {
    SPLIT: 0,
    FRONT: 1,
    BACK: 2,
}


var Plane = function(normal, w) {
    this.normal = normal;
    this.w = w;
}

Plane.prototype.signedDistanceToPoint = function(positions, index) {
    return (this.normal.x*positions[index*3] + 
            this.normal.y*positions[index*3+1] + 
            this.normal.z*positions[index*3+2]) - this.w;
}

Plane.prototype.fromPolygon = function(positions, indices) {
    var a = new CSG.Vector3D(
        positions[indices[0]*3], 
        positions[indices[0]*3+1], 
        positions[indices[0]*3+2]);
    var b = new CSG.Vector3D(
        positions[indices[1]*3], 
        positions[indices[1]*3+1], 
        positions[indices[1]*3+2]);
    var c = new CSG.Vector3D(
        positions[indices[2]*3], 
        positions[indices[2]*3+1], 
        positions[indices[2]*3+2]);
    var ab = b.minus(a);
    var ac = c.minus(a);
    this.normal = ab.cross(ac).unit();
    this.w = a.dot(this.normal);
    return this;
}

Plane.prototype.classifyPolygon = function(positions, indices) {
    var front = []
    var back = [];
    for (var i = 0; i < 3; ++i) {
        var distance = this.signedDistanceToPoint(positions, indices[i]);
        if (distance > 0) {
            front.push(indices[i]);
        } else if (distance < 0) {
            back.push(indices[i]);
        }
    }
    var type;
    var countFront = front.length;
    var countBack = back.length;
    if ((countBack > 0) && (countFront > 0)) {
        type = CLASSIFICATION.SPLIT;
    } else if ((countBack > 0) && (countFront === 0)) {
        type = CLASSIFICATION.BACK;
    } else if ((countFront > 0) && (countBack === 0)) {
        type = CLASSIFICATION.FRONT;
    } else {
        throw Error('unclassified');
    }
    return {
        type: type,
        front: front,
        back: back,
    }
}

// To simplify the algorithm, rearrange the indices so that AB and AC is split by the plane
// and BC is not. Also keep the right-hand ordering
var reorderStraddlingPoints = function(classification) {
    var front = classification.front,
        back  = classification.back,
        countFront = classification.front.length,
        countBack = classification.back.length,
        reordered = [];
    if (countFront > countBack) {
        reordered[0] = back[0];
        if (countFront[0] < reordered[0]) {
            reordered[1] = front[1];
            reordered[2] = front[0];
        } else {
            reordered[1] = front[0];
            reordered[2] = front[1];
        }
    } else {
        reordered[0] = front[0];
        if (countFront[0] < reordered[0]) {
            reordered[1] = back[1];
            reordered[2] = back[0];
        } else {
            reordered[1] = back[0];
            reordered[2] = back[1];
        }
    }
    return {
        moreInFront: countFront > countBack,
        indices: reordered
    }
}

// http://en.wikipedia.org/wiki/Line-plane_intersection
Plane.prototype.linePlaneIntersection = function(l0, l) {
    var p0 = this.normal.times(this.w);
    var d = (p0.minus(l0)).dot(this.normal)/(l.dot(this.normal));
    return l0.plus(l.times(d));

}

Plane.prototype.splitPolygon = function(mesh, classification) {
    var reordered = reorderStraddlingPoints(classification),
        reorderedIndices = reordered.indices;

    var positions = mesh.positions;
    
    var a = new CSG.Vector3D(
        positions[reorderedIndices[0]*3], 
        positions[reorderedIndices[0]*3+1],  
        positions[reorderedIndices[0]*3+2]);
    var b = new CSG.Vector3D(
        positions[reorderedIndices[1]*3], 
        positions[reorderedIndices[1]*3+1], 
        positions[reorderedIndices[1]*3+2]);
    var c = new CSG.Vector3D(
        positions[reorderedIndices[2]*3], 
        positions[reorderedIndices[2]*3+1], 
        positions[reorderedIndices[2]*3+2]);

    var ab = b.minus(a);
    var ac = c.minus(a);

    var abint = this.linePlaneIntersection(a, ab);
    var acint = this.linePlaneIntersection(a, ac);

    var abIntIndex = mesh.addPosition(abint.x, abint.y, abint.z);
    var acIntIndex = mesh.addPosition(acint.x, acint.y, acint.z);

    mesh.addTriangleUsingIndices([reorderedIndices[0], abIntIndex, acIntIndex]);
    mesh.addTriangleUsingIndices([abIntIndex, reorderedIndices[1], acIntIndex]);
    mesh.addTriangleUsingIndices([reorderedIndices[1], reorderedIndices[2], acIntIndex]);

    if (reordered.moreInFront) {
        return {
            front: [
                [abIntIndex, reorderedIndices[1], acIntIndex],
                [reorderedIndices[1], reorderedIndices[2], acIntIndex],
            ],
            back:  [
                [reorderedIndices[0], abIntIndex, acIntIndex]
            ]
        }
    } else {
        return {
            back: [
                [abIntIndex, reorderedIndices[1], acIntIndex],
                [reorderedIndices[1], reorderedIndices[2], acIntIndex],
            ],
            front: [
                [reorderedIndices[0], abIntIndex, acIntIndex]
            ]
        }
    }

}


var Node = function(mesh, indicesForNode, remaining) {
    this.indices = indicesForNode;

    var plane = new Plane().fromPolygon(mesh.positions, indicesForNode);

    var front = [], back = [];
    for (var i = 0; i < remaining.length; ++i) {
        var triangleIndices = remaining[i];
        var classification = plane.classifyPolygon(mesh.positions, triangleIndices);
        switch(classification.type) {
            case (CLASSIFICATION.FRONT):
                front.push(triangleIndices);
                break;
            case (CLASSIFICATION.BACK):
                back.push(triangleIndices);
                break;
            case (CLASSIFICATION.SPLIT):
                var splitResult = plane.splitPolygon(mesh, classification.front, classification.back);
                front = front.concat(splitResult.front);
                back = back.concat(splitResult.back);
                break;
        }
    }    
    if (front.length > 0) { 
        this.front = new Node(mesh, front[0], front.slice(1));
    } 
    if (back.length > 0) {
        this.back = new Node(mesh, back[0], back.slice(1));
    }
}

var createBSPTree = function(mesh) {

    var remaining = [];
    for (var i = 1; i < mesh.numTriangles; ++i) {
        remaining.push([i*3, i*3+1, i*3+2]);
    }
    
    return new Node(mesh, [0,1,2], remaining);
}

var createSphere = function(options) {
    options = options || {};
    var center = options.center || [0,0,0];
    var radius = options.radius || 1;
    var hResolution = options.resolution || 4;
    var xvector, yvector, zvector;

    if(hResolution < 4) hResolution = 4;
    var vResolution = Math.round(hResolution / 4);

    // Number of polygons = hResolution*vResolution * 2 (polygons per quad) * 2 (top & bottom)
    // Each polygon has 3 vertices, 4 bytes each
    var numVertices = hResolution*vResolution*2*2;
    var polygonBuffer = new ArrayBuffer(numVertices*3*4);
    var polygons = new Float32Array(polygonBuffer);
    var indices = new Uint32Array(new ArrayBuffer(numVertices*3))
    var pIndex = 0;

    var mesh = new Mesh();


    var positionsOnSphere = {};
    for (var hSlice = 0; hSlice <= hResolution; ++hSlice) {
        positionsOnSphere[hSlice] = {};

        var theta = Math.PI * 2.0 * hSlice / hResolution;
        var costheta = ((hSlice === hResolution/4) || (hSlice === hResolution*3/4)) ? 0 : Math.cos(theta);
        var sintheta = ((hSlice === hResolution/2) || (hSlice === hResolution)) ? 0 : Math.sin(theta);

        for (var vSlice = 0; vSlice <= vResolution; ++vSlice) {
            var phi = 0.5 * Math.PI * vSlice / vResolution;
            var sinphi = vSlice === vResolution ? 1 : Math.sin(phi);
            var cosphi = vSlice === vResolution ? 0 : Math.cos(phi);

            positionsOnSphere[hSlice][vSlice] = 
                [
                    radius*costheta*sinphi,
                    radius*sintheta*sinphi,
                    radius*cosphi,
                ];
        }
    }

    for (var hSlice = 1; hSlice <= hResolution; ++hSlice) {
        for (var vSlice = 1; vSlice <= vResolution; ++vSlice) {
            addTriangle([
                positionsOnSphere[hSlice][vSlice],
                positionsOnSphere[hSlice][vSlice-1],
                positionsOnSphere[hSlice-1][vSlice]
            ]);
            if (vSlice > 2) {
                addTriangle([
                    positionsOnSphere[hSlice-1][vSlice],
                    positionsOnSphere[hSlice][vSlice-1],
                    positionsOnSphere[hSlice-1][vSlice-1]
                ]);
            }
        }
    }

    return new Mesh(polygons, indices, pIndex);
}

Carve.createSphere = createSphere;
Carve.createBSPTree = createBSPTree;
Carve.Mesh = Mesh;
Carve.Plane = Plane;

if (typeof define === "function") {
    define([], function() {
        return Carve;
    });
}