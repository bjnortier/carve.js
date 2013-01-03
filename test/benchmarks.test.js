var chai = require('chai'),
    microtime = require('microtime');
    assert = chai.assert;

chai.Assertion.includeStack = true;

describe('Benhmarks', function() {

    var measure = function(timed) {
        var before = microtime.now();
        timed();
        console.log(microtime.now() - before);
    }

    it('will measure obj accesses', function() {
        var obj = new function() {
            this.a = 1.0;
            this.b = 0.0;
            this.c = 0.0;
            this.e = 0.0;
            this.f = 0.0;
        }
        var acc = 0;
        measure(function() {
            for (var i = 0; i < 10000000; ++i) {
                acc += obj.a;
            }
        });
        
    })

    it('will measure array accesses', function() {
        var arr = new Float32Array([1.0, 0.0, 0.0, 0.0, 0.0]);
        var acc = 0;
        measure(function() {
            for (var i = 0; i < 10000000; ++i) {
                acc += arr[0];
            }
        });
    })

    it('will measure obj creations', function() {
        var Point = function(a,b,c) {
            this.a = a;
            this.b = b;
            this.c = c;
        }
        measure(function() {
            for (var i = 0; i < 1000000; ++i) {
                new Point(0,1,2);
            }
        });
    });

    it('will measure array insertions', function() {
        var arr = new Float32Array(100000*3);
        measure(function() {
            for (var i = 0; i < 1000000; ++i) {
                arr[i*3] = 0;
                arr[i*3+1] = 1;
                arr[i*3+2] = 2;
            }
        });
    });

    it('will measure array insertions 2', function() {
        var arr = new Float32Array(100000*3);
        measure(function() {
            for (var i = 0; i < 1000000; ++i) {
                var j = i*3;
                arr[j] = 0;
                arr[j+1] = 1;
                arr[j+2] = 2;
            }
        });
    });

});
