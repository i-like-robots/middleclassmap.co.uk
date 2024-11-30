'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Geodesy representation conversion functions                        (c) Chris Veness 2002-2020  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/latlong.html                                                    */
/* www.movable-type.co.uk/scripts/js/geodesy/geodesy-library.html#dms                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* eslint no-irregular-whitespace: [2, { skipComments: true }] */

/**
 * Latitude/longitude points may be represented as decimal degrees, or subdivided into sexagesimal
 * minutes and seconds. This module provides methods for parsing and representing degrees / minutes
 * / seconds.
 *
 * @module dms
 */

/* Degree-minutes-seconds (& cardinal directions) separator character */
let dmsSeparator = '\u202f' // U+202F = 'narrow no-break space'

/**
 * Functions for parsing and representing degrees / minutes / seconds.
 */
class Dms {
  // note Unicode Degree = U+00B0. Prime = U+2032, Double prime = U+2033

  /**
   * Separator character to be used to separate degrees, minutes, seconds, and cardinal directions.
   *
   * Default separator is U+202F ‘narrow no-break space’.
   *
   * To change this (e.g. to empty string or full space), set Dms.separator prior to invoking
   * formatting.
   *
   * @example
   *   import LatLon, { Dms } from '/js/geodesy/latlon-spherical.js';
   *   const p = new LatLon(51.2, 0.33).toString('dms');  // 51° 12′ 00″ N, 000° 19′ 48″ E
   *   Dms.separator = '';                                // no separator
   *   const pʹ = new LatLon(51.2, 0.33).toString('dms'); // 51°12′00″N, 000°19′48″E
   */
  static get separator() {
    return dmsSeparator
  }
  static set separator(char) {
    dmsSeparator = char
  }

  /**
   * Parses string representing degrees/minutes/seconds into numeric degrees.
   *
   * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
   * suffixed by compass direction (NSEW); a variety of separators are accepted. Examples -3.62,
   * '3 37 12W', '3°37′12″W'.
   *
   * Thousands/decimal separators must be comma/dot; use Dms.fromLocale to convert locale-specific
   * thousands/decimal separators.
   *
   * @param   {string|number} dms - Degrees or deg/min/sec in variety of formats.
   * @returns {number}        Degrees as decimal number.
   *
   * @example
   *   const lat = Dms.parse('51° 28′ 40.37″ N');
   *   const lon = Dms.parse('000° 00′ 05.29″ W');
   *   const p1 = new LatLon(lat, lon); // 51.4779°N, 000.0015°W
   */
  static parse(dms) {
    // check for signed decimal degrees without NSEW, if so return it directly
    if (!isNaN(parseFloat(dms)) && isFinite(dms)) return Number(dms)

    // strip off any sign or compass dir'n & split out separate d/m/s
    const dmsParts = String(dms)
      .trim()
      .replace(/^-/, '')
      .replace(/[NSEW]$/i, '')
      .split(/[^0-9.,]+/)
    if (dmsParts[dmsParts.length - 1] == '') dmsParts.splice(dmsParts.length - 1) // from trailing symbol

    if (dmsParts == '') return NaN

    // and convert to decimal degrees...
    let deg = null
    switch (dmsParts.length) {
      case 3: // interpret 3-part result as d/m/s
        deg = dmsParts[0] / 1 + dmsParts[1] / 60 + dmsParts[2] / 3600
        break
      case 2: // interpret 2-part result as d/m
        deg = dmsParts[0] / 1 + dmsParts[1] / 60
        break
      case 1: // just d (possibly decimal) or non-separated dddmmss
        deg = dmsParts[0]
        // check for fixed-width unseparated format eg 0033709W
        //if (/[NS]/i.test(dmsParts)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
        //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600;
        break
      default:
        return NaN
    }
    if (/^-|[WS]$/i.test(dms.trim())) deg = -deg // take '-', west and south as -ve

    return Number(deg)
  }

  /**
   * Converts decimal degrees to deg/min/sec format
   *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
   *    direction is added.
   *  - degrees are zero-padded to 3 digits; for degrees latitude, use .slice(1) to remove leading
   *    zero.
   *
   * @private
   * @param   {number} deg - Degrees to be formatted as specified.
   * @param   {string} [format=d] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
   * @param   {number} [dp=4|2|0] - Number of decimal places to use – default 4 for d, 2 for dm, 0 for dms.
   * @returns {string} Degrees formatted as deg/min/secs according to specified format.
   */
  static toDms(deg, format = 'd', dp = undefined) {
    if (isNaN(deg)) return null // give up here if we can't make a number from deg
    if (typeof deg == 'string' && deg.trim() == '') return null
    if (typeof deg == 'boolean') return null
    if (deg == Infinity) return null
    if (deg == null) return null

    // default values
    if (dp === undefined) {
      switch (format) {
        case 'd':
        case 'deg':
          dp = 4
          break
        case 'dm':
        case 'deg+min':
          dp = 2
          break
        case 'dms':
        case 'deg+min+sec':
          dp = 0
          break
        default:
          format = 'd'
          dp = 4
          break // be forgiving on invalid format
      }
    }

    deg = Math.abs(deg) // (unsigned result ready for appending compass dir'n)

    let dms = null,
      d = null,
      m = null,
      s = null
    switch (format) {
      default: // invalid format spec!
      case 'd':
      case 'deg':
        d = deg.toFixed(dp) // round/right-pad degrees
        if (d < 100) d = '0' + d // left-pad with leading zeros (note may include decimals)
        if (d < 10) d = '0' + d
        dms = d + '°'
        break
      case 'dm':
      case 'deg+min':
        d = Math.floor(deg) // get component deg
        m = ((deg * 60) % 60).toFixed(dp) // get component min & round/right-pad
        if (m == 60) {
          m = (0).toFixed(dp)
          d++
        } // check for rounding up
        d = ('000' + d).slice(-3) // left-pad with leading zeros
        if (m < 10) m = '0' + m // left-pad with leading zeros (note may include decimals)
        dms = d + '°' + Dms.separator + m + '′'
        break
      case 'dms':
      case 'deg+min+sec':
        d = Math.floor(deg) // get component deg
        m = Math.floor((deg * 3600) / 60) % 60 // get component min
        s = ((deg * 3600) % 60).toFixed(dp) // get component sec & round/right-pad
        if (s == 60) {
          s = (0).toFixed(dp)
          m++
        } // check for rounding up
        if (m == 60) {
          m = 0
          d++
        } // check for rounding up
        d = ('000' + d).slice(-3) // left-pad with leading zeros
        m = ('00' + m).slice(-2) // left-pad with leading zeros
        if (s < 10) s = '0' + s // left-pad with leading zeros (note may include decimals)
        dms = d + '°' + Dms.separator + m + '′' + Dms.separator + s + '″'
        break
    }

    return dms
  }

  /**
   * Converts numeric degrees to deg/min/sec latitude (2-digit degrees, suffixed with N/S).
   *
   * @param   {number} deg - Degrees to be formatted as specified.
   * @param   {string} [format=d] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
   * @param   {number} [dp=4|2|0] - Number of decimal places to use – default 4 for d, 2 for dm, 0 for dms.
   * @returns {string} Degrees formatted as deg/min/secs according to specified format.
   *
   * @example
   *   const lat = Dms.toLat(-3.62, 'dms'); // 3°37′12″S
   */
  static toLat(deg, format, dp) {
    const lat = Dms.toDms(Dms.wrap90(deg), format, dp)
    return lat === null ? '–' : lat.slice(1) + Dms.separator + (deg < 0 ? 'S' : 'N') // knock off initial '0' for lat!
  }

  /**
   * Convert numeric degrees to deg/min/sec longitude (3-digit degrees, suffixed with E/W).
   *
   * @param   {number} deg - Degrees to be formatted as specified.
   * @param   {string} [format=d] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
   * @param   {number} [dp=4|2|0] - Number of decimal places to use – default 4 for d, 2 for dm, 0 for dms.
   * @returns {string} Degrees formatted as deg/min/secs according to specified format.
   *
   * @example
   *   const lon = Dms.toLon(-3.62, 'dms'); // 3°37′12″W
   */
  static toLon(deg, format, dp) {
    const lon = Dms.toDms(Dms.wrap180(deg), format, dp)
    return lon === null ? '–' : lon + Dms.separator + (deg < 0 ? 'W' : 'E')
  }

  /**
   * Converts numeric degrees to deg/min/sec as a bearing (0°..360°).
   *
   * @param   {number} deg - Degrees to be formatted as specified.
   * @param   {string} [format=d] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
   * @param   {number} [dp=4|2|0] - Number of decimal places to use – default 4 for d, 2 for dm, 0 for dms.
   * @returns {string} Degrees formatted as deg/min/secs according to specified format.
   *
   * @example
   *   const lon = Dms.toBrng(-3.62, 'dms'); // 356°22′48″
   */
  static toBrng(deg, format, dp) {
    const brng = Dms.toDms(Dms.wrap360(deg), format, dp)
    return brng === null ? '–' : brng.replace('360', '0') // just in case rounding took us up to 360°!
  }

  /**
   * Converts DMS string from locale thousands/decimal separators to JavaScript comma/dot separators
   * for subsequent parsing.
   *
   * Both thousands and decimal separators must be followed by a numeric character, to facilitate
   * parsing of single lat/long string (in which whitespace must be left after the comma separator).
   *
   * @param   {string} str - Degrees/minutes/seconds formatted with locale separators.
   * @returns {string} Degrees/minutes/seconds formatted with standard Javascript separators.
   *
   * @example
   *   const lat = Dms.fromLocale('51°28′40,12″N');                          // '51°28′40.12″N' in France
   *   const p = new LatLon(Dms.fromLocale('51°28′40,37″N, 000°00′05,29″W'); // '51.4779°N, 000.0015°W' in France
   */
  static fromLocale(str) {
    const locale = (123456.789).toLocaleString()
    const separator = { thousands: locale.slice(3, 4), decimal: locale.slice(7, 8) }
    return str.replace(separator.thousands, '⁜').replace(separator.decimal, '.').replace('⁜', ',')
  }

  /**
   * Converts DMS string from JavaScript comma/dot thousands/decimal separators to locale separators.
   *
   * Can also be used to format standard numbers such as distances.
   *
   * @param   {string} str - Degrees/minutes/seconds formatted with standard Javascript separators.
   * @returns {string} Degrees/minutes/seconds formatted with locale separators.
   *
   * @example
   *   const Dms.toLocale('123,456.789');                   // '123.456,789' in France
   *   const Dms.toLocale('51°28′40.12″N, 000°00′05.31″W'); // '51°28′40,12″N, 000°00′05,31″W' in France
   */
  static toLocale(str) {
    const locale = (123456.789).toLocaleString()
    const separator = { thousands: locale.slice(3, 4), decimal: locale.slice(7, 8) }
    return str
      .replace(/,([0-9])/, '⁜$1')
      .replace('.', separator.decimal)
      .replace('⁜', separator.thousands)
  }

  /**
   * Returns compass point (to given precision) for supplied bearing.
   *
   * @param   {number} bearing - Bearing in degrees from north.
   * @param   {number} [precision=3] - Precision (1:cardinal / 2:intercardinal / 3:secondary-intercardinal).
   * @returns {string} Compass point for supplied bearing.
   *
   * @example
   *   const point = Dms.compassPoint(24);    // point = 'NNE'
   *   const point = Dms.compassPoint(24, 1); // point = 'N'
   */
  static compassPoint(bearing, precision = 3) {
    if (![1, 2, 3].includes(Number(precision)))
      throw new RangeError(`invalid precision ‘${precision}’`)
    // note precision could be extended to 4 for quarter-winds (eg NbNW), but I think they are little used

    bearing = Dms.wrap360(bearing) // normalise to range 0..360°

    const cardinals = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ]
    const n = 4 * 2 ** (precision - 1) // no of compass points at req’d precision (1=>4, 2=>8, 3=>16)
    const cardinal = cardinals[((Math.round((bearing * n) / 360) % n) * 16) / n]

    return cardinal
  }

  /**
   * Constrain degrees to range -90..+90 (for latitude); e.g. -91 => -89, 91 => 89.
   *
   * @private
   * @param {number} degrees
   * @returns degrees within range -90..+90.
   */
  static wrap90(degrees) {
    if (-90 <= degrees && degrees <= 90) return degrees // avoid rounding due to arithmetic ops if within range

    // latitude wrapping requires a triangle wave function; a general triangle wave is
    //     f(x) = 4a/p ⋅ | (x-p/4)%p - p/2 | - a
    // where a = amplitude, p = period, % = modulo; however, JavaScript '%' is a remainder operator
    // not a modulo operator - for modulo, replace 'x%n' with '((x%n)+n)%n'
    const x = degrees,
      a = 90,
      p = 360
    return ((4 * a) / p) * Math.abs(((((x - p / 4) % p) + p) % p) - p / 2) - a
  }

  /**
   * Constrain degrees to range -180..+180 (for longitude); e.g. -181 => 179, 181 => -179.
   *
   * @private
   * @param {number} degrees
   * @returns degrees within range -180..+180.
   */
  static wrap180(degrees) {
    if (-180 <= degrees && degrees <= 180) return degrees // avoid rounding due to arithmetic ops if within range

    // longitude wrapping requires a sawtooth wave function; a general sawtooth wave is
    //     f(x) = (2ax/p - p/2) % p - a
    // where a = amplitude, p = period, % = modulo; however, JavaScript '%' is a remainder operator
    // not a modulo operator - for modulo, replace 'x%n' with '((x%n)+n)%n'
    const x = degrees,
      a = 180,
      p = 360
    return (((((2 * a * x) / p - p / 2) % p) + p) % p) - a
  }

  /**
   * Constrain degrees to range 0..360 (for bearings); e.g. -1 => 359, 361 => 1.
   *
   * @private
   * @param {number} degrees
   * @returns degrees within range 0..360.
   */
  static wrap360(degrees) {
    if (0 <= degrees && degrees < 360) return degrees // avoid rounding due to arithmetic ops if within range

    // bearing wrapping requires a sawtooth wave function with a vertical offset equal to the
    // amplitude and a corresponding phase shift; this changes the general sawtooth wave function from
    //     f(x) = (2ax/p - p/2) % p - a
    // to
    //     f(x) = (2ax/p) % p
    // where a = amplitude, p = period, % = modulo; however, JavaScript '%' is a remainder operator
    // not a modulo operator - for modulo, replace 'x%n' with '((x%n)+n)%n'
    const x = degrees,
      a = 180,
      p = 360
    return ((((2 * a * x) / p) % p) + p) % p
  }
}

// Extend Number object with methods to convert between degrees & radians
Number.prototype.toRadians = function () {
  return (this * Math.PI) / 180
}
Number.prototype.toDegrees = function () {
  return (this * 180) / Math.PI
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Vector handling functions                                          (c) Chris Veness 2011-2019  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/geodesy-library.html#vector3d                                   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Library of 3-d vector manipulation routines.
 *
 * @module vector3d
 */

/* Vector3d - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/**
 * Functions for manipulating generic 3-d vectors.
 *
 * Functions return vectors as return results, so that operations can be chained.
 *
 * @example
 *   const v = v1.cross(v2).dot(v3) // ≡ v1×v2⋅v3
 */
class Vector3d {
  /**
   * Creates a 3-d vector.
   *
   * @param {number} x - X component of vector.
   * @param {number} y - Y component of vector.
   * @param {number} z - Z component of vector.
   *
   * @example
   *   import Vector3d from '/js/geodesy/vector3d.js';
   *   const v = new Vector3d(0.267, 0.535, 0.802);
   */
  constructor(x, y, z) {
    if (isNaN(x) || isNaN(y) || isNaN(z)) throw new TypeError(`invalid vector [${x},${y},${z}]`)

    this.x = Number(x)
    this.y = Number(y)
    this.z = Number(z)
  }

  /**
   * Length (magnitude or norm) of ‘this’ vector.
   *
   * @returns {number} Magnitude of this vector.
   */
  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  /**
   * Adds supplied vector to ‘this’ vector.
   *
   * @param   {Vector3d} v - Vector to be added to this vector.
   * @returns {Vector3d} Vector representing sum of this and v.
   */
  plus(v) {
    if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object')

    return new Vector3d(this.x + v.x, this.y + v.y, this.z + v.z)
  }

  /**
   * Subtracts supplied vector from ‘this’ vector.
   *
   * @param   {Vector3d} v - Vector to be subtracted from this vector.
   * @returns {Vector3d} Vector representing difference between this and v.
   */
  minus(v) {
    if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object')

    return new Vector3d(this.x - v.x, this.y - v.y, this.z - v.z)
  }

  /**
   * Multiplies ‘this’ vector by a scalar value.
   *
   * @param   {number}   x - Factor to multiply this vector by.
   * @returns {Vector3d} Vector scaled by x.
   */
  times(x) {
    if (isNaN(x)) throw new TypeError(`invalid scalar value ‘${x}’`)

    return new Vector3d(this.x * x, this.y * x, this.z * x)
  }

  /**
   * Divides ‘this’ vector by a scalar value.
   *
   * @param   {number}   x - Factor to divide this vector by.
   * @returns {Vector3d} Vector divided by x.
   */
  dividedBy(x) {
    if (isNaN(x)) throw new TypeError(`invalid scalar value ‘${x}’`)

    return new Vector3d(this.x / x, this.y / x, this.z / x)
  }

  /**
   * Multiplies ‘this’ vector by the supplied vector using dot (scalar) product.
   *
   * @param   {Vector3d} v - Vector to be dotted with this vector.
   * @returns {number}   Dot product of ‘this’ and v.
   */
  dot(v) {
    if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object')

    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  /**
   * Multiplies ‘this’ vector by the supplied vector using cross (vector) product.
   *
   * @param   {Vector3d} v - Vector to be crossed with this vector.
   * @returns {Vector3d} Cross product of ‘this’ and v.
   */
  cross(v) {
    if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object')

    const x = this.y * v.z - this.z * v.y
    const y = this.z * v.x - this.x * v.z
    const z = this.x * v.y - this.y * v.x

    return new Vector3d(x, y, z)
  }

  /**
   * Negates a vector to point in the opposite direction.
   *
   * @returns {Vector3d} Negated vector.
   */
  negate() {
    return new Vector3d(-this.x, -this.y, -this.z)
  }

  /**
   * Normalizes a vector to its unit vector
   * – if the vector is already unit or is zero magnitude, this is a no-op.
   *
   * @returns {Vector3d} Normalised version of this vector.
   */
  unit() {
    const norm = this.length
    if (norm == 1) return this
    if (norm == 0) return this

    const x = this.x / norm
    const y = this.y / norm
    const z = this.z / norm

    return new Vector3d(x, y, z)
  }

  /**
   * Calculates the angle between ‘this’ vector and supplied vector atan2(|p₁×p₂|, p₁·p₂) (or if
   * (extra-planar) ‘n’ supplied then atan2(n·p₁×p₂, p₁·p₂).
   *
   * @param   {Vector3d} v - Vector whose angle is to be determined from ‘this’ vector.
   * @param   {Vector3d} [n] - Plane normal: if supplied, angle is signed +ve if this->v is
   *                     clockwise looking along n, -ve in opposite direction.
   * @returns {number}   Angle (in radians) between this vector and supplied vector (in range 0..π
   *                     if n not supplied, range -π..+π if n supplied).
   */
  angleTo(v, n = undefined) {
    if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object')
    if (!(n instanceof Vector3d || n == undefined)) throw new TypeError('n is not Vector3d object')

    // q.v. stackoverflow.com/questions/14066933#answer-16544330, but n·p₁×p₂ is numerically
    // ill-conditioned, so just calculate sign to apply to |p₁×p₂|

    // if n·p₁×p₂ is -ve, negate |p₁×p₂|
    const sign = n == undefined || this.cross(v).dot(n) >= 0 ? 1 : -1

    const sinθ = this.cross(v).length * sign
    const cosθ = this.dot(v)

    return Math.atan2(sinθ, cosθ)
  }

  /**
   * Rotates ‘this’ point around an axis by a specified angle.
   *
   * @param   {Vector3d} axis - The axis being rotated around.
   * @param   {number}   angle - The angle of rotation (in degrees).
   * @returns {Vector3d} The rotated point.
   */
  rotateAround(axis, angle) {
    if (!(axis instanceof Vector3d)) throw new TypeError('axis is not Vector3d object')

    const θ = angle.toRadians()

    // en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
    // en.wikipedia.org/wiki/Quaternions_and_spatial_rotation#Quaternion-derived_rotation_matrix
    const p = this.unit()
    const a = axis.unit()

    const s = Math.sin(θ)
    const c = Math.cos(θ)
    const t = 1 - c
    const x = a.x,
      y = a.y,
      z = a.z

    const r = [
      // rotation matrix for rotation about supplied axis
      [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
      [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
      [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
    ]

    // multiply r × p
    const rp = [
      r[0][0] * p.x + r[0][1] * p.y + r[0][2] * p.z,
      r[1][0] * p.x + r[1][1] * p.y + r[1][2] * p.z,
      r[2][0] * p.x + r[2][1] * p.y + r[2][2] * p.z,
    ]
    const p2 = new Vector3d(rp[0], rp[1], rp[2])

    return p2
    // qv en.wikipedia.org/wiki/Rodrigues'_rotation_formula...
  }

  /**
   * String representation of vector.
   *
   * @param   {number} [dp=3] - Number of decimal places to be used.
   * @returns {string} Vector represented as [x,y,z].
   */
  toString(dp = 3) {
    return `[${this.x.toFixed(dp)},${this.y.toFixed(dp)},${this.z.toFixed(dp)}]`
  }
}

// Extend Number object with methods to convert between degrees & radians
Number.prototype.toRadians = function () {
  return (this * Math.PI) / 180
}
Number.prototype.toDegrees = function () {
  return (this * 180) / Math.PI
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * A latitude/longitude point defines a geographic location on or above/below the earth’s surface,
 * measured in degrees from the equator & the International Reference Meridian and in metres above
 * the ellipsoid, and based on a given datum.
 *
 * As so much modern geodesy is based on WGS-84 (as used by GPS), this module includes WGS-84
 * ellipsoid parameters, and it has methods for converting geodetic (latitude/longitude) points to/from
 * geocentric cartesian points; the latlon-ellipsoidal-datum and latlon-ellipsoidal-referenceframe
 * modules provide transformation parameters for converting between historical datums and between
 * modern reference frames.
 *
 * This module is used for both trigonometric geodesy (eg latlon-ellipsoidal-vincenty) and n-vector
 * geodesy (eg latlon-nvector-ellipsoidal), and also for UTM/MGRS mapping.
 *
 * @module latlon-ellipsoidal
 */

/*
 * Ellipsoid parameters; exposed through static getter below.
 *
 * The only ellipsoid defined is WGS84, for use in utm/mgrs, vincenty, nvector.
 */
const ellipsoids$1 = {
  WGS84: { a: 6378137, b: 6356752.314245, f: 1 / 298.257223563 },
}

/*
 * Datums; exposed through static getter below.
 *
 * The only datum defined is WGS84, for use in utm/mgrs, vincenty, nvector.
 */
const datums$1 = {
  WGS84: { ellipsoid: ellipsoids$1.WGS84 },
}

// freeze static properties
Object.freeze(ellipsoids$1.WGS84)
Object.freeze(datums$1.WGS84)

/* LatLonEllipsoidal - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Latitude/longitude points on an ellipsoidal model earth, with ellipsoid parameters and methods
 * for converting points to/from cartesian (ECEF) coordinates.
 *
 * This is the core class, which will usually be used via LatLonEllipsoidal_Datum or
 * LatLonEllipsoidal_ReferenceFrame.
 */
class LatLonEllipsoidal {
  /**
   * Creates a geodetic latitude/longitude point on a (WGS84) ellipsoidal model earth.
   *
   * @param  {number} lat - Latitude (in degrees).
   * @param  {number} lon - Longitude (in degrees).
   * @param  {number} [height=0] - Height above ellipsoid in metres.
   * @throws {TypeError} Invalid lat/lon/height.
   *
   * @example
   *   import LatLon from '/js/geodesy/latlon-ellipsoidal.js';
   *   const p = new LatLon(51.47788, -0.00147, 17);
   */
  constructor(lat, lon, height = 0) {
    if (isNaN(lat) || lat == null) throw new TypeError(`invalid lat ‘${lat}’`)
    if (isNaN(lon) || lon == null) throw new TypeError(`invalid lon ‘${lon}’`)
    if (isNaN(height) || height == null) throw new TypeError(`invalid height ‘${height}’`)

    this._lat = Dms.wrap90(Number(lat))
    this._lon = Dms.wrap180(Number(lon))
    this._height = Number(height)
  }

  /**
   * Latitude in degrees north from equator (including aliases lat, latitude): can be set as
   * numeric or hexagesimal (deg-min-sec); returned as numeric.
   */
  get lat() {
    return this._lat
  }
  get latitude() {
    return this._lat
  }
  set lat(lat) {
    this._lat = isNaN(lat) ? Dms.wrap90(Dms.parse(lat)) : Dms.wrap90(Number(lat))
    if (isNaN(this._lat)) throw new TypeError(`invalid lat ‘${lat}’`)
  }
  set latitude(lat) {
    this._lat = isNaN(lat) ? Dms.wrap90(Dms.parse(lat)) : Dms.wrap90(Number(lat))
    if (isNaN(this._lat)) throw new TypeError(`invalid latitude ‘${lat}’`)
  }

  /**
   * Longitude in degrees east from international reference meridian (including aliases lon, lng,
   * longitude): can be set as numeric or hexagesimal (deg-min-sec); returned as numeric.
   */
  get lon() {
    return this._lon
  }
  get lng() {
    return this._lon
  }
  get longitude() {
    return this._lon
  }
  set lon(lon) {
    this._lon = isNaN(lon) ? Dms.wrap180(Dms.parse(lon)) : Dms.wrap180(Number(lon))
    if (isNaN(this._lon)) throw new TypeError(`invalid lon ‘${lon}’`)
  }
  set lng(lon) {
    this._lon = isNaN(lon) ? Dms.wrap180(Dms.parse(lon)) : Dms.wrap180(Number(lon))
    if (isNaN(this._lon)) throw new TypeError(`invalid lng ‘${lon}’`)
  }
  set longitude(lon) {
    this._lon = isNaN(lon) ? Dms.wrap180(Dms.parse(lon)) : Dms.wrap180(Number(lon))
    if (isNaN(this._lon)) throw new TypeError(`invalid longitude ‘${lon}’`)
  }

  /**
   * Height in metres above ellipsoid.
   */
  get height() {
    return this._height
  }
  set height(height) {
    this._height = Number(height)
    if (isNaN(this._height)) throw new TypeError(`invalid height ‘${height}’`)
  }

  /**
   * Datum.
   *
   * Note this is replicated within LatLonEllipsoidal in order that a LatLonEllipsoidal object can
   * be monkey-patched to look like a LatLonEllipsoidal_Datum, for Vincenty calculations on
   * different ellipsoids.
   *
   * @private
   */
  get datum() {
    return this._datum
  }
  set datum(datum) {
    this._datum = datum
  }

  /**
   * Ellipsoids with their parameters; this module only defines WGS84 parameters a = 6378137, b =
   * 6356752.314245, f = 1/298.257223563.
   *
   * @example
   *   const a = LatLon.ellipsoids.WGS84.a; // 6378137
   */
  static get ellipsoids() {
    return ellipsoids$1
  }

  /**
   * Datums; this module only defines WGS84 datum, hence no datum transformations.
   *
   * @example
   *   const a = LatLon.datums.WGS84.ellipsoid.a; // 6377563.396
   */
  static get datums() {
    return datums$1
  }

  /**
   * Parses a latitude/longitude point from a variety of formats.
   *
   * Latitude & longitude (in degrees) can be supplied as two separate parameters, as a single
   * comma-separated lat/lon string, or as a single object with { lat, lon } or GeoJSON properties.
   *
   * The latitude/longitude values may be numeric or strings; they may be signed decimal or
   * deg-min-sec (hexagesimal) suffixed by compass direction (NSEW); a variety of separators are
   * accepted. Examples -3.62, '3 37 12W', '3°37′12″W'.
   *
   * Thousands/decimal separators must be comma/dot; use Dms.fromLocale to convert locale-specific
   * thousands/decimal separators.
   *
   * @param   {number|string|Object} lat|latlon - Latitude (in degrees), or comma-separated lat/lon, or lat/lon object.
   * @param   {number}               [lon]      - Longitude (in degrees).
   * @param   {number}               [height=0] - Height above ellipsoid in metres.
   * @returns {LatLon} Latitude/longitude point on WGS84 ellipsoidal model earth.
   * @throws  {TypeError} Invalid coordinate.
   *
   * @example
   *   const p1 = LatLon.parse(51.47788, -0.00147);              // numeric pair
   *   const p2 = LatLon.parse('51°28′40″N, 000°00′05″W', 17);   // dms string + height
   *   const p3 = LatLon.parse({ lat: 52.205, lon: 0.119 }, 17); // { lat, lon } object numeric + height
   */
  static parse(...args) {
    if (args.length == 0) throw new TypeError('invalid (empty) point')

    let lat = undefined,
      lon = undefined,
      height = undefined

    // single { lat, lon } object
    if (typeof args[0] == 'object' && (args.length == 1 || !isNaN(parseFloat(args[1])))) {
      const ll = args[0]
      if (ll.type == 'Point' && Array.isArray(ll.coordinates)) {
        // GeoJSON
        ;[lon, lat, height] = ll.coordinates
        height = height || 0
      } else {
        // regular { lat, lon } object
        if (ll.latitude != undefined) lat = ll.latitude
        if (ll.lat != undefined) lat = ll.lat
        if (ll.longitude != undefined) lon = ll.longitude
        if (ll.lng != undefined) lon = ll.lng
        if (ll.lon != undefined) lon = ll.lon
        if (ll.height != undefined) height = ll.height
        lat = Dms.wrap90(Dms.parse(lat))
        lon = Dms.wrap180(Dms.parse(lon))
      }
      if (args[1] != undefined) height = args[1]
      if (isNaN(lat) || isNaN(lon))
        throw new TypeError(`invalid point ‘${JSON.stringify(args[0])}’`)
    }

    // single comma-separated lat/lon
    if (typeof args[0] == 'string' && args[0].split(',').length == 2) {
      ;[lat, lon] = args[0].split(',')
      lat = Dms.wrap90(Dms.parse(lat))
      lon = Dms.wrap180(Dms.parse(lon))
      height = args[1] || 0
      if (isNaN(lat) || isNaN(lon)) throw new TypeError(`invalid point ‘${args[0]}’`)
    }

    // regular (lat, lon) arguments
    if (lat == undefined && lon == undefined) {
      ;[lat, lon] = args
      lat = Dms.wrap90(Dms.parse(lat))
      lon = Dms.wrap180(Dms.parse(lon))
      height = args[2] || 0
      if (isNaN(lat) || isNaN(lon)) throw new TypeError(`invalid point ‘${args.toString()}’`)
    }

    return new this(lat, lon, height) // 'new this' as may return subclassed types
  }

  /**
   * Converts ‘this’ point from (geodetic) latitude/longitude coordinates to (geocentric)
   * cartesian (x/y/z) coordinates.
   *
   * @returns {Cartesian} Cartesian point equivalent to lat/lon point, with x, y, z in metres from
   *   earth centre.
   */
  toCartesian() {
    // x = (ν+h)⋅cosφ⋅cosλ, y = (ν+h)⋅cosφ⋅sinλ, z = (ν⋅(1-e²)+h)⋅sinφ
    // where ν = a/√(1−e²⋅sinφ⋅sinφ), e² = (a²-b²)/a² or (better conditioned) 2⋅f-f²
    const ellipsoid = this.datum
      ? this.datum.ellipsoid
      : this.referenceFrame
        ? this.referenceFrame.ellipsoid
        : ellipsoids$1.WGS84

    const φ = this.lat.toRadians()
    const λ = this.lon.toRadians()
    const h = this.height
    const { a, f } = ellipsoid

    const sinφ = Math.sin(φ),
      cosφ = Math.cos(φ)
    const sinλ = Math.sin(λ),
      cosλ = Math.cos(λ)

    const eSq = 2 * f - f * f // 1st eccentricity squared ≡ (a²-b²)/a²
    const ν = a / Math.sqrt(1 - eSq * sinφ * sinφ) // radius of curvature in prime vertical

    const x = (ν + h) * cosφ * cosλ
    const y = (ν + h) * cosφ * sinλ
    const z = (ν * (1 - eSq) + h) * sinφ

    return new Cartesian(x, y, z)
  }

  /**
   * Checks if another point is equal to ‘this’ point.
   *
   * @param   {LatLon} point - Point to be compared against this point.
   * @returns {bool} True if points have identical latitude, longitude, height, and datum/referenceFrame.
   * @throws  {TypeError} Invalid point.
   *
   * @example
   *   const p1 = new LatLon(52.205, 0.119);
   *   const p2 = new LatLon(52.205, 0.119);
   *   const equal = p1.equals(p2); // true
   */
  equals(point) {
    if (!(point instanceof LatLonEllipsoidal)) throw new TypeError(`invalid point ‘${point}’`)

    if (Math.abs(this.lat - point.lat) > Number.EPSILON) return false
    if (Math.abs(this.lon - point.lon) > Number.EPSILON) return false
    if (Math.abs(this.height - point.height) > Number.EPSILON) return false
    if (this.datum != point.datum) return false
    if (this.referenceFrame != point.referenceFrame) return false
    if (this.epoch != point.epoch) return false

    return true
  }

  /**
   * Returns a string representation of ‘this’ point, formatted as degrees, degrees+minutes, or
   * degrees+minutes+seconds.
   *
   * @param   {string} [format=d] - Format point as 'd', 'dm', 'dms', or 'n' for signed numeric.
   * @param   {number} [dp=4|2|0] - Number of decimal places to use: default 4 for d, 2 for dm, 0 for dms.
   * @param   {number} [dpHeight=null] - Number of decimal places to use for height; default is no height display.
   * @returns {string} Comma-separated formatted latitude/longitude.
   * @throws  {RangeError} Invalid format.
   *
   * @example
   *   const greenwich = new LatLon(51.47788, -0.00147, 46);
   *   const d = greenwich.toString();                        // 51.4779°N, 000.0015°W
   *   const dms = greenwich.toString('dms', 2);              // 51°28′40″N, 000°00′05″W
   *   const [lat, lon] = greenwich.toString('n').split(','); // 51.4779, -0.0015
   *   const dmsh = greenwich.toString('dms', 0, 0);          // 51°28′40″N, 000°00′06″W +46m
   */
  toString(format = 'd', dp = undefined, dpHeight = null) {
    // note: explicitly set dp to undefined for passing through to toLat/toLon
    if (!['d', 'dm', 'dms', 'n'].includes(format))
      throw new RangeError(`invalid format ‘${format}’`)

    const height = (this.height >= 0 ? ' +' : ' ') + this.height.toFixed(dpHeight) + 'm'
    if (format == 'n') {
      // signed numeric degrees
      if (dp == undefined) dp = 4
      const lat = this.lat.toFixed(dp)
      const lon = this.lon.toFixed(dp)
      return `${lat}, ${lon}${dpHeight == null ? '' : height}`
    }

    const lat = Dms.toLat(this.lat, format, dp)
    const lon = Dms.toLon(this.lon, format, dp)

    return `${lat}, ${lon}${dpHeight == null ? '' : height}`
  }
}

/* Cartesian  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/**
 * ECEF (earth-centered earth-fixed) geocentric cartesian coordinates.
 *
 * @extends Vector3d
 */
class Cartesian extends Vector3d {
  /**
   * Creates cartesian coordinate representing ECEF (earth-centric earth-fixed) point.
   *
   * @param {number} x - X coordinate in metres (=> 0°N,0°E).
   * @param {number} y - Y coordinate in metres (=> 0°N,90°E).
   * @param {number} z - Z coordinate in metres (=> 90°N).
   *
   * @example
   *   import { Cartesian } from '/js/geodesy/latlon-ellipsoidal.js';
   *   const coord = new Cartesian(3980581.210, -111.159, 4966824.522);
   */
  constructor(x, y, z) {
    super(x, y, z) // arguably redundant constructor, but specifies units & axes
  }

  /**
   * Converts ‘this’ (geocentric) cartesian (x/y/z) coordinate to (geodetic) latitude/longitude
   * point on specified ellipsoid.
   *
   * Uses Bowring’s (1985) formulation for μm precision in concise form; ‘The accuracy of geodetic
   * latitude and height equations’, B R Bowring, Survey Review vol 28, 218, Oct 1985.
   *
   * @param   {LatLon.ellipsoids} [ellipsoid=WGS84] - Ellipsoid to use when converting point.
   * @returns {LatLon} Latitude/longitude point defined by cartesian coordinates, on given ellipsoid.
   * @throws  {TypeError} Invalid ellipsoid.
   *
   * @example
   *   const c = new Cartesian(4027893.924, 307041.993, 4919474.294);
   *   const p = c.toLatLon(); // 50.7978°N, 004.3592°E
   */
  toLatLon(ellipsoid = ellipsoids$1.WGS84) {
    // note ellipsoid is available as a parameter for when toLatLon gets subclassed to
    // Ellipsoidal_Datum / Ellipsoidal_Referenceframe.
    if (!ellipsoid || !ellipsoid.a) throw new TypeError(`invalid ellipsoid ‘${ellipsoid}’`)

    const { x, y, z } = this
    const { a, b, f } = ellipsoid

    const e2 = 2 * f - f * f // 1st eccentricity squared ≡ (a²−b²)/a²
    const ε2 = e2 / (1 - e2) // 2nd eccentricity squared ≡ (a²−b²)/b²
    const p = Math.sqrt(x * x + y * y) // distance from minor axis
    const R = Math.sqrt(p * p + z * z) // polar radius

    // parametric latitude (Bowring eqn.17, replacing tanβ = z·a / p·b)
    const tanβ = ((b * z) / (a * p)) * (1 + (ε2 * b) / R)
    const sinβ = tanβ / Math.sqrt(1 + tanβ * tanβ)
    const cosβ = sinβ / tanβ

    // geodetic latitude (Bowring eqn.18: tanφ = z+ε²⋅b⋅sin³β / p−e²⋅cos³β)
    const φ = isNaN(cosβ)
      ? 0
      : Math.atan2(z + ε2 * b * sinβ * sinβ * sinβ, p - e2 * a * cosβ * cosβ * cosβ)

    // longitude
    const λ = Math.atan2(y, x)

    // height above ellipsoid (Bowring eqn.7)
    const sinφ = Math.sin(φ),
      cosφ = Math.cos(φ)
    const ν = a / Math.sqrt(1 - e2 * sinφ * sinφ) // length of the normal terminated by the minor axis
    const h = p * cosφ + z * sinφ - (a * a) / ν

    const point = new LatLonEllipsoidal(φ.toDegrees(), λ.toDegrees(), h)

    return point
  }

  /**
   * Returns a string representation of ‘this’ cartesian point.
   *
   * @param   {number} [dp=0] - Number of decimal places to use.
   * @returns {string} Comma-separated latitude/longitude.
   */
  toString(dp = 0) {
    const x = this.x.toFixed(dp),
      y = this.y.toFixed(dp),
      z = this.z.toFixed(dp)
    return `[${x},${y},${z}]`
  }
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Historical geodetic datums: a latitude/longitude point defines a geographic location on or
 * above/below the  earth’s surface, measured in degrees from the equator & the International
 * Reference Meridian and metres above the ellipsoid, and based on a given datum. The datum is
 * based on a reference ellipsoid and tied to geodetic survey reference points.
 *
 * Modern geodesy is generally based on the WGS84 datum (as used for instance by GPS systems), but
 * previously various reference ellipsoids and datum references were used.
 *
 * This module extends the core latlon-ellipsoidal module to include ellipsoid parameters and datum
 * transformation parameters, and methods for converting between different (generally historical)
 * datums.
 *
 * It can be used for UK Ordnance Survey mapping (OS National Grid References are still based on the
 * otherwise historical OSGB36 datum), as well as for historical purposes.
 *
 * q.v. Ordnance Survey ‘A guide to coordinate systems in Great Britain’ Section 6,
 * www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf, and also
 * www.ordnancesurvey.co.uk/blog/2014/12/2.
 *
 * @module latlon-ellipsoidal-datum
 */

/*
 * Ellipsoid parameters; exposed through static getter below.
 */
const ellipsoids = {
  WGS84: { a: 6378137, b: 6356752.314245, f: 1 / 298.257223563 },
  Airy1830: { a: 6377563.396, b: 6356256.909, f: 1 / 299.3249646 },
  AiryModified: { a: 6377340.189, b: 6356034.448, f: 1 / 299.3249646 },
  Bessel1841: { a: 6377397.155, b: 6356078.962818, f: 1 / 299.1528128 },
  Clarke1866: { a: 6378206.4, b: 6356583.8, f: 1 / 294.978698214 },
  Clarke1880IGN: { a: 6378249.2, b: 6356515.0, f: 1 / 293.466021294 },
  GRS80: { a: 6378137, b: 6356752.31414, f: 1 / 298.257222101 },
  Intl1924: { a: 6378388, b: 6356911.946, f: 1 / 297 }, // aka Hayford
  WGS72: { a: 6378135, b: 6356750.5, f: 1 / 298.26 },
}

/*
 * Datums; exposed through static getter below.
 */
const datums = {
  // transforms: t in metres, s in ppm, r in arcseconds              tx       ty        tz       s        rx        ry        rz
  ED50: { ellipsoid: ellipsoids.Intl1924, transform: [89.5, 93.8, 123.1, -1.2, 0.0, 0.0, 0.156] }, // epsg.io/1311
  ETRS89: { ellipsoid: ellipsoids.GRS80, transform: [0, 0, 0, 0, 0, 0, 0] }, // epsg.io/1149; @ 1-metre level
  Irl1975: {
    ellipsoid: ellipsoids.AiryModified,
    transform: [-482.53, 130.596, -564.557, -8.15, 1.042, 0.214, 0.631],
  }, // epsg.io/1954
  NAD27: { ellipsoid: ellipsoids.Clarke1866, transform: [8, -160, -176, 0, 0, 0, 0] },
  NAD83: {
    ellipsoid: ellipsoids.GRS80,
    transform: [0.9956, -1.9103, -0.5215, -0.00062, 0.025915, 0.009426, 0.011599],
  },
  NTF: { ellipsoid: ellipsoids.Clarke1880IGN, transform: [168, 60, -320, 0, 0, 0, 0] },
  OSGB36: {
    ellipsoid: ellipsoids.Airy1830,
    transform: [-446.448, 125.157, -542.06, 20.4894, -0.1502, -0.247, -0.8421],
  }, // epsg.io/1314
  Potsdam: {
    ellipsoid: ellipsoids.Bessel1841,
    transform: [-582, -105, -414, -8.3, 1.04, 0.35, -3.08],
  },
  TokyoJapan: { ellipsoid: ellipsoids.Bessel1841, transform: [148, -507, -685, 0, 0, 0, 0] },
  WGS72: { ellipsoid: ellipsoids.WGS72, transform: [0, 0, -4.5, -0.22, 0, 0, 0.554] },
  WGS84: { ellipsoid: ellipsoids.WGS84, transform: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] },
}
/* sources:
 * - ED50:       www.gov.uk/guidance/oil-and-gas-petroleum-operations-notices#pon-4
 * - Irl1975:    www.osi.ie/wp-content/uploads/2015/05/transformations_booklet.pdf
 * - NAD27:      en.wikipedia.org/wiki/Helmert_transformation
 * - NAD83:      www.uvm.edu/giv/resources/WGS84_NAD83.pdf [strictly, WGS84(G1150) -> NAD83(CORS96) @ epoch 1997.0]
 *               (note NAD83(1986) ≡ WGS84(Original); confluence.qps.nl/pages/viewpage.action?pageId=29855173)
 * - NTF:        Nouvelle Triangulation Francaise geodesie.ign.fr/contenu/fichiers/Changement_systeme_geodesique.pdf
 * - OSGB36:     www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf
 * - Potsdam:    kartoweb.itc.nl/geometrics/Coordinate%20transformations/coordtrans.html
 * - TokyoJapan: www.geocachingtoolbox.com?page=datumEllipsoidDetails
 * - WGS72:      www.icao.int/safety/pbn/documentation/eurocontrol/eurocontrol wgs 84 implementation manual.pdf
 *
 * more transform parameters are available from earth-info.nga.mil/GandG/coordsys/datums/NATO_DT.pdf,
 * www.fieldenmaps.info/cconv/web/cconv_params.js
 */
/* note:
 * - ETRS89 reference frames are coincident with WGS-84 at epoch 1989.0 (ie null transform) at the one metre level.
 */

// freeze static properties
Object.keys(ellipsoids).forEach((e) => Object.freeze(ellipsoids[e]))
Object.keys(datums).forEach((d) => {
  Object.freeze(datums[d])
  Object.freeze(datums[d].transform)
})

/* LatLon - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/**
 * Latitude/longitude points on an ellipsoidal model earth, with ellipsoid parameters and methods
 * for converting between datums and to geocentric (ECEF) cartesian coordinates.
 *
 * @extends LatLonEllipsoidal
 */
class LatLonEllipsoidal_Datum extends LatLonEllipsoidal {
  /**
   * Creates a geodetic latitude/longitude point on an ellipsoidal model earth using given datum.
   *
   * @param {number} lat - Latitude (in degrees).
   * @param {number} lon - Longitude (in degrees).
   * @param {number} [height=0] - Height above ellipsoid in metres.
   * @param {LatLon.datums} datum - Datum this point is defined within.
   *
   * @example
   *   import LatLon from '/js/geodesy/latlon-ellipsoidal-datum.js';
   *   const p = new LatLon(53.3444, -6.2577, 17, LatLon.datums.Irl1975);
   */
  constructor(lat, lon, height = 0, datum = datums.WGS84) {
    if (!datum || datum.ellipsoid == undefined) throw new TypeError(`unrecognised datum ‘${datum}’`)

    super(lat, lon, height)

    this._datum = datum
  }

  /**
   * Datum this point is defined within.
   */
  get datum() {
    return this._datum
  }

  /**
   * Ellipsoids with their parameters; semi-major axis (a), semi-minor axis (b), and flattening (f).
   *
   * Flattening f = (a−b)/a; at least one of these parameters is derived from defining constants.
   *
   * @example
   *   const a = LatLon.ellipsoids.Airy1830.a; // 6377563.396
   */
  static get ellipsoids() {
    return ellipsoids
  }

  /**
   * Datums; with associated ellipsoid, and Helmert transform parameters to convert from WGS-84
   * into given datum.
   *
   * Note that precision of various datums will vary, and WGS-84 (original) is not defined to be
   * accurate to better than ±1 metre. No transformation should be assumed to be accurate to
   * better than a metre, for many datums somewhat less.
   *
   * This is a small sample of commoner datums from a large set of historical datums. I will add
   * new datums on request.
   *
   * @example
   *   const a = LatLon.datums.OSGB36.ellipsoid.a;                    // 6377563.396
   *   const tx = LatLon.datums.OSGB36.transform;                     // [ tx, ty, tz, s, rx, ry, rz ]
   *   const availableDatums = Object.keys(LatLon.datums).join(', '); // ED50, Irl1975, NAD27, ...
   */
  static get datums() {
    return datums
  }

  // note instance datum getter/setters are in LatLonEllipsoidal

  /**
   * Parses a latitude/longitude point from a variety of formats.
   *
   * Latitude & longitude (in degrees) can be supplied as two separate parameters, as a single
   * comma-separated lat/lon string, or as a single object with { lat, lon } or GeoJSON properties.
   *
   * The latitude/longitude values may be numeric or strings; they may be signed decimal or
   * deg-min-sec (hexagesimal) suffixed by compass direction (NSEW); a variety of separators are
   * accepted. Examples -3.62, '3 37 12W', '3°37′12″W'.
   *
   * Thousands/decimal separators must be comma/dot; use Dms.fromLocale to convert locale-specific
   * thousands/decimal separators.
   *
   * @param   {number|string|Object} lat|latlon - Geodetic Latitude (in degrees) or comma-separated lat/lon or lat/lon object.
   * @param   {number}               [lon] - Longitude in degrees.
   * @param   {number}               [height=0] - Height above ellipsoid in metres.
   * @param   {LatLon.datums}        [datum=WGS84] - Datum this point is defined within.
   * @returns {LatLon} Latitude/longitude point on ellipsoidal model earth using given datum.
   * @throws  {TypeError} Unrecognised datum.
   *
   * @example
   *   const p = LatLon.parse('51.47736, 0.0000', 0, LatLon.datums.OSGB36);
   */
  static parse(...args) {
    let datum = datums.WGS84

    // if the last argument is a datum, use that, otherwise use default WGS-84
    if (args.length == 4 || (args.length == 3 && typeof args[2] == 'object')) datum = args.pop()

    if (!datum || datum.ellipsoid == undefined) throw new TypeError(`unrecognised datum ‘${datum}’`)

    const point = super.parse(...args)

    point._datum = datum

    return point
  }

  /**
   * Converts ‘this’ lat/lon coordinate to new coordinate system.
   *
   * @param   {LatLon.datums} toDatum - Datum this coordinate is to be converted to.
   * @returns {LatLon} This point converted to new datum.
   * @throws  {TypeError} Unrecognised datum.
   *
   * @example
   *   const pWGS84 = new LatLon(51.47788, -0.00147, 0, LatLon.datums.WGS84);
   *   const pOSGB = pWGS84.convertDatum(LatLon.datums.OSGB36); // 51.4773°N, 000.0001°E
   */
  convertDatum(toDatum) {
    if (!toDatum || toDatum.ellipsoid == undefined)
      throw new TypeError(`unrecognised datum ‘${toDatum}’`)

    const oldCartesian = this.toCartesian() // convert geodetic to cartesian
    const newCartesian = oldCartesian.convertDatum(toDatum) // convert datum
    const newLatLon = newCartesian.toLatLon() // convert cartesian back to geodetic

    return newLatLon
  }

  /**
   * Converts ‘this’ point from (geodetic) latitude/longitude coordinates to (geocentric) cartesian
   * (x/y/z) coordinates, based on the same datum.
   *
   * Shadow of LatLonEllipsoidal.toCartesian(), returning Cartesian augmented with
   * LatLonEllipsoidal_Datum methods/properties.
   *
   * @returns {Cartesian} Cartesian point equivalent to lat/lon point, with x, y, z in metres from
   *   earth centre, augmented with reference frame conversion methods and properties.
   */
  toCartesian() {
    const cartesian = super.toCartesian()
    const cartesianDatum = new Cartesian_Datum(cartesian.x, cartesian.y, cartesian.z, this.datum)
    return cartesianDatum
  }
}

/* Cartesian  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/**
 * Augments Cartesian with datum the cooordinate is based on, and methods to convert between datums
 * (using Helmert 7-parameter transforms) and to convert cartesian to geodetic latitude/longitude
 * point.
 *
 * @extends Cartesian
 */
class Cartesian_Datum extends Cartesian {
  /**
   * Creates cartesian coordinate representing ECEF (earth-centric earth-fixed) point, on a given
   * datum. The datum will identify the primary meridian (for the x-coordinate), and is also
   * useful in transforming to/from geodetic (lat/lon) coordinates.
   *
   * @param  {number} x - X coordinate in metres (=> 0°N,0°E).
   * @param  {number} y - Y coordinate in metres (=> 0°N,90°E).
   * @param  {number} z - Z coordinate in metres (=> 90°N).
   * @param  {LatLon.datums} [datum] - Datum this coordinate is defined within.
   * @throws {TypeError} Unrecognised datum.
   *
   * @example
   *   import { Cartesian } from '/js/geodesy/latlon-ellipsoidal-datum.js';
   *   const coord = new Cartesian(3980581.210, -111.159, 4966824.522);
   */
  constructor(x, y, z, datum = undefined) {
    if (datum && datum.ellipsoid == undefined) throw new TypeError(`unrecognised datum ‘${datum}’`)

    super(x, y, z)

    if (datum) this._datum = datum
  }

  /**
   * Datum this point is defined within.
   */
  get datum() {
    return this._datum
  }
  set datum(datum) {
    if (!datum || datum.ellipsoid == undefined) throw new TypeError(`unrecognised datum ‘${datum}’`)
    this._datum = datum
  }

  /**
   * Converts ‘this’ (geocentric) cartesian (x/y/z) coordinate to (geodetic) latitude/longitude
   * point (based on the same datum, or WGS84 if unset).
   *
   * Shadow of Cartesian.toLatLon(), returning LatLon augmented with LatLonEllipsoidal_Datum
   * methods convertDatum, toCartesian, etc.
   *
   * @returns {LatLon} Latitude/longitude point defined by cartesian coordinates.
   * @throws  {TypeError} Unrecognised datum
   *
   * @example
   *   const c = new Cartesian(4027893.924, 307041.993, 4919474.294);
   *   const p = c.toLatLon(); // 50.7978°N, 004.3592°E
   */
  toLatLon(deprecatedDatum = undefined) {
    if (deprecatedDatum) {
      console.info(
        'datum parameter to Cartesian_Datum.toLatLon is deprecated: set datum before calling toLatLon()',
      )
      this.datum = deprecatedDatum
    }
    const datum = this.datum || datums.WGS84
    if (!datum || datum.ellipsoid == undefined) throw new TypeError(`unrecognised datum ‘${datum}’`)

    const latLon = super.toLatLon(datum.ellipsoid) // TODO: what if datum is not geocentric?
    const point = new LatLonEllipsoidal_Datum(latLon.lat, latLon.lon, latLon.height, this.datum)
    return point
  }

  /**
   * Converts ‘this’ cartesian coordinate to new datum using Helmert 7-parameter transformation.
   *
   * @param   {LatLon.datums} toDatum - Datum this coordinate is to be converted to.
   * @returns {Cartesian} This point converted to new datum.
   * @throws  {Error} Undefined datum.
   *
   * @example
   *   const c = new Cartesian(3980574.247, -102.127, 4966830.065, LatLon.datums.OSGB36);
   *   c.convertDatum(LatLon.datums.Irl1975); // [??,??,??]
   */
  convertDatum(toDatum) {
    // TODO: what if datum is not geocentric?
    if (!toDatum || toDatum.ellipsoid == undefined)
      throw new TypeError(`unrecognised datum ‘${toDatum}’`)
    if (!this.datum) throw new TypeError('cartesian coordinate has no datum')

    let oldCartesian = null
    let transform = null

    if (this.datum == undefined || this.datum == datums.WGS84) {
      // converting from WGS 84
      oldCartesian = this
      transform = toDatum.transform
    }
    if (toDatum == datums.WGS84) {
      // converting to WGS 84; use inverse transform
      oldCartesian = this
      transform = this.datum.transform.map((p) => -p)
    }
    if (transform == null) {
      // neither this.datum nor toDatum are WGS84: convert this to WGS84 first
      oldCartesian = this.convertDatum(datums.WGS84)
      transform = toDatum.transform
    }

    const newCartesian = oldCartesian.applyTransform(transform)
    newCartesian.datum = toDatum

    return newCartesian
  }

  /**
   * Applies Helmert 7-parameter transformation to ‘this’ coordinate using transform parameters t.
   *
   * This is used in converting datums (geodetic->cartesian, apply transform, cartesian->geodetic).
   *
   * @private
   * @param   {number[]} t - Transformation to apply to this coordinate.
   * @returns {Cartesian} Transformed point.
   */
  applyTransform(t) {
    // this point
    const { x: x1, y: y1, z: z1 } = this

    // transform parameters
    const tx = t[0] // x-shift in metres
    const ty = t[1] // y-shift in metres
    const tz = t[2] // z-shift in metres
    const s = t[3] / 1e6 + 1 // scale: normalise parts-per-million to (s+1)
    const rx = (t[4] / 3600).toRadians() // x-rotation: normalise arcseconds to radians
    const ry = (t[5] / 3600).toRadians() // y-rotation: normalise arcseconds to radians
    const rz = (t[6] / 3600).toRadians() // z-rotation: normalise arcseconds to radians

    // apply transform
    const x2 = tx + x1 * s - y1 * rz + z1 * ry
    const y2 = ty + x1 * rz + y1 * s - z1 * rx
    const z2 = tz - x1 * ry + y1 * rx + z1 * s

    return new Cartesian_Datum(x2, y2, z2)
  }
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Ordnance Survey OSGB grid references provide geocoordinate references for UK mapping purposes.
 *
 * Formulation implemented here due to Thomas, Redfearn, etc is as published by OS, but is inferior
 * to Krüger as used by e.g. Karney 2011.
 *
 * www.ordnancesurvey.co.uk/documents/resources/guide-coordinate-systems-great-britain.pdf.
 *
 * Note OSGB grid references cover Great Britain only; Ireland and the Channel Islands have their
 * own references.
 *
 * Note that these formulae are based on ellipsoidal calculations, and according to the OS are
 * accurate to about 4–5 metres – for greater accuracy, a geoid-based transformation (OSTN15) must
 * be used.
 */

/*
 * Converted 2015 to work with WGS84 by default, OSGB36 as option;
 * www.ordnancesurvey.co.uk/blog/2014/12/confirmation-on-changes-to-latitude-and-longitude
 */

/* OsGridRef  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

const nationalGrid = {
  trueOrigin: { lat: 49, lon: -2 }, // true origin of grid 49°N,2°W on OSGB36 datum
  falseOrigin: { easting: -400e3, northing: 100e3 }, // easting & northing of false origin, metres from true origin
  scaleFactor: 0.9996012717, // scale factor on central meridian
  ellipsoid: LatLonEllipsoidal_Datum.ellipsoids.Airy1830,
}
// note Irish National Grid uses t/o 53°30′N, 8°W, f/o 200kmW, 250kmS, scale factor 1.000035, on Airy 1830 Modified ellipsoid

/**
 * OS Grid References with methods to parse and convert them to latitude/longitude points.
 */
class OsGridRef {
  /**
   * Creates an OsGridRef object.
   *
   * @param {number} easting - Easting in metres from OS Grid false origin.
   * @param {number} northing - Northing in metres from OS Grid false origin.
   *
   * @example
   *   import OsGridRef from '/js/geodesy/osgridref.js';
   *   const gridref = new OsGridRef(651409, 313177);
   */
  constructor(easting, northing) {
    this.easting = Number(easting)
    this.northing = Number(northing)

    if (isNaN(easting) || this.easting < 0 || this.easting > 700e3)
      throw new RangeError(`invalid easting ‘${easting}’`)
    if (isNaN(northing) || this.northing < 0 || this.northing > 1300e3)
      throw new RangeError(`invalid northing ‘${northing}’`)
  }

  /**
   * Converts ‘this’ Ordnance Survey Grid Reference easting/northing coordinate to latitude/longitude
   * (SW corner of grid square).
   *
   * While OS Grid References are based on OSGB-36, the Ordnance Survey have deprecated the use of
   * OSGB-36 for latitude/longitude coordinates (in favour of WGS-84), hence this function returns
   * WGS-84 by default, with OSGB-36 as an option. See www.ordnancesurvey.co.uk/blog/2014/12/2.
   *
   * Note formulation implemented here due to Thomas, Redfearn, etc is as published by OS, but is
   * inferior to Krüger as used by e.g. Karney 2011.
   *
   * @param   {LatLon.datum} [datum=WGS84] - Datum to convert grid reference into.
   * @returns {LatLon}       Latitude/longitude of supplied grid reference.
   *
   * @example
   *   const gridref = new OsGridRef(651409.903, 313177.270);
   *   const pWgs84 = gridref.toLatLon();                    // 52°39′28.723″N, 001°42′57.787″E
   *   // to obtain (historical) OSGB36 lat/lon point:
   *   const pOsgb = gridref.toLatLon(LatLon.datums.OSGB36); // 52°39′27.253″N, 001°43′04.518″E
   */
  toLatLon(datum = LatLonEllipsoidal_Datum.datums.WGS84) {
    const { easting: E, northing: N } = this

    const { a, b } = nationalGrid.ellipsoid // a = 6377563.396, b = 6356256.909
    const φ0 = nationalGrid.trueOrigin.lat.toRadians() // latitude of true origin, 49°N
    const λ0 = nationalGrid.trueOrigin.lon.toRadians() // longitude of true origin, 2°W
    const E0 = -nationalGrid.falseOrigin.easting // easting of true origin, 400km
    const N0 = -nationalGrid.falseOrigin.northing // northing of true origin, -100km
    const F0 = nationalGrid.scaleFactor // 0.9996012717

    const e2 = 1 - (b * b) / (a * a) // eccentricity squared
    const n = (a - b) / (a + b),
      n2 = n * n,
      n3 = n * n * n // n, n², n³

    let φ = φ0,
      M = 0
    do {
      φ = (N - N0 - M) / (a * F0) + φ

      const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (φ - φ0)
      const Mb = (3 * n + 3 * n * n + (21 / 8) * n3) * Math.sin(φ - φ0) * Math.cos(φ + φ0)
      const Mc = ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (φ - φ0)) * Math.cos(2 * (φ + φ0))
      const Md = (35 / 24) * n3 * Math.sin(3 * (φ - φ0)) * Math.cos(3 * (φ + φ0))
      M = b * F0 * (Ma - Mb + Mc - Md) // meridional arc
    } while (Math.abs(N - N0 - M) >= 0.00001) // ie until < 0.01mm

    const cosφ = Math.cos(φ),
      sinφ = Math.sin(φ)
    const ν = (a * F0) / Math.sqrt(1 - e2 * sinφ * sinφ) // nu = transverse radius of curvature
    const ρ = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinφ * sinφ, 1.5) // rho = meridional radius of curvature
    const η2 = ν / ρ - 1 // eta = ?

    const tanφ = Math.tan(φ)
    const tan2φ = tanφ * tanφ,
      tan4φ = tan2φ * tan2φ,
      tan6φ = tan4φ * tan2φ
    const secφ = 1 / cosφ
    const ν3 = ν * ν * ν,
      ν5 = ν3 * ν * ν,
      ν7 = ν5 * ν * ν
    const VII = tanφ / (2 * ρ * ν)
    const VIII = (tanφ / (24 * ρ * ν3)) * (5 + 3 * tan2φ + η2 - 9 * tan2φ * η2)
    const IX = (tanφ / (720 * ρ * ν5)) * (61 + 90 * tan2φ + 45 * tan4φ)
    const X = secφ / ν
    const XI = (secφ / (6 * ν3)) * (ν / ρ + 2 * tan2φ)
    const XII = (secφ / (120 * ν5)) * (5 + 28 * tan2φ + 24 * tan4φ)
    const XIIA = (secφ / (5040 * ν7)) * (61 + 662 * tan2φ + 1320 * tan4φ + 720 * tan6φ)

    const dE = E - E0,
      dE2 = dE * dE,
      dE3 = dE2 * dE,
      dE4 = dE2 * dE2,
      dE5 = dE3 * dE2,
      dE6 = dE4 * dE2,
      dE7 = dE5 * dE2
    φ = φ - VII * dE2 + VIII * dE4 - IX * dE6
    const λ = λ0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7

    let point = new LatLon_OsGridRef(
      φ.toDegrees(),
      λ.toDegrees(),
      0,
      LatLonEllipsoidal_Datum.datums.OSGB36,
    )

    if (datum != LatLonEllipsoidal_Datum.datums.OSGB36) {
      // if point is required in datum other than OSGB36, convert it
      point = point.convertDatum(datum)
      // convertDatum() gives us a LatLon: convert to LatLon_OsGridRef which includes toOsGrid()
      point = new LatLon_OsGridRef(point.lat, point.lon, point.height, point.datum)
    }

    return point
  }

  /**
   * Parses grid reference to OsGridRef object.
   *
   * Accepts standard grid references (eg 'SU 387 148'), with or without whitespace separators, from
   * two-digit references up to 10-digit references (1m × 1m square), or fully numeric comma-separated
   * references in metres (eg '438700,114800').
   *
   * @param   {string}    gridref - Standard format OS Grid Reference.
   * @returns {OsGridRef} Numeric version of grid reference in metres from false origin (SW corner of
   *   supplied grid square).
   * @throws  {Error}     Invalid grid reference.
   *
   * @example
   *   const grid = OsGridRef.parse('TG 51409 13177'); // grid: { easting: 651409, northing: 313177 }
   */
  static parse(gridref) {
    gridref = String(gridref).trim()

    // check for fully numeric comma-separated gridref format
    let match = gridref.match(/^(\d+),\s*(\d+)$/)
    if (match) return new OsGridRef(match[1], match[2])

    // validate format
    match = gridref.match(/^[HNST][ABCDEFGHJKLMNOPQRSTUVWXYZ]\s*[0-9]+\s*[0-9]+$/i)
    if (!match) throw new Error(`invalid grid reference ‘${gridref}’`)

    // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
    let l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) // 500km square
    let l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0) // 100km square
    // shuffle down letters after 'I' since 'I' is not used in grid:
    if (l1 > 7) l1--
    if (l2 > 7) l2--

    // convert grid letters into 100km-square indexes from false origin (grid square SV):
    const e100km = ((l1 - 2) % 5) * 5 + (l2 % 5)
    const n100km = 19 - Math.floor(l1 / 5) * 5 - Math.floor(l2 / 5)

    // skip grid letters to get numeric (easting/northing) part of ref
    let en = gridref.slice(2).trim().split(/\s+/)
    // if e/n not whitespace separated, split half way
    if (en.length == 1) en = [en[0].slice(0, en[0].length / 2), en[0].slice(en[0].length / 2)]

    // validation
    if (en[0].length != en[1].length) throw new Error(`invalid grid reference ‘${gridref}’`)

    // standardise to 10-digit refs (metres)
    en[0] = en[0].padEnd(5, '0')
    en[1] = en[1].padEnd(5, '0')

    const e = e100km + en[0]
    const n = n100km + en[1]

    return new OsGridRef(e, n)
  }

  /**
   * Converts ‘this’ numeric grid reference to standard OS Grid Reference.
   *
   * @param   {number} [digits=10] - Precision of returned grid reference (10 digits = metres);
   *   digits=0 will return grid reference in numeric format.
   * @returns {string} This grid reference in standard format.
   *
   * @example
   *   const gridref = new OsGridRef(651409, 313177).toString(8); // 'TG 5140 1317'
   *   const gridref = new OsGridRef(651409, 313177).toString(0); // '651409,313177'
   */
  toString(digits = 10) {
    if (![0, 2, 4, 6, 8, 10, 12, 14, 16].includes(Number(digits)))
      throw new RangeError(`invalid precision ‘${digits}’`) // eslint-disable-line comma-spacing

    let { easting: e, northing: n } = this

    // use digits = 0 to return numeric format (in metres) - note northing may be >= 1e7
    if (digits == 0) {
      const format = { useGrouping: false, minimumIntegerDigits: 6, maximumFractionDigits: 3 }
      const ePad = e.toLocaleString('en', format)
      const nPad = n.toLocaleString('en', format)
      return `${ePad},${nPad}`
    }

    // get the 100km-grid indices
    const e100km = Math.floor(e / 100000),
      n100km = Math.floor(n / 100000)

    // translate those into numeric equivalents of the grid letters
    let l1 = 19 - n100km - ((19 - n100km) % 5) + Math.floor((e100km + 10) / 5)
    let l2 = (((19 - n100km) * 5) % 25) + (e100km % 5)

    // compensate for skipped 'I' and build grid letter-pairs
    if (l1 > 7) l1++
    if (l2 > 7) l2++
    const letterPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0))

    // strip 100km-grid indices from easting & northing, and reduce precision
    e = Math.floor((e % 100000) / Math.pow(10, 5 - digits / 2))
    n = Math.floor((n % 100000) / Math.pow(10, 5 - digits / 2))

    // pad eastings & northings with leading zeros
    e = e.toString().padStart(digits / 2, '0')
    n = n.toString().padStart(digits / 2, '0')

    return `${letterPair} ${e} ${n}`
  }
}

/* LatLon_OsGridRef - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/**
 * Extends LatLon class with method to convert LatLon point to OS Grid Reference.
 *
 * @extends LatLonEllipsoidal
 */
class LatLon_OsGridRef extends LatLonEllipsoidal_Datum {
  /**
   * Converts latitude/longitude to Ordnance Survey grid reference easting/northing coordinate.
   *
   * @returns {OsGridRef} OS Grid Reference easting/northing.
   *
   * @example
   *   const grid = new LatLon(52.65798, 1.71605).toOsGrid(); // TG 51409 13177
   *   // for conversion of (historical) OSGB36 latitude/longitude point:
   *   const grid = new LatLon(52.65798, 1.71605).toOsGrid(LatLon.datums.OSGB36);
   */
  toOsGrid() {
    // if necessary convert to OSGB36 first
    const point =
      this.datum == LatLonEllipsoidal_Datum.datums.OSGB36
        ? this
        : this.convertDatum(LatLonEllipsoidal_Datum.datums.OSGB36)

    const φ = point.lat.toRadians()
    const λ = point.lon.toRadians()

    const { a, b } = nationalGrid.ellipsoid // a = 6377563.396, b = 6356256.909
    const φ0 = nationalGrid.trueOrigin.lat.toRadians() // latitude of true origin, 49°N
    const λ0 = nationalGrid.trueOrigin.lon.toRadians() // longitude of true origin, 2°W
    const E0 = -nationalGrid.falseOrigin.easting // easting of true origin, 400km
    const N0 = -nationalGrid.falseOrigin.northing // northing of true origin, -100km
    const F0 = nationalGrid.scaleFactor // 0.9996012717

    const e2 = 1 - (b * b) / (a * a) // eccentricity squared
    const n = (a - b) / (a + b),
      n2 = n * n,
      n3 = n * n * n // n, n², n³

    const cosφ = Math.cos(φ),
      sinφ = Math.sin(φ)
    const ν = (a * F0) / Math.sqrt(1 - e2 * sinφ * sinφ) // nu = transverse radius of curvature
    const ρ = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinφ * sinφ, 1.5) // rho = meridional radius of curvature
    const η2 = ν / ρ - 1 // eta = ?

    const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (φ - φ0)
    const Mb = (3 * n + 3 * n * n + (21 / 8) * n3) * Math.sin(φ - φ0) * Math.cos(φ + φ0)
    const Mc = ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (φ - φ0)) * Math.cos(2 * (φ + φ0))
    const Md = (35 / 24) * n3 * Math.sin(3 * (φ - φ0)) * Math.cos(3 * (φ + φ0))
    const M = b * F0 * (Ma - Mb + Mc - Md) // meridional arc

    const cos3φ = cosφ * cosφ * cosφ
    const cos5φ = cos3φ * cosφ * cosφ
    const tan2φ = Math.tan(φ) * Math.tan(φ)
    const tan4φ = tan2φ * tan2φ

    const I = M + N0
    const II = (ν / 2) * sinφ * cosφ
    const III = (ν / 24) * sinφ * cos3φ * (5 - tan2φ + 9 * η2)
    const IIIA = (ν / 720) * sinφ * cos5φ * (61 - 58 * tan2φ + tan4φ)
    const IV = ν * cosφ
    const V = (ν / 6) * cos3φ * (ν / ρ - tan2φ)
    const VI = (ν / 120) * cos5φ * (5 - 18 * tan2φ + tan4φ + 14 * η2 - 58 * tan2φ * η2)

    const Δλ = λ - λ0
    const Δλ2 = Δλ * Δλ,
      Δλ3 = Δλ2 * Δλ,
      Δλ4 = Δλ3 * Δλ,
      Δλ5 = Δλ4 * Δλ,
      Δλ6 = Δλ5 * Δλ

    let N = I + II * Δλ2 + III * Δλ4 + IIIA * Δλ6
    let E = E0 + IV * Δλ + V * Δλ3 + VI * Δλ5

    N = Number(N.toFixed(3)) // round to mm precision
    E = Number(E.toFixed(3))

    try {
      return new OsGridRef(E, N) // note: gets truncated to SW corner of 1m grid square
    } catch (e) {
      throw new Error(
        `${e.message} from (${point.lat.toFixed(6)},${point.lon.toFixed(6)}).toOsGrid()`,
      )
    }
  }

  /**
   * Override LatLonEllipsoidal.convertDatum() with version which returns LatLon_OsGridRef.
   */
  convertDatum(toDatum) {
    const osgbED = super.convertDatum(toDatum) // returns LatLonEllipsoidal_Datum
    const osgbOSGR = new LatLon_OsGridRef(osgbED.lat, osgbED.lon, osgbED.height, osgbED.datum)
    return osgbOSGR
  }
}

exports.Dms = Dms
exports.LatLon = LatLon_OsGridRef
exports['default'] = OsGridRef
