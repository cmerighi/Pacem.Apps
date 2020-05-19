/**
 * pacem v0.9.0-byblos (https://js.pacem.it)
 * Copyright 2020 Pacem (https://pacem.it)
 * Licensed under MIT
 */
var Pacem;
(function (Pacem) {
    const SQRT_PI = Math.sqrt(Math.PI);
    const erfc = function (x) {
        let t, z, ans;
        z = Math.abs(x);
        t = 1.0 / (1.0 + 0.5 * z);
        ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
            t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
                t * (-0.82215223 + t * 0.17087277)))))))));
        return x >= 0.0 ? ans : 2.0 - ans;
    };
    const erf = function (x) {
        return 1 - erfc(x);
    };
    class Gaussian {
        constructor(mean, stdev) {
            this.mean = mean;
            this.stdev = Math.abs(stdev);
            this.variance = Math.pow(stdev, 2);
        }
        static get normal() {
            return _normal;
        }
        probabilityDensity(x) {
            const inv_coeff = this.stdev * Math.SQRT2 * SQRT_PI, exp_part = Math.exp(-0.5 * Math.pow(this._z(x), 2));
            return exp_part / inv_coeff;
        }
        _z(x) {
            return (x - this.mean) / this.stdev;
        }
        probability(x) {
            return 0.5 * erfc(-this._z(x) / Math.SQRT2);
        }
    }
    Pacem.Gaussian = Gaussian;
    const _normal = new Gaussian(0, 1);
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    class Maths {
        static lcd(...args) {
            if (args.length <= 1) {
                throw 'Insufficient set of numbers.';
            }
            function ex9(x, y) {
                if (!y)
                    return y === 0 ? x : NaN;
                return ex9(y, x % y);
            }
            function ex10(x, y) {
                return x * y / ex9(x, y);
            }
            let result = args[0];
            for (let j = 1; j < args.length; j++) {
                result = ex10(result, args[j]);
            }
            return result;
        }
    }
    Pacem.Maths = Maths;
})(Pacem || (Pacem = {}));
