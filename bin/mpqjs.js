#!/usr/bin/env node
'use strict';

var args
  , c
  , mpq
  , mpqFile
  , archive
  , user
  , userVars = [
      "magic"
    , "userDataSize"
    , "mpqHeaderOffset"
    , "userDataHeaderSize"
    , "content"
  ]


args = process.argv.slice(2)
mpq = require('../lib/mpq.js')


if (args[0] === "-I") {
  if (args[1] !== undefined) {
    mpqFile = new mpq(args[1])
    mpqFile.printHeaders()

  }
  else {
    console.error("Please specify a [filename] for -I")
    process.exit(1)
  }
}
else {
  console.error("Please use 'mpqjs -I [filename]'")
  process.exit(1)
}


// MPQ archive header
// ------------------
// magic                          'MPQ\x1a'
// header_size                    44
// archive_size                   232992
// format_version                 1
// sector_size_shift              3
// hashTableOffset              232576
// blockTableOffset             232832
// hashTable_entries             16
// blockTable_entries            10
// extended_blockTableOffset    0
// hashTableOffset_high         0
// blockTableOffset_high        0
// offset                         1024

// MPQ user data header
// --------------------
// magic                          'MPQ\x1b'
// user_data_size                 512
// mpq_headerOffset              1024
// user_data_header_size          60
// content                        '\x05\x08\x00\x02,StarCraft II replay\x1b11\x02\x05\x0c\x00\t\x02\x02\t\x02\x04\t\x08\x06\t\x04\x08\t\xda\xba\x02\n\t\xbe\xb3\x02\x04\t\x04\x06\t\xfe\xd1\x02'
