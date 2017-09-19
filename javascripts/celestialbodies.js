// Generated by CoffeeScript 1.6.2
(function() {
  var Bop, CelestialBody, Dres, Duna, Eeloo, Eve, G, Gilly, HALF_PI, Ike, Jool, Kerbin, Kerbol, Laythe, Minmus, Moho, Mun, Pol, TWO_PI, Tylo, Vall;

  G = 6.674e-11;

  TWO_PI = 2 * Math.PI;

  HALF_PI = 0.5 * Math.PI;

  (typeof exports !== "undefined" && exports !== null ? exports : this).CelestialBody = CelestialBody = (function() {
    function CelestialBody(mass, radius, siderealRotation, orbit, atmPressure, atmScaleHeight) {
      this.mass = mass;
      this.radius = radius;
      this.siderealRotation = siderealRotation;
      this.orbit = orbit;
      this.atmPressure = atmPressure != null ? atmPressure : 0;
      this.atmScaleHeight = atmScaleHeight != null ? atmScaleHeight : 0;
      this.gravitationalParameter = G * this.mass;
      if (this.orbit != null) {
        this.sphereOfInfluence = this.orbit.semiMajorAxis * Math.pow(this.mass / this.orbit.referenceBody.mass, 0.4);
      }
      this.atmRadius = -Math.log(1e-6) * this.atmScaleHeight + this.radius;
    }

    CelestialBody.prototype.circularOrbitVelocity = function(altitude) {
      return Math.sqrt(this.gravitationalParameter / (altitude + this.radius));
    };

    CelestialBody.prototype.siderealTimeAt = function(longitude, time) {
      var result;

      result = ((time / this.siderealRotation) * TWO_PI + HALF_PI + longitude) % TWO_PI;
      if (result < 0) {
        return result + TWO_PI;
      } else {
        return result;
      }
    };

    CelestialBody.prototype.name = function() {
      var k, v;

      for (k in CelestialBody) {
        v = CelestialBody[k];
        if (v === this) {
          return k;
        }
      }
    };

    CelestialBody.prototype.children = function() {
      var k, result, v, _ref;

      result = {};
      for (k in CelestialBody) {
        v = CelestialBody[k];
        if ((v != null ? (_ref = v.orbit) != null ? _ref.referenceBody : void 0 : void 0) === this) {
          result[k] = v;
        }
      }
      return result;
    };

    return CelestialBody;

  })();

  CelestialBody.fromJSON = function(json) {
    var orbit;

    if (json.orbit != null) {
      orbit = Orbit.fromJSON(json.orbit);
    }
    return new CelestialBody(json.mass, json.radius, json.siderealRotation, orbit, json.atmPressure);
  };

  CelestialBody.Kerbol = Kerbol = new CelestialBody(1.7565459e28, 2.616e+08, 432000, null);

  CelestialBody.Moho = Moho = new CelestialBody(2.5263314e21, 250000, 1210000, new Orbit(Kerbol, 5263138304, 0.2, 7.0, 70.0, 15.0, 3.14));

  CelestialBody.Eve = Eve = new CelestialBody(1.2243980e23, 700000, 80500, new Orbit(Kerbol, 9832684544, 0.01, 2.1, 15.0, 0, 3.14), 5, 7000);
  CelestialBody.Gilly = Gilly = new CelestialBody(1.2420363e17, 13000, 28255, new Orbit(Eve, 31500000, 0.55, 12.0, 80.0, 10.0, 0.9));

  CelestialBody.Kerbin = Kerbin = new CelestialBody(5.2915158e22, 600000, 21549.425, new Orbit(Kerbol, 13599840256, 0.0, 0, 0, 0, 3.14), 1, 5600);
  CelestialBody.Mun = Mun = new CelestialBody(9.7599066e20, 200000, 138984.38, new Orbit(Kerbin, 12000000, 0.0, 0, 0, 0, 1.7));
  CelestialBody.Minmus = Minmus = new CelestialBody(2.6457580e19, 60000, 40400, new Orbit(Kerbin, 47000000, 0.0, 6.0, 78.0, 38.0, 0.9));

  CelestialBody.Duna = Duna = new CelestialBody(4.5154270e21, 320000, 65517.859, new Orbit(Kerbol, 20726155264, 0.051, 0.06, 135.5, 0, 3.14), 0.2, 3000);
  CelestialBody.Ike = Ike = new CelestialBody(2.7821615e20, 130000, 65517.862, new Orbit(Duna, 3200000, 0.03, 0.2, 0, 0, 1.7));

  CelestialBody.Dres = Dres = new CelestialBody(3.2190937e20, 138000, 34800, new Orbit(Kerbol, 40839348203, 0.145, 5.0, 280.0, 90.0, 3.14));

  CelestialBody.Jool = Jool = new CelestialBody(4.2332127e24, 6000000, 36000, new Orbit(Kerbol, 68773560320, 0.05, 1.304, 52.0, 0, 0.1), 15, 10000);
  CelestialBody.Laythe = Laythe = new CelestialBody(2.9397311e22, 500000, 52980.879, new Orbit(Jool, 27184000, 0, 0, 0, 0, 3.14), 0.8, 4000);
  CelestialBody.Vall = Vall = new CelestialBody(3.1087655e21, 300000, 105962.09, new Orbit(Jool, 43152000, 0, 0, 0, 0, 0.9));
  CelestialBody.Tylo = Tylo = new CelestialBody(4.2332127e22, 600000, 211926.36, new Orbit(Jool, 68500000, 0, 0.025, 0, 0, 3.14));
  CelestialBody.Bop = Bop = new CelestialBody(3.7261090e19, 65000, 544507.4, new Orbit(Jool, 128500000, 0.235, 15.0, 10.0, 25.0, 0.9));
  CelestialBody.Pol = Pol = new CelestialBody(1.0813507e19, 44000, 901902.62, new Orbit(Jool, 179890000, 0.17085, 4.25, 2.0, 15.0, 0.9));

  CelestialBody.Eeloo = Eeloo = new CelestialBody(1.1149224e21, 210000, 19460, new Orbit(Kerbol, 90118820000, 0.26, 6.15, 50.0, 260.0, 3.14));
  /*
  let SMA = 658641.730114689
  let ECC = 0.0321662678757792
  let INC = 0.025023399525742
  let LPE = 161.222056516093
  let LAN = 234.570698677339
  let MNA = 3.34660152465654
  let EPH = 2972170.89189337
  CelestialBody.TargetShip = new CelestialBody(1e19, 10000, 0, new Orbit(CelestialBody.Kerbin, SMA, ECC, INC, LAN, LPE, MNA, EPH));*/

}).call(this);
