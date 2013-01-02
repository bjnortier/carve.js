var Carve = {};

var createPhere = function(options) {
    options = options || {};
    var center = CSG.parseOptionAs3DVector(options, "center", [0,0,0]);
    var radius = CSG.parseOptionAsFloat(options, "radius", 1);
    var hResolution = CSG.parseOptionAsInt(options, "resolution", CSG.defaultResolution3D);
    var xvector, yvector, zvector;

    if(hResolution < 4) hResolution = 4;
    var vResolution = Math.round(hResolution / 4);

    // Number of polygons = hResolution*vResolution * 2 (polygons per quad) * 2 (top & bottom)
    // Each polygon has 3 vertices, 4 bytes each
    var polygonBuffer = new ArrayBuffer(hResolution*vResolution*2*2*3*4);
    var polygons = new Float32Array(polygonBuffer);
    var pIndex = 0;

    var addPolygon = function(points) {
        for (var i = 0; i < 3; ++i) {
            polygons[pIndex*9 + i*3] = points[i][0];
            polygons[pIndex*9 + i*3 + 1] = points[i][1];
            polygons[pIndex*9 + i*3 + 2] = points[i][2];
        }
        ++pIndex;
    }

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
            addPolygon([
                positionsOnSphere[hSlice][vSlice],
                positionsOnSphere[hSlice][vSlice-1],
                positionsOnSphere[hSlice-1][vSlice]
            ]);
            if (vSlice > 2) {
                addPolygon([
                    positionsOnSphere[hSlice-1][vSlice],
                    positionsOnSphere[hSlice][vSlice-1],
                    positionsOnSphere[hSlice-1][vSlice-1]
                ]);
            }
        }
    }

    return {
        polygons: polygons,
        size: pIndex,
    }
}

Carve.createSphere = createPhere;

if (typeof define === "function") {
    define([], function() {
        return Carve;
    });
}