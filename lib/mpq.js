'use strict';

var fs = require('fs')
  , VERSION = "0.0.1"

module.exports = (function(undefined) {

  var mpq
    , archiveHeader
    , userDataHeader
    , formatChar
    , split256
    , repeat
    , padLeft
    , padRight
    , archiveVars = [ 
        "magic"
      , "headerSize"
      , "archiveSize"
      , "formatVersion"
      , "sectorSizeShift"
      , "hashTableOffset"
      , "blockTableOffset"
      , "hashTableEntries"
      , "blockTableEntries"
      , "extendedBlockTableOffset"
      , "hashTableOffsetHigh"
      , "blockTableOffsetHigh"
    ]
    , userVars = [
        "magic"
      , "userDataSize"
      , "mpqHeaderOffset"
      , "userDataHeaderSize"
      , "content"
    ]


  formatChar = function(h) {
    h = Number(h)
    if ((h >= 65 && h <= 90) || (h >= 97 && h <= 122) || h === 32) {
      return String.fromCharCode(parseInt(h, 10))
    }
    else {
      return "\\x" + padLeft(h.toString(16), 2, "0")
    }
  }

  repeat = function(str, n) {
    return new Array(n + 1).join(str);
  }

  padRight = function(str, n, c) {
    c = c || " "
    return (str + repeat(c, n)).slice(0, n)
  }

  padLeft = function(str, n, c) {
    c = c || " "
    return (repeat(c, n) + str).slice(-n)
  }

  // splits a number into its base 256 (2 digit hex)
  // returns base 10 numbers
  split256 = function(num) {
    var res = []
      , c
    while ((c = (num % 256)) != 0) {
      res.unshift(c)
      num = ~~(num / 256)

    }
    return res
  }

  archiveHeader = function() {}
  archiveHeader.prototype.getArchiveHeader = function(buff) {
    var i = -512
      , readBuf = 0
      , headerLoc = -1
      , headerSize
      , archiveSize
      , formatVersion
      , sectorSizeShift
      , hashTableOffset
      , blockTableOffset
      , hashTableEntries
      , blockTableEntries
      , extendedBlockTableOffset
      , hashTableOffsetHigh
      , blockTableOffsetHigh
      , magic

    try {
      while (readBuf != 441536589) {
        i += 512 // look for the header every 512 sectors
        readBuf = buff.readInt32LE(i)
      }
      // 1297109274
      magic = split256(buff.readInt32BE(i)).map(formatChar).join("")
      headerSize = buff.readInt32LE(i+4)
      archiveSize = buff.readInt32LE(i+8)
      formatVersion = buff.readInt16LE(i+parseInt("0xC"))
      if (formatVersion === 0 && headerSize !== 32) { // version 0 needs to have header size of 32
        throw new Error("MPQ format version is 0, but header size isn't 0x20 (32), it is " + headerSize)
      }
      if (formatVersion === 1 && headerSize !== 44) { // version 1 needs to have header size of 44
        throw new Error("MPQ format version is 1, but header size isn't 0x2C (44), it is " + headerSize)
      }
      sectorSizeShift = buff.readInt8(i+parseInt("0x0E"))
      hashTableOffset = buff.readInt32LE(i+parseInt("0x10"))
      blockTableOffset = buff.readInt32LE(i+parseInt("0x14"))
      hashTableEntries = buff.readInt32LE(i+parseInt("0x18"))
      blockTableEntries = buff.readInt32LE(i+parseInt("0x1C"))
      extendedBlockTableOffset = buff.readInt32LE(i+parseInt("0x20"))
      hashTableOffsetHigh = buff.readInt16LE(i+parseInt("0x28"))
      blockTableOffsetHigh = buff.readInt16LE(i+parseInt("0x2A"))
    }
    catch (e) {
      if (e.name === "RangeError") {
        throw new Error("Sorry, could not find MPQ header in this file")
      }
      throw e
    }

    return {
        magic: magic
      , headerSize: headerSize
      , archiveSize: archiveSize
      , formatVersion: formatVersion
      , sectorSizeShift: sectorSizeShift
      , hashTableOffset: hashTableOffset
      , blockTableOffset: blockTableOffset
      , hashTableEntries: hashTableEntries
      , blockTableEntries: blockTableEntries
      , extendedBlockTableOffset: extendedBlockTableOffset
      , hashTableOffsetHigh: hashTableOffsetHigh
      , blockTableOffsetHigh: blockTableOffsetHigh
    }
  }
  
  userDataHeader = function() {}
  userDataHeader.prototype.convertContent = function(content) {
      var jsonBuf = content.toJSON()
      return jsonBuf.map(formatChar).join("")
  }
  userDataHeader.prototype.getUserDataHeader = function(buff) {
    var i = -1
      , readBuf = 0
      , headerLoc = -1
      , magic
      , userDataSize
      , mpqHeaderOffset
      , userDataHeaderSize
      , content

    try {
      while (readBuf != 458313805) {
        i += 1
        readBuf = buff.readInt32LE(i)
      }
      headerLoc = i
    }
    catch (e) {
      if (e.name === "RangeError") {
        throw new Error("Sorry, could not find user data header in this file")
      }
      throw e
    }
    magic = split256(buff.readInt32BE(headerLoc)).map(formatChar).join("")
    userDataSize = buff.readInt32LE(headerLoc + parseInt("0x04"))
    mpqHeaderOffset = buff.readInt32LE(headerLoc + parseInt("0x08"))
    userDataHeaderSize = buff.readInt32LE(headerLoc + parseInt("0x0C"))
    content = this.convertContent(buff.slice(headerLoc + parseInt("0x0C") + 4, headerLoc + parseInt("0x0c") + userDataHeaderSize + 4))


    return {
        magic: magic
      , userDataSize: userDataSize
      , mpqHeaderOffset: mpqHeaderOffset
      , userDataHeaderSize: userDataHeaderSize
      , content: content
    }

  }


  mpq = function(filename) {
    this.version = VERSION
    if (filename) {
      this.filename = filename
      this.open(filename)
    }
    this.userHeader = new userDataHeader()
    this.archiveHeader = new archiveHeader()
  }
  mpq.prototype.getUserDataHeader = function() {
    return this.userHeader.getUserDataHeader(this.contents)
  }
  mpq.prototype.getArchiveHeader = function() {
    return this.archiveHeader.getArchiveHeader(this.contents)
  }
  mpq.prototype.printHeaders = function() {
    var archive = this.getArchiveHeader()
      , user = this.getUserDataHeader()

    console.log("MPQ archive header")
    console.log("------------------")

    archiveVars.forEach(function(a) {
      console.log(padRight(a, 31) + archive[a])
    })
    console.log("")
    console.log("MPQ user data header")
    console.log("--------------------")
    userVars.forEach(function(a) {
      console.log(padRight(a, 31) + user[a])
    })

  }
  mpq.prototype.open = function(filename, callback) {
    try {
      this.contents = fs.readFileSync(filename)
    }
    catch (e) {
      callback(e)
    }
    if (!callback) {
      return this      
    }
    else {
      callback(null, this.contents)
    }


  }
  return mpq
}())
